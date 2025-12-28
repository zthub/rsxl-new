import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import GameLayout from '../components/GameLayout';
import GameResultModal from '../components/GameResultModal';
import Avatar, { AvatarConfig, getRandomAvatarConfig } from '../components/Avatar';
import { Clock } from 'lucide-react';

interface Props {
  onBack: () => void;
}

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

const FindAvatarGame: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [targetConfig, setTargetConfig] = useState<AvatarConfig | null>(null);
  const [crowd, setCrowd] = useState<CrowdMember[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);

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
    setGameState(GameState.PLAYING);
  }, []);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        timerRef.current = window.setInterval(() => {
            setTimeElapsed(t => t + 1);
        }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  const handleAvatarClick = (e: React.MouseEvent, isTarget: boolean) => {
    e.stopPropagation();
    if (gameState !== GameState.PLAYING) return;

    if (isTarget) {
        clearInterval(timerRef.current);
        setGameState(GameState.WON);
    }
  };

  const handleNext = () => {
      setScore(s => s + 1);
      setGameState(GameState.IDLE);
      setTimeout(() => initLevel(), 50);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <GameLayout 
      title="" 
      level={score} 
      onBack={onBack}
      bgColorClass="bg-[#F3E5F5]"
      customHeader={
         <div className="flex items-center gap-2 text-lg font-mono text-gray-700 font-bold opacity-60">
            <Clock size={18} />
            {formatTime(timeElapsed)}
         </div>
      }
    >
      {/* 
        Main Container:
        - max-h to prevent scroll
        - justify-evenly to spread target and crowd into the available vertical space
      */}
      <div className="flex flex-col items-center justify-evenly w-full h-full max-h-[calc(100vh-80px)] overflow-hidden gap-2 md:gap-4">
        
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

      <GameResultModal
        gameState={gameState}
        onRestart={initLevel}
        onNextLevel={handleNext}
        onHome={onBack}
        isLastLevel={false}
        message="太棒了！你找到了！"
      />
    </GameLayout>
  );
};

export default FindAvatarGame;