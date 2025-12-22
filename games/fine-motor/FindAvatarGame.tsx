import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';
import Avatar, { AvatarConfig, getRandomAvatarConfig } from './components/Avatar';
import { Clock, Trophy } from 'lucide-react';

// Increased count to 42 to fill space better without overcrowding
const TOTAL_AVATARS = 42; 

interface CrowdMember {
    id: number;
    config: AvatarConfig;
    isTarget: boolean;
    rotation: number;
    offsetX: number;
    offsetY: number;
}

export const FindAvatarGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const [score, setScore] = useState(0);
  const [targetConfig, setTargetConfig] = useState<AvatarConfig | null>(null);
  const [crowd, setCrowd] = useState<CrowdMember[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const isFirstStartRef = useRef(true);

  const timerRef = useRef<number>(0);

  const getDistractorConfig = (target: AvatarConfig): AvatarConfig => {
    let distractor = getRandomAvatarConfig();
    
    // Ensure distinct visual difference
    const isIdentical = 
        distractor.hairStyle === target.hairStyle &&
        distractor.hairColor === target.hairColor &&
        distractor.shirtColor === target.shirtColor &&
        distractor.accStyle === target.accStyle &&
        distractor.eyeStyle === target.eyeStyle &&
        distractor.mouthStyle === target.mouthStyle &&
        distractor.skinColor === target.skinColor;

    if (isIdentical) {
        distractor.shirtColor = distractor.shirtColor === '#FF6B6B' ? '#4ECDC4' : '#FF6B6B';
    }
    return distractor;
  };

  const initLevel = useCallback(() => {
    const newTarget = getRandomAvatarConfig();
    setTargetConfig(newTarget);

    const newCrowd: CrowdMember[] = [];
    
    for (let i = 0; i < TOTAL_AVATARS - 1; i++) {
        newCrowd.push({
            id: i,
            config: getDistractorConfig(newTarget),
            isTarget: false,
            // Moderate random variations
            rotation: Math.random() * 16 - 8, 
            offsetX: Math.random() * 4 - 2,
            offsetY: Math.random() * 4 - 2,
        });
    }

    newCrowd.push({
        id: 999,
        config: newTarget,
        isTarget: true,
        rotation: Math.random() * 10 - 5,
        offsetX: Math.random() * 4 - 2,
        offsetY: Math.random() * 4 - 2,
    });

    // Shuffle
    for (let i = newCrowd.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCrowd[i], newCrowd[j]] = [newCrowd[j], newCrowd[i]];
    }

    setCrowd(newCrowd);
    setShowVictory(false);
    setTimeElapsed(0);
  }, []);

  // Initialize game
  useEffect(() => {
    if (isPlaying) {
      // 只在游戏第一次启动时重置分数
      if (isFirstStartRef.current) {
        setScore(0);
        isFirstStartRef.current = false;
      }
      initLevel();
    } else {
      // 游戏结束时重置标志，以便下次重新开始
      isFirstStartRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isPlaying, initLevel]);

  // Timer
  useEffect(() => {
    if (isPlaying && !showVictory) {
        timerRef.current = window.setInterval(() => {
            setTimeElapsed(t => t + 1);
        }, 1000);
    } else {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }
    return () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
  }, [isPlaying, showVictory]);

  const handleAvatarClick = (e: React.MouseEvent, isTarget: boolean) => {
    e.stopPropagation();
    if (!isPlaying || showVictory) return;

    if (isTarget) {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        playSound('correct');
        setShowVictory(true);
        
        // Show victory and auto advance to next round
        setTimeout(() => {
            const newScore = score + 1;
            setScore(newScore);
            onScore(10);
            setShowVictory(false);
            initLevel();
        }, 1500);
    } else {
        // Wrong click - deduct points but don't end game
        playSound('wrong');
        onScore(-5);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-evenly bg-[#F3E5F5] overflow-hidden">
      {/* Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-b from-yellow-100 to-white p-8 rounded-3xl shadow-2xl text-center transform transition-all scale-100">
            <div className="mb-6">
              <div className="text-6xl animate-bounce">🎉</div>
            </div>
            <h2 className="text-3xl font-black mb-2 text-yellow-600">
              太棒了！
            </h2>
            <p className="text-gray-600 text-lg mb-4 font-medium">
              你找到了！
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
        <div className="flex items-center gap-2 bg-white/90 px-4 py-1 rounded-full border border-purple-200 shadow-md">
          <Trophy className="text-yellow-600" size={20} />
          <span className="text-purple-900 font-mono font-bold text-xl">{score}</span>
        </div>
        <div className="flex items-center gap-2 text-lg font-mono text-gray-700 font-bold opacity-80 bg-white/90 px-4 py-1 rounded-full border border-purple-200 shadow-md">
          <Clock size={18} />
          {formatTime(timeElapsed)}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col items-center justify-evenly w-full h-full max-h-[calc(100vh-80px)] overflow-hidden gap-2 md:gap-4 pt-16 pb-4">
        
        {/* Target Area */}
        <div className="flex-none flex justify-center z-20">
            {targetConfig && (
                <div className="relative group">
                    <div 
                        className="bg-white rounded-full p-1.5 shadow-lg border-2 border-purple-300 transition-transform"
                        style={{
                             // Target: slightly larger than grid items
                             // vmin adapts better to both portrait and landscape constraints
                             width: 'clamp(60px, 15vmin, 110px)',
                             height: 'clamp(60px, 15vmin, 110px)',
                        }}
                    >
                        <Avatar config={targetConfig} />
                    </div>
                </div>
            )}
        </div>

        {/* Crowd Area */}
        <div className="flex-none w-full flex items-center justify-center">
             {/* 
                Grid/Flex Container
                Using vmin ensures that in landscape (where height is limiting), they size by height.
                In portrait (where width is limiting), they size by width.
             */}
             <div className="flex flex-wrap justify-center content-center gap-1">
                 {crowd.map((item) => (
                     <div 
                        key={item.id}
                        className="relative flex-none"
                        style={{
                            // Size: 11vmin ensures ~6-7 rows fit in landscape height, or ~5-6 cols fit in portrait width
                            width: 'clamp(40px, 11vmin, 90px)', 
                            height: 'clamp(40px, 11vmin, 90px)',
                            transform: `rotate(${item.rotation}deg) translate(${item.offsetX}px, ${item.offsetY}px)`,
                            zIndex: item.isTarget ? 10 : 1
                        }}
                     >
                         <Avatar 
                            config={item.config} 
                            onClick={(e) => handleAvatarClick(e, item.isTarget)}
                            className="w-full h-full drop-shadow-sm hover:scale-110 transition-transform duration-200"
                         />
                     </div>
                 ))}
             </div>
        </div>

      </div>
    </div>
  );
};

