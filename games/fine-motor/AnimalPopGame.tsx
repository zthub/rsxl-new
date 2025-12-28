import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types';
import { Play } from 'lucide-react';
import { PopGrid, PopBlock } from './tetrisTypes';
import { BOARD_WIDTH, BOARD_HEIGHT, POP_GAME_CONSTANTS, POP_BLOCK_TYPES } from './tetrisConstants';
import {
  initPopGameGrid,
  findConnectedGroup,
  applyGravity,
  getRandomPopBlock,
  checkGameOver,
} from './popGameLogic';
import TetrisBlock from './TetrisBlock';
import { playSound } from '../../utils/gameUtils';

export const AnimalPopGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver }) => {
  const [grid, setGrid] = useState<PopGrid>(initPopGameGrid());
  const [pendingBlocks, setPendingBlocks] = useState<(PopBlock | null)[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const initializedRef = useRef(false);

  // Initialize game
  useEffect(() => {
    if (isPlaying && !initializedRef.current) {
      initializedRef.current = true;
      resetGame();
    }
  }, [isPlaying]);

  // Initialize pending row (empty)
  useEffect(() => {
    if (isPlaying) {
      setPendingBlocks(Array(BOARD_WIDTH).fill(null));
    }
  }, [isPlaying]);

  // Bottom Row Generation Loop
  useEffect(() => {
    if (gameOver || !isPlaying) return;

    const spawnBlock = () => {
      setPendingBlocks((prev) => {
        const next = [...prev];
        // Find a random empty spot in pending row
        const emptyIndices = next.map((b, i) => (b === null ? i : -1)).filter((i) => i !== -1);
        
        if (emptyIndices.length > 0) {
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          next[randomIndex] = getRandomPopBlock();
        }

        // Check if full
        if (next.every((b) => b !== null)) {
            // Trigger board shift
            handleBoardShift(next as PopBlock[]);
            return Array(BOARD_WIDTH).fill(null);
        }

        return next;
      });
    };

    const interval = setInterval(spawnBlock, POP_GAME_CONSTANTS.SPAWN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [grid, gameOver, isPlaying]);

  // Logic to shift board up
  const handleBoardShift = useCallback((fullRow: PopBlock[]) => {
      setGrid((currentGrid) => {
          if (checkGameOver(currentGrid)) {
              setGameOver(true);
              if (onGameOver) onGameOver();
              return currentGrid;
          }
          
          // Remove top row and shift everything up
          const newGrid = currentGrid.slice(1);
          newGrid.push(fullRow);
          return newGrid;
      });
  }, [onGameOver]);

  const handleBlockClick = useCallback((x: number, y: number) => {
    if (gameOver || !isPlaying) return;
    
    // Find connected group
    const group = findConnectedGroup(grid, x, y);
    
    if (group.length >= POP_GAME_CONSTANTS.MIN_GROUP_SIZE) {
        // Remove blocks
        const newGrid = grid.map(row => [...row]);
        group.forEach(({ x: gx, y: gy }) => {
            newGrid[gy][gx] = null;
        });

        // Add score
        const points = (group.length * 10) + ((group.length - 2) * 5);
        const newScore = score + points;
        setScore(newScore);
        if (onScore) onScore(points);
        playSound('correct');

        // Apply Gravity (Vertical + Horizontal Center)
        const gravityGrid = applyGravity(newGrid);
        setGrid(gravityGrid);
    } else if (group.length > 0) {
      playSound('wrong');
    }
  }, [grid, gameOver, isPlaying, score, onScore]);

  const resetGame = () => {
      setGrid(initPopGameGrid());
      setPendingBlocks(Array(BOARD_WIDTH).fill(null));
      setScore(0);
      setGameOver(false);
  };

  // Calculate board size based on available space - ensure all columns visible on mobile
  const isLandscape = width > height;
  const isMobile = width <= 768;
  const isTablet = width <= 1024 && width > 768;
  const aspectRatio = BOARD_WIDTH / BOARD_HEIGHT;
  
  // 激进移动端适配：手机使用更多空间，确保所有10列完全可见
  let widthPadding, heightPadding, headerHeight, pendingRowHeight;
  
  if (isMobile) {
    // 手机端：最大化利用空间，确保10列完全显示
    widthPadding = 0.99;
    heightPadding = 0.95;
    headerHeight = 50; // 减少头部空间
    pendingRowHeight = 30; // 减少待定行高度
  } else if (isTablet) {
    // 平板端：适当增加空间
    widthPadding = 0.96;
    heightPadding = 0.90;
    headerHeight = 70;
    pendingRowHeight = 50;
  } else {
    // 电脑端：保持原有空间分配
    widthPadding = 0.75;
    heightPadding = 0.75;
    headerHeight = 80;
    pendingRowHeight = 60;
  }
  
  const availableHeight = height * heightPadding - headerHeight - pendingRowHeight;
  const availableWidth = width * widthPadding;
  
  // 激进移动端适配策略：优先保证宽度，必要时调整宽高比
  let boardWidth, boardHeight;
  
  if (isMobile) {
    // 手机端：强制宽度优先，确保所有10列可见
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
    // 平板端：平衡显示
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
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${
      isMobile ? 'p-0.5' : (isTablet ? 'p-1' : 'p-2')
    }`} style={{ backgroundColor: '#f0f4f8' }}>
      {/* Game Board Container */}
      <div className="flex flex-col items-center justify-center relative w-full">
        <div 
            className={`relative bg-white/50 backdrop-blur-md overflow-hidden shadow-inner touch-none ${
              isMobile ? 'border-x border-t border-indigo-200 rounded-t-md' : 
              isTablet ? 'border-x-2 border-t-2 border-indigo-200 rounded-t-lg' : 
              'border-x-4 border-t-4 border-indigo-200 rounded-t-xl'
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
        >
            {grid.map((row, y) =>
                row.map((block, x) => (
                <div 
                    key={`${y}-${x}`} 
                    className="w-full h-full p-[1px] cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                    onPointerDown={() => handleBlockClick(x, y)}
                >
                    <TetrisBlock 
                        color={block?.color} 
                        emoji={block?.emoji} 
                    />
                </div>
                ))
            )}
            
            {/* Game Over Overlay */}
            {gameOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-3xl shadow-2xl text-center border-8 border-yellow-300">
                    <h2 className="text-3xl font-black text-purple-500 mb-2">Game Over!</h2>
                    <p className="text-gray-500 mb-4">Score: {score}</p>
                    <button
                    onClick={resetGame}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 mx-auto"
                    >
                    <Play size={24} fill="currentColor" /> Try Again
                    </button>
                </div>
                </div>
            )}
        </div>

        {/* Pending Row Indicator */}
        <div className="bg-indigo-50/50 rounded-b-lg p-1 border-x-4 border-b-4 border-indigo-200 flex h-12 shadow-inner" /*style={{ width: `${boardWidth}px`, maxWidth: '98vw' }}*/>
            {pendingBlocks.map((block, i) => (
                <div key={`pending-${i}`} className="flex-1 p-[1px]">
                  
                     <TetrisBlock color={block?.color} emoji={block?.emoji} grayscale={true} />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

