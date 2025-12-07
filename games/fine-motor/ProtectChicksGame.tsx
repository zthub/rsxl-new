import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';
import { ChickIcon, EagleIcon, Arrow } from './components/GameAssets';
import { Target, Trophy, CheckCircle2 } from 'lucide-react';

interface GridItem {
  id: number;
  type: 'chick' | 'eagle';
  found: boolean;
  row: number;
  col: number;
}

const ROWS = 6;
const COLS = 6;

export const ProtectChicksGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [score, setScore] = useState(0);
  const [eaglesLeft, setEaglesLeft] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [animatingArrows, setAnimatingArrows] = useState<{id: number, startX: number, startY: number, endX: number, endY: number}[]>([]);
  const [isShooting, setIsShooting] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const bowRef = useRef<HTMLDivElement>(null);
  const isFirstStartRef = useRef(true);

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
    setAnimatingArrows([]);
    setShowVictory(false);
  }, [score]);

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
    }
  }, [isPlaying, initLevel]);

  const fireArrow = (targetIndex: number) => {
    if (!gridRef.current || !bowRef.current) return;

    // Hide the static arrow and show shooting animation
    setIsShooting(true);

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

    // Remove arrow after animation and restore static arrow
    setTimeout(() => {
        setAnimatingArrows(prev => prev.filter(a => a.id !== arrowId));
        setIsShooting(false);
    }, 500);
  };

  const handleItemClick = (index: number) => {
    if (!isPlaying || showVictory) return;
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
                    // Show victory indicator when all eagles are found
                    playSound('correct');
                    setShowVictory(true);
                    
                    // Auto advance to next level after showing victory
                    setTimeout(() => {
                        const newScore = score + 1;
                        setScore(newScore);
                        onScore(20);
                        setShowVictory(false);
                        initLevel();
                    }, 1500); // 显示1.5秒胜利标识后进入下一关
                } else {
                    // Play sound for finding an eagle (but not the last one)
                    playSound('correct');
                }
            }
        } else {
            // Hit a chick!
            playSound('wrong');
            onGameOver();
        }
    }, 300); // 300ms arrow flight time
  };

  // Calculate layout
  const aspectRatio = COLS / ROWS;
  // 手机横屏模式：充分利用横向空间
  const isMobileLandscape = width > height && width < 768;
  // 横屏模式下，减少高度扣除，增加可用空间
  const heightDeduction = isMobileLandscape ? 60 : 150;
  // 横屏模式下，使用更大的 padding 来充分利用空间
  const padding = isMobileLandscape ? 0.98 : 0.85;
  const availableWidth = width * padding;
  const availableHeight = height * padding - heightDeduction;
  const maxWidthByHeight = availableHeight * aspectRatio;
  // 横屏模式下，优先使用宽度，充分利用横向空间
  const boardWidth = isMobileLandscape 
    ? Math.min(availableWidth * 0.95, maxWidthByHeight * 1.1) 
    : Math.min(availableWidth, maxWidthByHeight);
  const boardHeight = boardWidth / aspectRatio;
  
  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-cyan-100">
      
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

      {/* Header - 手机横屏模式下调整位置 */}
      <div className={`absolute ${isMobileLandscape ? 'top-2' : 'top-4'} left-1/2 -translate-x-1/2 flex items-center gap-4 z-10`}>
        <div className={`flex items-center gap-2 bg-cyan-700/20 ${isMobileLandscape ? 'px-3 py-0.5' : 'px-4 py-1'} rounded-full border border-cyan-600/30`}>
          <Trophy className="text-yellow-600" size={isMobileLandscape ? 16 : 20} />
          <span className={`text-cyan-900 font-mono font-bold ${isMobileLandscape ? 'text-base' : 'text-xl'}`}>{score}</span>
        </div>
        <div className={`flex items-center gap-1 text-orange-700 font-bold bg-white/50 ${isMobileLandscape ? 'px-2 py-0.5 text-sm' : 'px-3 py-1'} rounded-full`}>
          <Target size={isMobileLandscape ? 16 : 20} />
          <span>剩 {eaglesLeft} 只</span>
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
              挑战成功!
            </h2>
            <p className="text-gray-600 text-lg mb-4 font-medium">
              所有老鹰都被赶跑了！
            </p>
            <div className="flex items-center justify-center gap-2 text-cyan-900 font-bold text-xl">
              <CheckCircle2 className="text-green-600" size={24} />
              <span>进入下一关</span>
            </div>
          </div>
        </div>
      )}

      {/* Game Grid - 手机横屏模式下调整布局 */}
      <div 
        className={`flex-1 flex items-center justify-center ${isMobileLandscape ? 'my-1' : 'mb-10'}`} 
        style={{ 
          width: '100%',
          paddingTop: isMobileLandscape ? '40px' : '0', // 为顶部信息留出空间
        }}
      >
          <div 
              ref={gridRef}
              className={`grid ${isMobileLandscape ? 'gap-1 p-1' : 'gap-2 md:gap-3 lg:gap-4 p-2'} bg-white/30 rounded-2xl shadow-sm transition-opacity ${showVictory ? 'opacity-50' : ''}`}
              style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                  width: boardWidth,
                  height: boardHeight,
                  margin: '0 auto',
              }}
          >
          {gridItems.map((item, i) => (
              <div key={i} className="relative flex justify-center items-center w-full h-full">
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

      {/* The Bow at the bottom - 手机横屏模式下缩小并调整位置 */}
      <div className={`w-full flex justify-center items-end relative ${isMobileLandscape ? 'h-12 pb-1' : 'h-24 pb-4'}`}>
           {/* Decorative Bow - Pointing UP */}
           <div ref={bowRef} className={`relative ${isMobileLandscape ? 'w-24 h-12' : 'w-40 h-20'} flex justify-center items-end`}>
                {/* Bow Shape: Curving UP (ends down), String pulled DOWN */}
                <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-xl overflow-visible">
                    {/* Wood part - Curve Upwards */}
                    <path d="M0 60 Q50 0 100 60" fill="none" stroke="#5D4037" strokeWidth="6" strokeLinecap="round" />
                    {/* String - Pulled down to center */}
                    <path d="M0 60 L50 60 L100 60" stroke="#9E9E9E" strokeWidth="1" strokeDasharray="4 2" />
                    {/* Pulled String Animation State could be added here */}
                    <path d="M0 60 L50 90 L100 60" fill="none" stroke="#FFFFFF" strokeWidth="2" className="opacity-80" />
                </svg>
                {/* Static arrow ready to fire - hide when shooting */}
                {!isShooting && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 transition-opacity duration-200">
                        <Arrow className={isMobileLandscape ? "w-4 h-10" : "w-6 h-16"} />
                    </div>
                )}
                {/* Shooting animation - arrow flies out */}
                {isShooting && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 animate-[shoot_0.5s_ease-out_forwards]">
                        <Arrow className={isMobileLandscape ? "w-4 h-10 opacity-0" : "w-6 h-16 opacity-0"} />
                    </div>
                )}
           </div>
           {!isMobileLandscape && (
             <p className="absolute bottom-0 text-cyan-800/60 text-sm font-bold tracking-widest">点击老鹰射击</p>
           )}
      </div>

      {/* Inline styles for shoot animation */}
      <style>{`
        @keyframes shoot {
          0% {
            transform: translate(-50%, 0) translateY(1rem);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -200px) translateY(1rem);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

