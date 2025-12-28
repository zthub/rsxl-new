import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameComponentProps } from '../../types';
import {
  createEmptyGrid,
  getRandomTetromino,
  checkCollision,
  rotateMatrix,
  getHardDropPosition,
  getActualShapeBounds,
} from './tetrisGameLogic';
import { Grid, ActivePiece } from './tetrisTypes';
import { BOARD_WIDTH, BOARD_HEIGHT, SCORES } from './tetrisConstants';
import TetrisBlock from './TetrisBlock';
import { RotateCw, Play, ArrowDown } from 'lucide-react';
import { playSound } from '../../utils/gameUtils';

export const NewTetrisGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver }) => {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [activePiece, setActivePiece] = useState<ActivePiece>(getRandomTetromino());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [ghostY, setGhostY] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Initialize game
  useEffect(() => {
    if (isPlaying && !initializedRef.current) {
      initializedRef.current = true;
      resetGame();
    }
  }, [isPlaying]);

  const resetGame = () => {
    setGrid(createEmptyGrid());
    const firstPiece = getRandomTetromino();
    setActivePiece(firstPiece);
    setScore(0);
    setGameOver(false);
  };

  // Update ghost piece position
  useEffect(() => {
    if (gameOver || !isPlaying) return;
    const dropDist = getHardDropPosition(activePiece, grid);
    setGhostY(activePiece.position.y + dropDist);
  }, [activePiece, grid, gameOver, isPlaying]);

  const spawnNewPiece = (currentGrid: Grid) => {
    const newPiece = getRandomTetromino();
    
    // Check if spawn point is blocked
    if (checkCollision(newPiece, currentGrid)) {
      setGameOver(true);
      if (onGameOver) onGameOver();
    } else {
      setActivePiece(newPiece);
    }
  };

  const handleRotate = useCallback(() => {
    if (gameOver || !isPlaying) return;

    const rotatedShape = rotateMatrix(activePiece.shape);
    const newPiece = {
      ...activePiece,
      shape: rotatedShape,
      rotation: (activePiece.rotation + 1) % 4,
    };

    let offset = 0;
    if (checkCollision(newPiece, grid, 0, 0)) {
      if (!checkCollision(newPiece, grid, 1, 0)) offset = 1;
      else if (!checkCollision(newPiece, grid, -1, 0)) offset = -1;
      else if (!checkCollision(newPiece, grid, 0, -1)) {
        // Kick up logic if needed
      } else {
        return; // Cannot rotate
      }
    }

    setActivePiece({
      ...newPiece,
      position: { ...newPiece.position, x: newPiece.position.x + offset },
    });
    playSound('shoot');
  }, [activePiece, grid, gameOver, isPlaying]);

  const handleDrag = useCallback(
    (targetGridX: number, targetGridY: number) => {
      if (gameOver || !isPlaying) return;

      const { minX, maxX, minY, maxY } = getActualShapeBounds(activePiece.shape);
      
      const minPossibleX = -minX;
      const maxPossibleX = BOARD_WIDTH - 1 - maxX;
      const minPossibleY = -minY;
      const maxPossibleY = BOARD_HEIGHT - 1 - maxY;

      let newX = targetGridX;
      let newY = targetGridY;
      
      if (newX < minPossibleX) newX = minPossibleX;
      if (newX > maxPossibleX) newX = maxPossibleX;
      if (newY < minPossibleY) newY = minPossibleY;
      if (newY > maxPossibleY) newY = maxPossibleY;

      if (!checkCollision({ ...activePiece, position: { ...activePiece.position, x: newX, y: newY } }, grid)) {
        setActivePiece((prev) => ({
          ...prev,
          position: { ...prev.position, x: newX, y: newY },
        }));
      }
    },
    [activePiece, grid, gameOver, isPlaying]
  );

  const handleDrop = useCallback(() => {
    if (gameOver || !isPlaying) return;

    const dropDist = getHardDropPosition(activePiece, grid);
    const landedY = activePiece.position.y + dropDist;

    const newGrid = grid.map((row) => [...row]);
    activePiece.shape.forEach((row, dy) => {
      row.forEach((val, dx) => {
        if (val !== 0) {
          const y = landedY + dy;
          const x = activePiece.position.x + dx;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            newGrid[y][x] = {
              filled: true,
              color: activePiece.color,
              emoji: activePiece.emoji,
            };
          }
        }
      });
    });

    let linesCleared = 0;
    const clearedGrid = newGrid.filter((row) => {
      const isFull = row.every((cell) => cell.filled);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (clearedGrid.length < BOARD_HEIGHT) {
      clearedGrid.unshift(Array(BOARD_WIDTH).fill({ filled: false }));
    }

    if (linesCleared > 0) {
      let points = 0;
      if (linesCleared === 1) points = SCORES.SINGLE;
      else if (linesCleared === 2) points = SCORES.DOUBLE;
      else if (linesCleared === 3) points = SCORES.TRIPLE;
      else if (linesCleared === 4) points = SCORES.TETRIS;
      const newScore = score + points;
      setScore(newScore);
      if (onScore) onScore(points);
      playSound('correct');
    } else {
      playSound('shoot');
    }

    setGrid(clearedGrid);
    spawnNewPiece(clearedGrid);
  }, [activePiece, grid, gameOver, isPlaying, score, onScore]);

  // Handle Drag Input
  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameOver || !isPlaying || !boardRef.current) return;

    e.preventDefault();

    const rect = boardRef.current.getBoundingClientRect();
    const cellWidth = rect.width / BOARD_WIDTH;
    const cellHeight = rect.height / BOARD_HEIGHT;
    
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    const rawGridX = Math.floor(relativeX / cellWidth);
    const rawGridY = Math.floor(relativeY / cellHeight);
    
    const pieceWidth = activePiece.shape[0].length;
    const pieceHeight = activePiece.shape.length;
    const centerOffsetX = Math.floor(pieceWidth / 2);
    const centerOffsetY = Math.floor(pieceHeight / 2);
    
    handleDrag(rawGridX - centerOffsetX, rawGridY - centerOffsetY);
  };

  // Render grid
  const renderGrid = () => {
    const displayGrid = grid.map((row) => row.map((cell) => ({ ...cell, isGhost: false, isActive: false })));

    if (!gameOver && isPlaying) {
        // Draw Ghost Piece
        activePiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
            if (value !== 0) {
                const y = ghostY + dy;
                const x = activePiece.position.x + dx;
                if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
                    displayGrid[y][x] = { ...displayGrid[y][x], isGhost: true };
                }
            }
            });
        });

        // Draw Active Piece
        activePiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
            if (value !== 0) {
                const y = activePiece.position.y + dy;
                const x = activePiece.position.x + dx;
                if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
                    displayGrid[y][x] = {
                        filled: true,
                        color: activePiece.color,
                        emoji: activePiece.emoji,
                        isGhost: false,
                        isActive: true,
                    };
                }
            }
            });
        });
    }

    return displayGrid;
  };

  const displayGrid = renderGrid();

  // Calculate board size based on available space - ensure all columns visible on mobile
  const isLandscape = width > height;
  const isMobile = width <= 768;
  const isTablet = width <= 1024 && width > 768;
  const aspectRatio = BOARD_WIDTH / BOARD_HEIGHT;
  
  // 激进移动端适配：手机使用更多空间，确保所有10列完全可见
  let widthPadding, heightPadding, headerHeight;
  
  if (isMobile) {
    // 手机端：最大化利用空间，确保10列完全显示
    widthPadding = 0.99;
    heightPadding = 0.95;
    headerHeight = 50; // 减少头部空间
  } else if (isTablet) {
    // 平板端：适当增加空间
    widthPadding = 0.96;
    heightPadding = 0.90;
    headerHeight = 70;
  } else {
    // 电脑端：保持原有空间分配
    widthPadding = 0.75;
    heightPadding = 0.75;
    headerHeight = 80;
  }
  
  const availableWidth = width * widthPadding;
  const availableHeight = height * heightPadding - headerHeight;
  
  // 激进移动端适配策略：优先保证宽度，必要时调整宽高比
  let boardWidth, boardHeight;
  
  // 平板横屏模式检测
  const isTabletLandscape = isTablet && isLandscape;
  
  if (isMobile || isTabletLandscape) {
    // 手机端和平板横屏模式：强制宽度优先，确保所有10列可见
    boardWidth = availableWidth;
    boardHeight = boardWidth / aspectRatio;
    
    // 如果高度超出，按可用高度重新计算
    if (boardHeight > availableHeight) {
      boardHeight = availableHeight;
      boardWidth = boardHeight * aspectRatio;
    }
    
    // 最终检查：确保宽度不超过可用宽度
    boardWidth = Math.min(boardWidth, availableWidth);
  } else if (isTablet) {
    // 平板竖屏模式：平衡显示
    const maxWidthByHeight = availableHeight * aspectRatio;
    boardWidth = Math.min(availableWidth, maxWidthByHeight);
    boardHeight = boardWidth / aspectRatio;
  } else {
    // 电脑端：标准计算
    const maxWidthByHeight = availableHeight * aspectRatio;
    boardWidth = Math.min(availableWidth, maxWidthByHeight);
    boardHeight = boardWidth / aspectRatio;
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${
      isMobile ? 'p-0.5' : (isTablet ? 'p-1' : 'p-2')
    }`} style={{ backgroundColor: '#f0f4f8' }}>
      {/* Game Board Area */}
      <div
        ref={boardRef}
        className={`relative bg-white/90 backdrop-blur-md overflow-hidden shadow-inner touch-none ${
          isMobile ? 'border border-indigo-200 rounded-md' : 
          isTablet ? 'border-2 border-indigo-200 rounded-lg' : 
          'border-4 border-indigo-200 rounded-xl'
        }`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
          aspectRatio: `${BOARD_WIDTH}/${BOARD_HEIGHT}`,
          // width: `${boardWidth}px`,
          // height: `${boardHeight}px`,
          maxWidth: isMobile ? '100vw' : (isTablet ? '99vw' : '98vw'),
          maxHeight: isMobile ? '100vh' : (isTablet ? '99vh' : '98vh'),
        }}
        onPointerMove={(e) => {
            if(e.buttons > 0) handlePointerMove(e)
        }}
        onPointerDown={handlePointerMove}
      >
        {displayGrid.map((row, y) =>
          row.map((cell, x) => (
            <div key={`${y}-${x}`} className="w-full h-full p-[1px]">
              <TetrisBlock color={cell.color} emoji={cell.emoji} isGhost={cell.isGhost} />
            </div>
          ))
        )}

        {/* Game Over Modal */}
        {gameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border-8 border-yellow-300">
              <h2 className="text-4xl font-black text-purple-500 mb-2">Great Job!</h2>
              <p className="text-gray-500 mb-6">You scored {score} points!</p>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-8 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 mx-auto"
              >
                <Play size={28} fill="currentColor" /> Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Bottom Right */}
      {!gameOver && isPlaying && (
        <div className="absolute bottom-8 right-8 flex gap-6 pointer-events-none z-10">
          <button
            onClick={handleRotate}
            className="pointer-events-auto w-16 h-16 bg-blue-500/90 hover:bg-blue-600 text-white rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center border-2 border-white"
            title="Rotate Piece"
          >
            <RotateCw size={32} strokeWidth={3} />
          </button>

          <button
            onClick={handleDrop}
            className="pointer-events-auto w-16 h-16 bg-amber-500/90 hover:bg-amber-600 text-white rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center border-2 border-white"
            title="Drop Piece"
          >
            <ArrowDown size={32} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
};

