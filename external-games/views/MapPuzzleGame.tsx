import React, { useState, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import GameLayout from '../components/GameLayout';
import GameResultModal from '../components/GameResultModal';
import { ChinaMapGraphic } from '../components/MapAssets';
import { Trophy, Shuffle, Check } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const LEVEL_CONFIGS = [
  { level: 1, rows: 2, cols: 2 },
  { level: 2, rows: 3, cols: 3 },
  { level: 3, rows: 4, cols: 4 }, // Advanced for kids
];

const MapPuzzleGame: React.FC<Props> = ({ onBack }) => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [tiles, setTiles] = useState<number[]>([]); // Current arrangement of tile IDs
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentConfig = LEVEL_CONFIGS[levelIndex];
  const { rows, cols } = currentConfig;

  // Initialize Level
  const initLevel = useCallback(() => {
    const totalTiles = rows * cols;
    // Create solved array [0, 1, 2...]
    const solved = Array.from({ length: totalTiles }, (_, i) => i);
    
    // Shuffle ensuring it's not already solved
    let shuffled = [...solved];
    do {
       for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } while (shuffled.every((val, index) => val === index));

    setTiles(shuffled);
    setSelectedTileIndex(null);
    setGameState(GameState.PLAYING);
  }, [rows, cols]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Check Win Condition
  useEffect(() => {
    if (gameState === GameState.PLAYING && tiles.length > 0) {
      const isSolved = tiles.every((val, index) => val === index);
      if (isSolved) {
        setGameState(GameState.WON);
      }
    }
  }, [tiles, gameState]);

  const handleTileClick = (index: number) => {
    if (gameState !== GameState.PLAYING || isAnimating) return;

    if (selectedTileIndex === null) {
      // Select first tile
      setSelectedTileIndex(index);
    } else if (selectedTileIndex === index) {
      // Deselect
      setSelectedTileIndex(null);
    } else {
      // Swap!
      const newTiles = [...tiles];
      const temp = newTiles[index];
      newTiles[index] = newTiles[selectedTileIndex];
      newTiles[selectedTileIndex] = temp;
      
      setTiles(newTiles);
      setSelectedTileIndex(null);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleNextLevel = () => {
    if (levelIndex < LEVEL_CONFIGS.length - 1) {
      setLevelIndex(l => l + 1);
    } else {
      // Loop back or stay? Let's stay at max
      initLevel();
    }
  };

  return (
    <GameLayout 
      title="拼地图" 
      level={levelIndex + 1} 
      onBack={onBack}
      bgColorClass="bg-amber-50"
      customHeader={
        <div className="flex items-center gap-2 text-amber-900 bg-amber-200/50 px-4 py-1 rounded-full border border-amber-300">
           <Trophy size={18} className="text-amber-700" />
           <span className="font-bold">{rows} x {cols}</span>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center w-full h-full gap-6">
        
        {/* Game Board */}
        <div className="relative p-2 bg-white rounded-xl shadow-xl border-4 border-amber-200">
             <div 
                className="grid gap-0.5 bg-amber-100"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    width: 'min(90vw, 50vh)', // Keep it square-ish and fitting
                    aspectRatio: '1.2/1', // Map aspect ratio approx
                }}
             >
                {tiles.map((tileId, index) => {
                    // Calculate position of the "Image" part for this tile ID
                    // The tileID represents which part of the original image it is.
                    // If tileId is 0, it wants the top-left chunk.
                    
                    const originRow = Math.floor(tileId / cols);
                    const originCol = tileId % cols;
                    
                    const isSelected = selectedTileIndex === index;
                    const isCorrect = tileId === index; // Visual hint? Maybe too easy.
                    
                    return (
                        <div 
                            key={index}
                            onClick={() => handleTileClick(index)}
                            className={`
                                relative overflow-hidden cursor-pointer transition-all duration-200
                                ${isSelected ? 'ring-4 ring-blue-500 z-10 scale-105' : 'hover:brightness-110'}
                                ${gameState === GameState.WON ? 'ring-0' : ''}
                                bg-amber-50
                            `}
                        >
                            {/* The Map Graphic, scaled up and positioned to show only the relevant chunk */}
                            <div 
                                style={{
                                    width: `${cols * 100}%`,
                                    height: `${rows * 100}%`,
                                    transform: `translate(-${originCol * (100 / cols) * cols}%, -${originRow * (100 / rows) * rows}%)`,
                                    display: 'flex', // Crucial to allow child SVG to size correctly
                                }}
                            >
                                <ChinaMapGraphic />
                            </div>

                            {/* Number Hint (Optional, maybe for easy mode or debugging, kept off for puzzle challenge) */}
                            {/* <span className="absolute top-1 left-1 text-xs text-gray-400">{tileId + 1}</span> */}
                            
                            {/* Selection Overlay */}
                            {isSelected && <div className="absolute inset-0 bg-blue-500/20" />}
                        </div>
                    );
                })}
             </div>
        </div>

        {/* Instructions */}
        {gameState === GameState.PLAYING && (
            <div className="text-amber-800/70 font-medium text-center animate-pulse">
                {selectedTileIndex === null 
                    ? "点击一个方块选中" 
                    : "点击另一个方块交换位置"
                }
            </div>
        )}

      </div>

      <GameResultModal
        gameState={gameState}
        onRestart={initLevel}
        onNextLevel={levelIndex < LEVEL_CONFIGS.length - 1 ? handleNextLevel : undefined}
        onHome={onBack}
        isLastLevel={levelIndex === LEVEL_CONFIGS.length - 1}
        message="太棒了！地图拼完整了！"
      />
    </GameLayout>
  );
};

export default MapPuzzleGame;
