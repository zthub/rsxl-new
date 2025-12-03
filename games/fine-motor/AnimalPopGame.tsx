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
  const aspectRatio = BOARD_WIDTH / BOARD_HEIGHT;
  
  // Reserve space for header and pending row
  const headerHeight = 80;
  const pendingRowHeight = 60;
  
  // 手机端使用更多空间，确保所有10列都能显示
  const widthPadding = isMobile ? 0.98 : 0.75;
  const heightPadding = isMobile ? 0.85 : 0.75;
  
  const availableHeight = height * heightPadding - headerHeight - pendingRowHeight;
  const availableWidth = width * widthPadding;
  
  // Calculate maximum size - 优先保证宽度，确保所有10列都能显示
  const maxWidthByHeight = availableHeight * aspectRatio;
  const maxHeightByWidth = availableWidth / aspectRatio;
  
  // 选择约束：优先保证宽度，确保所有列都能显示
  const boardWidth = Math.min(availableWidth, maxWidthByHeight);
  const boardHeight = boardWidth / aspectRatio;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2" style={{ backgroundColor: '#f0f4f8' }}>
      {/* Game Board Container */}
      <div className="flex flex-col items-center justify-center relative w-full">
        <div 
            className="relative bg-white/50 backdrop-blur-md rounded-t-xl overflow-hidden shadow-inner touch-none border-x-4 border-t-4 border-indigo-200"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
                aspectRatio: `${BOARD_WIDTH}/${BOARD_HEIGHT}`,
                width: `${boardWidth}px`,
                height: `${boardHeight}px`,
                maxWidth: '98vw',
                maxHeight: '98vh',
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
        <div className="bg-indigo-50/50 rounded-b-lg p-1 border-x-4 border-b-4 border-indigo-200 flex h-12 shadow-inner" style={{ width: `${boardWidth}px`, maxWidth: '98vw' }}>
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

