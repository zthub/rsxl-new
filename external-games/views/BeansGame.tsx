import React, { useState, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import GameLayout from '../components/GameLayout';
import GameResultModal from '../components/GameResultModal';
import { DateIcon, RedBeanIcon } from '../components/GameAssets';
import { Trophy } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const ROWS = 7;
const COLS = 8;

const BeansGame: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize a round
  const generateRound = useCallback(() => {
    const totalItems = ROWS * COLS;
    setTargetIndex(Math.floor(Math.random() * totalItems));
    setGameState(GameState.PLAYING);
    setIsSuccess(false);
  }, []);

  // Initial Start
  useEffect(() => {
    generateRound();
  }, [generateRound]);

  const handleItemClick = (index: number) => {
    if (gameState !== GameState.PLAYING || isSuccess) return;

    if (index === targetIndex) {
      // Correct!
      setIsSuccess(true);
      // Brief delay before next level
      setTimeout(() => {
        setScore(s => s + 1);
        generateRound();
      }, 500);
    } else {
      // Wrong! Game Over instantly.
      setGameState(GameState.GAME_OVER);
    }
  };

  const handleRestart = () => {
    setScore(0);
    generateRound();
  };

  return (
    <GameLayout 
      title="找红豆" 
      level={score} 
      onBack={onBack}
      bgColorClass="bg-red-50"
      customHeader={
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-red-100 px-4 py-1 rounded-full border border-red-200">
                <Trophy className="text-yellow-600" size={20} />
                <span className="text-red-900 font-mono font-bold text-xl">{score}</span>
            </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 py-2">
        <div 
          className="grid gap-2 md:gap-3 p-4 bg-white/40 rounded-3xl shadow-sm border border-white/50"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          {Array.from({ length: ROWS * COLS }).map((_, i) => {
            const isTarget = i === targetIndex;
            return (
              <div key={i} className="relative w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center">
                <div className={`w-full h-full transition-all duration-300 ${isTarget && isSuccess ? 'scale-125 brightness-110 drop-shadow-xl z-10' : ''}`}>
                    {isTarget ? (
                        <RedBeanIcon 
                            className="w-full h-full" 
                            onClick={() => handleItemClick(i)} 
                        />
                    ) : (
                        <DateIcon 
                            className="w-full h-full opacity-90" 
                            onClick={() => handleItemClick(i)} 
                        />
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <GameResultModal
        gameState={gameState}
        onRestart={handleRestart}
        onHome={onBack}
        message={gameState === GameState.GAME_OVER ? `哎呀，找错了！你一共找到了 ${score} 颗红豆。` : undefined}
      />
    </GameLayout>
  );
};

export default BeansGame;