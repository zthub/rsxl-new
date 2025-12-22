import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import GameLayout from '../components/GameLayout';
import GameResultModal from '../components/GameResultModal';
import { ChickIcon, EagleIcon, Arrow } from '../components/GameAssets';
import { Target, Trophy } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface GridItem {
  id: number;
  type: 'chick' | 'eagle';
  found: boolean;
  row: number;
  col: number;
}

const ROWS = 6;
const COLS = 6;

const ChicksGame: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [score, setScore] = useState(0);
  const [eaglesLeft, setEaglesLeft] = useState(0);
  const [animatingArrows, setAnimatingArrows] = useState<{id: number, startX: number, startY: number, endX: number, endY: number}[]>([]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const bowRef = useRef<HTMLDivElement>(null);

  const initLevel = useCallback(() => {
    // Difficulty increases every 5 points, maxing out at reasonable density
    const difficulty = Math.floor(score / 5);
    const numEagles = Math.min(1 + difficulty, 10); // Start with 1, cap at 10
    
    const totalCount = ROWS * COLS;
    const items: GridItem[] = [];
    
    const eagleIndices = new Set<number>();
    while(eagleIndices.size < numEagles) {
      eagleIndices.add(Math.floor(Math.random() * totalCount));
    }

    for (let i = 0; i < totalCount; i++) {
      items.push({
        id: i,
        type: eagleIndices.has(i) ? 'eagle' : 'chick',
        found: false,
        row: Math.floor(i / COLS),
        col: i % COLS
      });
    }

    setGridItems(items);
    setEaglesLeft(numEagles);
    setGameState(GameState.PLAYING);
    setAnimatingArrows([]);
  }, [score]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  const fireArrow = (targetIndex: number) => {
    if (!gridRef.current || !bowRef.current) return;

    // Calculate positions for animation
    const gridEl = gridRef.current;
    const targetEl = gridEl.children[targetIndex] as HTMLElement;
    const bowEl = bowRef.current;

    const targetRect = targetEl.getBoundingClientRect();
    const bowRect = bowEl.getBoundingClientRect();
    
    const startX = bowRect.left + bowRect.width / 2;
    const startY = bowRect.top; // Tip of the arrow/bow string
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    const arrowId = Date.now();
    setAnimatingArrows(prev => [...prev, { id: arrowId, startX, startY, endX, endY }]);

    // Remove arrow after animation
    setTimeout(() => {
        setAnimatingArrows(prev => prev.filter(a => a.id !== arrowId));
    }, 500);
  };

  const handleItemClick = (index: number) => {
    if (gameState !== GameState.PLAYING) return;
    const item = gridItems[index];

    fireArrow(index);

    // Delay logic slightly to match arrow arrival
    setTimeout(() => {
        if (item.type === 'eagle') {
            if (!item.found) {
                const newItems = [...gridItems];
                newItems[index].found = true;
                setGridItems(newItems);
                
                const newLeft = eaglesLeft - 1;
                setEaglesLeft(newLeft);
                
                if (newLeft === 0) {
                    setGameState(GameState.WON);
                    // Auto advance
                    setTimeout(() => {
                        setScore(s => s + 1);
                    }, 500);
                }
            }
        } else {
            // Hit a chick!
            setGameState(GameState.GAME_OVER);
        }
    }, 300); // 300ms arrow flight time
  };
  
  return (
    <GameLayout 
      title="保护小鸡" 
      level={score} 
      onBack={onBack}
      bgColorClass="bg-cyan-100"
      customHeader={
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-cyan-700/20 px-4 py-1 rounded-full border border-cyan-600/30">
                <Trophy className="text-yellow-600" size={20} />
                <span className="text-cyan-900 font-mono font-bold text-xl">{score}</span>
            </div>
        </div>
      }
      headerRight={
        <div className="flex items-center gap-1 text-orange-700 font-bold bg-white/50 px-3 py-1 rounded-full">
          <Target size={20} />
          <span>剩 {eaglesLeft} 只</span>
        </div>
      }
    >
      <div className="flex-1 flex flex-col justify-between h-full w-full max-w-4xl mx-auto relative">
        
        {/* Flying Arrows Layer */}
        {animatingArrows.map(arrow => {
            const dx = arrow.endX - arrow.startX;
            const dy = arrow.endY - arrow.startY;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90; // +90 because our arrow svg points up
            
            return (
                <div 
                    key={arrow.id}
                    className="fixed z-50 pointer-events-none transition-all duration-300 ease-linear"
                    style={{
                        left: arrow.startX,
                        top: arrow.startY,
                        transform: `translate(${dx}px, ${dy}px) rotate(${angle}deg)`,
                        transformOrigin: 'top center', // Rotate around tail
                    }}
                >
                    <Arrow className="w-4 h-12 drop-shadow-md" />
                </div>
            );
        })}

        {/* Game Grid */}
        <div className="flex-1 flex items-center justify-center mb-10">
            <div 
                ref={gridRef}
                className="grid gap-2 md:gap-3 lg:gap-4 p-2 bg-white/30 rounded-2xl shadow-sm"
                style={{
                    gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                    width: 'fit-content'
                }}
            >
            {gridItems.map((item, i) => (
                <div key={i} className="relative flex justify-center items-center w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16">
                {item.type === 'chick' ? (
                    <ChickIcon onClick={() => {}} className="w-full h-full" />
                ) : (
                    item.found ? (
                        <div className="w-full h-full opacity-50 grayscale transition-all scale-90">
                            <EagleIcon onClick={() => {}} className="w-full h-full" />
                            <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                                <span className="text-2xl md:text-4xl text-red-600 font-bold drop-shadow-md">❌</span>
                            </div>
                        </div>
                    ) : (
                        <EagleIcon onClick={() => {}} className="w-full h-full" />
                    )
                )}
                
                {/* Transparent Overlay for click handling */}
                <div 
                    className="absolute inset-0 cursor-crosshair z-10"
                    onClick={() => handleItemClick(i)}
                />
                </div>
            ))}
            </div>
        </div>

        {/* The Bow at the bottom */}
        <div className="h-24 w-full flex justify-center items-end relative pb-4">
             {/* Decorative Bow - Pointing UP */}
             <div ref={bowRef} className="relative w-40 h-20 flex justify-center items-end">
                 {/* Bow Shape: Curving UP (ends down), String pulled DOWN */}
                 <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-xl overflow-visible">
                     {/* Wood part - Curve Upwards */}
                     <path d="M0 60 Q50 0 100 60" fill="none" stroke="#5D4037" strokeWidth="6" strokeLinecap="round" />
                     {/* String - Pulled down to center */}
                     <path d="M0 60 L50 60 L100 60" stroke="#9E9E9E" strokeWidth="1" strokeDasharray="4 2" />
                     {/* Pulled String Animation State could be added here */}
                     <path d="M0 60 L50 90 L100 60" fill="none" stroke="#FFFFFF" strokeWidth="2" className="opacity-80" />
                 </svg>
                 {/* Static arrow ready to fire */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
                     <Arrow className="w-6 h-16" />
                 </div>
             </div>
             <p className="absolute bottom-0 text-cyan-800/60 text-sm font-bold tracking-widest">点击老鹰射击</p>
        </div>
      </div>

      <GameResultModal
        gameState={gameState}
        onRestart={() => { setScore(0); initLevel(); }}
        onNextLevel={() => { /* Auto handled by score update */ }}
        onHome={onBack}
        message={gameState === GameState.GAME_OVER ? '哎呀！你射到了小鸡！' : '老鹰都被赶跑了！'}
      />
    </GameLayout>
  );
};

export default ChicksGame;