import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState } from '../types';
import GameLayout from '../components/GameLayout';
import { TreeIcon, AppleIcon, BasketIcon } from '../components/GameAssets';
import { Trophy } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const CatchApplesGame: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  const [score, setScore] = useState(0);
  
  // Game Objects
  const [basketX, setBasketX] = useState(50); // Percent 0-100
  const [fallingApple, setFallingApple] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const [staticApples, setStaticApples] = useState<{x: number, y: number}[]>([]);
  const [missedCount, setMissedCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const appleRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  
  // Init Static Apples on Tree
  useEffect(() => {
    const apples = [];
    // Concentrate apples in the foliage area (top center of tree)
    for(let i=0; i<8; i++) {
        apples.push({
            x: 30 + Math.random() * 40, // 30% to 70% width
            y: 5 + Math.random() * 25   // 5% to 30% height (Upper tree canopy)
        });
    }
    setStaticApples(apples);
  }, []);

  // Spawn Apple Logic
  const spawnApple = useCallback(() => {
    // Spawn from within tree width (35% to 65%)
    const startX = 35 + Math.random() * 30; 
    appleRef.current = { x: startX, y: 20, active: true }; // Start slightly lower in canopy
    setFallingApple({ ...appleRef.current });
  }, []);

  // Game Loop
  const updateGame = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    if (!appleRef.current || !appleRef.current.active) {
        // If no apple, spawn one with small chance or immediately if null
        if (!appleRef.current) spawnApple();
    } else {
        // Move Apple Down
        // 0.2 increment
        appleRef.current.y += 0.2; 

        // Check bounds (Miss) - Ground is around 85%
        if (appleRef.current.y > 85) {
            appleRef.current.active = false;
            setMissedCount(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 1)); // Penalty for missing
            
            // Respawn after short delay
            setTimeout(() => spawnApple(), 500);
        }

        setFallingApple({ ...appleRef.current });
    }

    requestRef.current = requestAnimationFrame(updateGame);
  }, [gameState, spawnApple]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updateGame]);

  // Basket Movement
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameState.PLAYING || !containerRef.current) return;
    
    let clientX;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
    } else {
        clientX = (e as React.MouseEvent).clientX;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    
    // Clamp basket center to container
    const xPct = (x / width) * 100;
    setBasketX(Math.min(95, Math.max(5, xPct)));
  };

  // Catch Action
  const handleBasketClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling if container has handlers
    if (gameState !== GameState.PLAYING || !appleRef.current || !appleRef.current.active) return;

    const apple = appleRef.current;
    
    // Hit Detection
    // Basket Y is floating above grass (approx 75-80%)
    
    // Vertical Check: Apple should be low enough (e.g., > 70% and < 90%)
    const isVerticalAlign = apple.y > 70 && apple.y < 90;
    
    // Horizontal Check
    const isHorizontalAlign = Math.abs(apple.x - basketX) < 10; // +/- 10% tolerance

    if (isVerticalAlign && isHorizontalAlign) {
        // Caught!
        setScore(prev => prev + 1);
        appleRef.current.active = false; // Hide immediately
        setFallingApple(null);
        
        // Spawn next
        setTimeout(() => spawnApple(), 500);
    } 
  };

  return (
    <GameLayout 
      title="接苹果" 
      level={score} 
      onBack={onBack}
      bgColorClass="bg-[#E040FB]" // Vibrant Magenta/Purple from reference image 1
      customHeader={
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-yellow-400/90 px-4 py-1 rounded-full border-2 border-white shadow-md">
                <Trophy className="text-yellow-800" size={20} />
                <span className="text-yellow-900 font-mono font-bold text-xl">{score}</span>
            </div>
        </div>
      }
    >
        <div 
            ref={containerRef}
            className="flex-1 w-full h-full relative overflow-hidden cursor-crosshair touch-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
        >
            {/* Background Clouds */}
            <div className="absolute top-[10%] left-[5%] opacity-80 animate-[pulse_5s_infinite]">
                 <svg width="100" height="60" viewBox="0 0 100 60" fill="white">
                    <path d="M10 40 Q20 20 40 25 Q50 10 70 20 Q90 15 90 40 Q100 60 70 60 L30 60 Q0 60 10 40" />
                 </svg>
            </div>
            <div className="absolute top-[15%] right-[5%] opacity-80 animate-[pulse_6s_infinite]">
                 <svg width="120" height="70" viewBox="0 0 100 60" fill="white">
                    <path d="M10 40 Q20 20 40 25 Q50 10 70 20 Q90 15 90 40 Q100 60 70 60 L30 60 Q0 60 10 40" />
                 </svg>
            </div>

            {/* The Big Tree - Centered, spanning from top to ground */}
            <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[95%] md:w-[70%] h-[90%] pointer-events-none z-10">
                <TreeIcon className="w-full h-full" />
            </div>

            {/* Static Red Apples on Tree (Decor) */}
            {staticApples.map((pos, i) => (
                <div 
                    key={i}
                    className="absolute w-10 h-10 md:w-14 md:h-14 z-20"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                    <AppleIcon color="#EF4444" className="w-full h-full animate-[bounce_3s_infinite]" />
                </div>
            ))}

            {/* Falling Deep Blue Apple (The Target) */}
            {fallingApple && fallingApple.active && (
                <div 
                    className="absolute w-12 h-12 md:w-16 md:h-16 z-20 transition-transform"
                    style={{ 
                        left: `${fallingApple.x}%`, 
                        top: `${fallingApple.y}%`,
                        transform: 'translate(-50%, -50%)' 
                    }}
                >
                    {/* Deep Blue Apple (#00008B) */}
                    <AppleIcon color="#00008B" className="w-full h-full drop-shadow-md" />
                </div>
            )}

            {/* Grass Hill at Bottom */}
            <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[25%] bg-[#81C784] rounded-[50%] border-t-4 border-[#66BB6A] z-0"></div>
            {/* Darker grass patches */}
            <div className="absolute bottom-[2%] left-[20%] w-[10%] h-[5%] bg-[#4CAF50] rounded-full z-0 opacity-50"></div>
            <div className="absolute bottom-[5%] right-[30%] w-[15%] h-[6%] bg-[#4CAF50] rounded-full z-0 opacity-50"></div>

            {/* Player Basket - Red */}
            <div 
                className="absolute bottom-[10%] z-30 transition-transform duration-75 ease-out cursor-pointer"
                style={{ 
                    left: `${basketX}%`, 
                    transform: 'translateX(-50%)',
                    width: '90px',
                    height: '90px'
                }}
                onClick={handleBasketClick} // User must click/tap to catch
            >
                <div className="w-full h-full relative group">
                    <BasketIcon className="w-full h-full filter drop-shadow-2xl group-hover:scale-110 transition-transform" />
                    {/* Visual hint to click */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/70 text-purple-900 font-bold px-3 py-1 rounded-full text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        点击!
                    </div>
                </div>
            </div>

            {/* Instructions Overlay (Fades out) */}
            {score === 0 && missedCount === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white pointer-events-none z-40 bg-black/20 p-6 rounded-3xl backdrop-blur-sm">
                    <p className="text-2xl font-black mb-2 drop-shadow-lg">移动红篮子</p>
                    <p className="font-bold drop-shadow-md">接住掉落的 <span className="text-blue-200 text-xl">蓝苹果</span></p>
                    <p className="text-sm mt-4 bg-white/30 px-3 py-1 rounded-full inline-block">重合时点击屏幕</p>
                </div>
            )}
        </div>
    </GameLayout>
  );
};

export default CatchApplesGame;