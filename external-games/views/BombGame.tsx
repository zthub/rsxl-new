import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import GameLayout from '../components/GameLayout';
import GameResultModal from '../components/GameResultModal';
import { BombIcon } from '../components/GameAssets';
import { Timer, Trophy, Flame, CheckCircle2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const ROWS = 8;
const COLS = 10; 

const BombGame: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(6);
  const [targetIndex, setTargetIndex] = useState(0);
  const [distractorNum, setDistractorNum] = useState(88);
  const [isExploding, setIsExploding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const timerRef = useRef<number>(0);

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
    setGameState(GameState.PLAYING);
  }, []);

  // Initial Start
  useEffect(() => {
    generateRound();
  }, [generateRound]);

  // Handle Explosion Sequence
  const triggerExplosion = useCallback(() => {
    if (isExploding || isSuccess) return;
    setIsExploding(true);
    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Wait for animation then show Game Over
    setTimeout(() => {
      setGameState(GameState.GAME_OVER);
    }, 1000);
  }, [isExploding, isSuccess]);

  // Timer Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING && !isExploding && !isSuccess) {
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
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLeft, isExploding, isSuccess, triggerExplosion]);

  const handleItemClick = (index: number) => {
    if (gameState !== GameState.PLAYING || isExploding || isSuccess) return;

    if (index === targetIndex) {
      // Correct!
      setIsSuccess(true);
      
      // Delay to show victory animation
      setTimeout(() => {
        setScore(s => s + 1);
        generateRound(); 
      }, 500);
    } else {
      // Wrong click
      triggerExplosion();
    }
  };

  const handleRestart = () => {
    setScore(0);
    generateRound();
  };

  // Get current display number for target (Countdown 6, 5, 4...)
  const targetDisplayNum = Math.ceil(timeLeft);

  return (
    <GameLayout 
      title="拆炸弹" 
      level={score} 
      onBack={onBack}
      bgColorClass="bg-gradient-to-b from-slate-800 to-slate-900"
      customHeader={
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-700/50 px-4 py-1 rounded-full border border-slate-600">
                <Trophy className="text-yellow-400" size={20} />
                <span className="text-white font-mono font-bold text-xl">{score}</span>
            </div>
        </div>
      }
      headerRight={
        <div className={`flex items-center gap-2 font-mono text-2xl font-black ${timeLeft <= 2 ? 'text-red-500 animate-bounce' : 'text-white'}`}>
          <Timer size={24} />
          {targetDisplayNum}s
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 py-2">
        
        {/* The Grid - Force fit without scroll */}
        <div 
          className={`grid gap-1 p-1 md:p-2 rounded-xl bg-slate-800/30 transition-all duration-300 w-full h-full
            ${isExploding ? 'animate-[shake_0.5s_ease-in-out_infinite] bg-red-900/20' : ''}
          `}
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
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
        message={gameState === GameState.GAME_OVER ? `BOOM! 炸弹爆炸了！你一共拆除了 ${score} 个炸弹` : undefined}
      />
      
      {/* Inline styles for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px) rotate(-1deg); }
          75% { transform: translateX(3px) rotate(1deg); }
        }
      `}</style>
    </GameLayout>
  );
};

export default BombGame;