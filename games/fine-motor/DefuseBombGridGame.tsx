import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';
import { BombIcon } from './components/GameAssets';
import { Timer, Trophy, Flame, CheckCircle2, X } from 'lucide-react';

const ROWS = 8;
const COLS = 10;

export const DefuseBombGridGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(6);
  const [targetIndex, setTargetIndex] = useState(0);
  const [distractorNum, setDistractorNum] = useState(88);
  const [isExploding, setIsExploding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [wrongClickIndex, setWrongClickIndex] = useState<number | null>(null);
  
  const timerRef = useRef<number>(0);
  const isFirstStartRef = useRef(true);

  // Generate a new round
  const generateRound = useCallback(() => {
    // 1. Generate distractor number (2 digits: 10-99 to differ from single digit countdown)
    const baseNum = Math.floor(Math.random() * 90) + 10; 
    setDistractorNum(baseNum);

    // 2. Setup grid target
    const totalItems = ROWS * COLS;
    const newTargetIdx = Math.floor(Math.random() * totalItems);
    setTargetIndex(newTargetIdx);

    // 3. Reset state for round
    setTimeLeft(6); 
    setIsExploding(false);
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

  // Handle Explosion Sequence
  const triggerExplosion = useCallback(() => {
    if (isExploding || isSuccess || !isPlaying) return;
    setIsExploding(true);
    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Wait for animation then show Game Over
    setTimeout(() => {
      playSound('wrong');
      onGameOver();
    }, 1000);
  }, [isExploding, isSuccess, isPlaying, onGameOver]);

  // Timer Logic
  useEffect(() => {
    if (isPlaying && !isExploding && !isSuccess && !showVictory) {
      if (timeLeft <= 0) {
        triggerExplosion();
        return;
      }

      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 0.1;
          if (next <= 0) {
             return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeLeft, isExploding, isSuccess, showVictory, triggerExplosion]);

  const handleItemClick = (index: number) => {
    if (!isPlaying || isExploding || isSuccess || showVictory) return;

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
          onScore(20);
          setShowVictory(false);
          generateRound(); 
        }, 1500); // 显示1.5秒胜利标识后进入下一关
      }, 500);
    } else {
      // Wrong click - show error and deduct points, but don't explode
      playSound('wrong');
      setWrongClickIndex(index);
      onScore(-5); // 扣分
      
      // Clear error indicator after a short time
      setTimeout(() => {
        setWrongClickIndex(null);
      }, 800);
    }
  };

  // Get current display number for target (Countdown 6, 5, 4...)
  const targetDisplayNum = Math.ceil(timeLeft);

  // Calculate layout
  const aspectRatio = COLS / ROWS;
  const padding = 0.85;
  const availableWidth = width * padding;
  const availableHeight = height * padding - 100;
  const maxWidthByHeight = availableHeight * aspectRatio;
  const boardWidth = Math.min(availableWidth, maxWidthByHeight);
  const boardHeight = boardWidth / aspectRatio;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
        <div className="flex items-center gap-2 bg-slate-700/50 px-4 py-1 rounded-full border border-slate-600">
          <Trophy className="text-yellow-400" size={20} />
          <span className="text-white font-mono font-bold text-xl">{score}</span>
        </div>
        <div className={`flex items-center gap-2 font-mono text-2xl font-black ${timeLeft <= 2 ? 'text-red-500 animate-bounce' : 'text-white'}`}>
          <Timer size={24} />
          {targetDisplayNum}s
        </div>
      </div>

      {/* Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-yellow-100 to-white p-8 rounded-3xl shadow-2xl text-center transform transition-all scale-100">
            <div className="mb-6">
              <div className="text-6xl animate-bounce">🎉</div>
            </div>
            <h2 className="text-3xl font-black mb-2 text-yellow-600">
              拆弹成功!
            </h2>
            <p className="text-gray-600 text-lg mb-4 font-medium">
              炸弹已被成功拆除！
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-900 font-bold text-xl">
              <CheckCircle2 className="text-green-600" size={24} />
              <span>进入下一关</span>
            </div>
          </div>
        </div>
      )}

      {/* The Grid */}
      <div 
        className={`grid gap-1 p-1 md:p-2 rounded-xl bg-slate-800/30 transition-all duration-300
          ${isExploding ? 'animate-[shake_0.5s_ease-in-out_infinite] bg-red-900/20' : ''}
          ${showVictory ? 'opacity-50' : ''}
        `}
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          width: boardWidth,
          height: boardHeight,
          maxHeight: '85vh', 
          maxWidth: '100%',
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const isTarget = i === targetIndex;
          const displayNum = isTarget ? targetDisplayNum : distractorNum;
          
          // Interaction States
          const isTargetExploding = isExploding && isTarget;
          const isDistractorExploding = isExploding && !isTarget;
          const isTargetSuccess = isSuccess && isTarget;
          const isWrongClick = wrongClickIndex === i;

          return (
            <div key={i} className="relative w-full h-full flex items-center justify-center">
              <div className={`w-full h-full transition-transform duration-200 ${isExploding ? 'scale-105' : ''}`}>
                 <BombIcon 
                  number={displayNum} 
                  isTarget={isTarget} 
                  className={`
                    w-full h-full
                    transition-all duration-100
                    ${isTarget ? 'text-yellow-300' : 'text-white'}
                    ${isTargetExploding ? 'scale-125 z-20 drop-shadow-[0_0_20px_rgba(255,100,0,1)]' : ''}
                    ${isDistractorExploding ? 'opacity-50 grayscale blur-[1px]' : ''}
                    ${isWrongClick ? 'opacity-70 scale-95' : ''}
                  `}
                  onClick={() => handleItemClick(i)}
                />
                
                {/* Explosion Effect */}
                {isExploding && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                     <Flame 
                        className={`text-orange-500/90 animate-pulse ${isTarget ? 'scale-[2.5]' : 'scale-75 opacity-40'}`} 
                        fill="currentColor"
                     />
                  </div>
                )}

                {/* Victory Identifier */}
                {isTargetSuccess && (
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
            </div>
          );
        })}
      </div>
      
      {/* Inline styles for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px) rotate(-1deg); }
          75% { transform: translateX(3px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
};

