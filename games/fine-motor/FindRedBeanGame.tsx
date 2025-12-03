import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';
import { DateIcon, RedBeanIcon } from './components/GameAssets';
import { Trophy, CheckCircle2, X } from 'lucide-react';

const ROWS = 7;
const COLS = 8;

export const FindRedBeanGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const [score, setScore] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [wrongClickIndex, setWrongClickIndex] = useState<number | null>(null);
  const isFirstStartRef = React.useRef(true);

  // Initialize a round
  const generateRound = useCallback(() => {
    const totalItems = ROWS * COLS;
    setTargetIndex(Math.floor(Math.random() * totalItems));
    setIsSuccess(false);
    setShowVictory(false);
    setWrongClickIndex(null);
  }, []);

  // Initial Start
  useEffect(() => {
    if (isPlaying) {
      // 只在游戏第一次启动时重置分数
      if (isFirstStartRef.current) {
        setScore(0);
        isFirstStartRef.current = false;
      }
      generateRound();
    } else {
      // 游戏结束时重置标志，以便下次重新开始
      isFirstStartRef.current = true;
    }
  }, [isPlaying, generateRound]);

  const handleItemClick = (index: number) => {
    if (!isPlaying || isSuccess || showVictory) return;

    if (index === targetIndex) {
      // Correct!
      setIsSuccess(true);
      playSound('correct');
      
      // Show victory indicator
      setTimeout(() => {
        setShowVictory(true);
        setIsSuccess(false);
        
        // Auto advance to next round after showing victory
        setTimeout(() => {
          const newScore = score + 1;
          setScore(newScore);
          onScore(10);
          setShowVictory(false);
          generateRound();
        }, 1500); // 显示1.5秒胜利标识后进入下一关
      }, 500);
    } else {
      // Wrong click - show error and deduct points, but don't end game
      playSound('wrong');
      setWrongClickIndex(index);
      onScore(-5); // 扣分
      
      // Clear error indicator after a short time
      setTimeout(() => {
        setWrongClickIndex(null);
      }, 800);
    }
  };

  // Calculate layout
  const aspectRatio = COLS / ROWS;
  const padding = 0.8;
  const availableWidth = width * padding;
  const availableHeight = height * padding - 80;
  const maxWidthByHeight = availableHeight * aspectRatio;
  const boardWidth = Math.min(availableWidth, maxWidthByHeight);
  const boardHeight = boardWidth / aspectRatio;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-red-50">
      {/* Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-yellow-100 to-white p-8 rounded-3xl shadow-2xl text-center transform transition-all scale-100">
            <div className="mb-6">
              <div className="text-6xl animate-bounce">🎉</div>
            </div>
            <h2 className="text-3xl font-black mb-2 text-yellow-600">
              找到了!
            </h2>
            <p className="text-gray-600 text-lg mb-4 font-medium">
              红豆被你找到了！
            </p>
            <div className="flex items-center justify-center gap-2 text-red-900 font-bold text-xl">
              <CheckCircle2 className="text-green-600" size={24} />
              <span>进入下一关</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
        <div className="flex items-center gap-2 bg-red-100 px-4 py-1 rounded-full border border-red-200">
          <Trophy className="text-yellow-600" size={20} />
          <span className="text-red-900 font-mono font-bold text-xl">{score}</span>
        </div>
      </div>

      {/* Game Grid */}
      <div 
        className={`grid gap-2 md:gap-3 p-4 bg-white/40 rounded-3xl shadow-sm border border-white/50 transition-opacity ${showVictory ? 'opacity-50' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          width: boardWidth,
          height: boardHeight,
          maxWidth: '100%',
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const isTarget = i === targetIndex;
          const isWrongClick = wrongClickIndex === i;
          return (
            <div key={i} className="relative w-full h-full flex items-center justify-center">
              <div className={`w-full h-full transition-all duration-300 ${isTarget && isSuccess ? 'scale-125 brightness-110 drop-shadow-xl z-10' : ''} ${isWrongClick ? 'opacity-70 scale-95' : ''}`}>
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

              {/* Victory Identifier */}
              {isTarget && isSuccess && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="bg-white/90 rounded-full p-1 animate-bounce shadow-lg">
                    <CheckCircle2 className="text-green-600 w-8 h-8 md:w-12 md:h-12" strokeWidth={3} />
                  </div>
                </div>
              )}

              {/* Wrong Click Indicator */}
              {isWrongClick && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="bg-red-500/90 rounded-full p-1 animate-pulse shadow-lg">
                    <X className="text-white w-8 h-8 md:w-12 md:h-12" strokeWidth={3} />
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                    -5分
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

