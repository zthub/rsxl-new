
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import GameLayout from '../components/GameLayout';
import GameResultModal from '../components/GameResultModal';
import { Trophy, MoveHorizontal, MoveVertical, LogOut } from 'lucide-react';

interface Car {
  id: number;
  x: number;
  y: number;
  length: number;
  orientation: 'h' | 'v';
  color: string;
  isTarget?: boolean;
}

const GRID_SIZE = 6;
const EXIT_ROW = 2;

/**
 * 关卡数据集 - 精选 15 个关卡
 * 1-14 关保持原样（基础关卡）
 * 第 15 关（Index 14）为修复后的无重叠可解关卡
 */
const LEVELS: Car[][] = [
  // 1-12 关
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 1, length: 3, orientation: 'v', color: '#3B82F6' },
  ],
  [
    { id: 0, x: 1, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 3, y: 0, length: 3, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 4, y: 2, length: 2, orientation: 'v', color: '#8B5CF6' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 1, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 2, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 0, y: 4, length: 3, orientation: 'h', color: '#F59E0B' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 1, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 1, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 1, length: 2, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 2, y: 0, length: 2, orientation: 'h', color: '#8B5CF6' },
    { id: 5, x: 2, y: 3, length: 3, orientation: 'h', color: '#EC4899' },
    { id: 6, x: 0, y: 4, length: 2, orientation: 'v', color: '#F97316' },
  ],
  [
    { id: 0, x: 1, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 3, y: 0, length: 3, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 4, y: 1, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 0, y: 0, length: 2, orientation: 'h', color: '#F59E0B' },
    { id: 4, x: 0, y: 3, length: 2, orientation: 'v', color: '#8B5CF6' },
    { id: 5, x: 1, y: 5, length: 3, orientation: 'h', color: '#EC4899' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 0, length: 3, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 0, length: 3, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 1, length: 2, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 4, y: 0, length: 2, orientation: 'h', color: '#8B5CF6' },
    { id: 5, x: 0, y: 4, length: 2, orientation: 'h', color: '#EC4899' },
    { id: 6, x: 3, y: 4, length: 2, orientation: 'h', color: '#F97316' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 1, length: 3, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 1, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 2, length: 2, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 3, y: 0, length: 2, orientation: 'h', color: '#8B5CF6' },
    { id: 5, x: 0, y: 0, length: 2, orientation: 'h', color: '#EC4899' },
    { id: 6, x: 0, y: 4, length: 2, orientation: 'v', color: '#F97316' },
    { id: 7, x: 1, y: 5, length: 3, orientation: 'h', color: '#14B8A6' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 2, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 2, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 1, length: 2, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 5, y: 1, length: 2, orientation: 'v', color: '#8B5CF6' },
    { id: 5, x: 2, y: 4, length: 2, orientation: 'h', color: '#EC4899' },
    { id: 6, x: 4, y: 0, length: 2, orientation: 'h', color: '#F97316' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 0, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 1, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 1, length: 2, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 5, y: 1, length: 2, orientation: 'v', color: '#F97316' },
    { id: 5, x: 0, y: 0, length: 2, orientation: 'h', color: '#8B5CF6' },
    { id: 6, x: 2, y: 4, length: 2, orientation: 'h', color: '#EC4899' },
    { id: 7, x: 4, y: 4, length: 2, orientation: 'h', color: '#06B6D4' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 1, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 2, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 0, length: 3, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 2, y: 0, length: 2, orientation: 'h', color: '#8B5CF6' },
    { id: 5, x: 2, y: 4, length: 3, orientation: 'h', color: '#EC4899' },
    { id: 6, x: 0, y: 4, length: 2, orientation: 'v', color: '#F97316' }, 
    { id: 7, x: 5, y: 2, length: 3, orientation: 'v', color: '#06B6D4' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 0, length: 3, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 0, length: 3, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 0, length: 2, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 5, y: 0, length: 3, orientation: 'v', color: '#8B5CF6' },
  ],
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 1, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 1, length: 3, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 1, length: 2, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 0, y: 0, length: 2, orientation: 'h', color: '#8B5CF6' },
    { id: 5, x: 2, y: 0, length: 3, orientation: 'h', color: '#EC4899' },
    { id: 6, x: 1, y: 4, length: 2, orientation: 'h', color: '#F97316' },
    { id: 7, x: 5, y: 4, length: 2, orientation: 'v', color: '#06B6D4' },
  ],
  // 关卡 13 (Index 12)
  [
    { id: 0, x: 1, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 0, y: 0, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 1, y: 0, length: 2, orientation: 'h', color: '#10B981' },
    { id: 3, x: 3, y: 0, length: 3, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 4, y: 1, length: 2, orientation: 'v', color: '#8B5CF6' },
    { id: 5, x: 0, y: 2, length: 2, orientation: 'v', color: '#EC4899' },
    { id: 6, x: 2, y: 3, length: 3, orientation: 'v', color: '#F97316' },
    { id: 7, x: 3, y: 3, length: 2, orientation: 'h', color: '#06B6D4' },
    { id: 8, x: 5, y: 3, length: 2, orientation: 'v', color: '#14B8A6' },
    { id: 9, x: 0, y: 4, length: 2, orientation: 'h', color: '#6366F1' },
    { id: 10, x: 3, y: 5, length: 2, orientation: 'h', color: '#F472B6' },
  ],
  // 关卡 14 (Index 13)
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 1, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 3, y: 2, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 4, y: 1, length: 3, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 0, y: 0, length: 2, orientation: 'h', color: '#EC4899' },
    { id: 5, x: 3, y: 0, length: 3, orientation: 'h', color: '#8B5CF6' },
    { id: 6, x: 5, y: 3, length: 3, orientation: 'v', color: '#06B6D4' },
    { id: 7, x: 0, y: 5, length: 3, orientation: 'h', color: '#14B8A6' },
    { id: 8, x: 3, y: 4, length: 2, orientation: 'h', color: '#6366F1' },
  ],
  // 第 15 关 (Index 14) - 已修复的无重叠布局，绝对可解
  [
    { id: 0, x: 0, y: 2, length: 2, orientation: 'h', color: '#EF4444', isTarget: true },
    { id: 1, x: 2, y: 0, length: 2, orientation: 'v', color: '#3B82F6' },
    { id: 2, x: 2, y: 3, length: 2, orientation: 'v', color: '#10B981' },
    { id: 3, x: 3, y: 1, length: 2, orientation: 'v', color: '#F59E0B' },
    { id: 4, x: 3, y: 4, length: 2, orientation: 'v', color: '#8B5CF6' },
    { id: 5, x: 4, y: 2, length: 2, orientation: 'v', color: '#EC4899' },
    { id: 6, x: 5, y: 0, length: 2, orientation: 'v', color: '#F97316' },
    { id: 7, x: 0, y: 4, length: 2, orientation: 'h', color: '#06B6D4' },
    { id: 8, x: 0, y: 5, length: 2, orientation: 'h', color: '#14B8A6' },
  ],
];

const ParkingGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // 设置默认进入第一关 (Index 0)
  const [levelIndex, setLevelIndex] = useState(0);
  const [cars, setCars] = useState<Car[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [draggingCarId, setDraggingCarId] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  const [initialCarPos, setInitialCarPos] = useState<{ x: number, y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const initLevel = useCallback((idx: number) => {
    const config = LEVELS[idx % LEVELS.length];
    setCars(JSON.parse(JSON.stringify(config)));
    setGameState(GameState.PLAYING);
    setDraggingCarId(null);
  }, []);

  useEffect(() => {
    initLevel(levelIndex);
  }, [levelIndex, initLevel]);

  const isOccupied = (x: number, y: number, excludeId: number, currentCars: Car[]) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return true;
    return currentCars.some(car => {
      if (car.id === excludeId) return false;
      if (car.orientation === 'h') {
        return y === car.y && x >= car.x && x < car.x + car.length;
      } else {
        return x === car.x && y >= car.y && y < car.y + car.length;
      }
    });
  };

  const handleStart = (id: number, e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameState.PLAYING) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setDraggingCarId(id);
    setDragStartPos({ x: clientX, y: clientY });
    const car = cars.find(c => c.id === id);
    if (car) setInitialCarPos({ x: car.x, y: car.y });
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (draggingCarId === null || !dragStartPos || !initialCarPos || !containerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const cellSize = rect.width / GRID_SIZE;

    const dx = (clientX - dragStartPos.x) / cellSize;
    const dy = (clientY - dragStartPos.y) / cellSize;

    setCars(prevCars => {
      const carIndex = prevCars.findIndex(c => c.id === draggingCarId);
      const car = prevCars[carIndex];
      const newCars = [...prevCars];
      
      if (car.orientation === 'h') {
        let newX = Math.round(initialCarPos.x + dx);
        newX = Math.max(0, Math.min(GRID_SIZE - car.length, newX));
        
        const direction = newX > car.x ? 1 : -1;
        let finalX = car.x;
        for (let x = car.x + direction; direction > 0 ? x <= newX : x >= newX; x += direction) {
          const checkX = direction > 0 ? x + car.length - 1 : x;
          if (isOccupied(checkX, car.y, car.id, prevCars)) break;
          finalX = x;
        }
        newCars[carIndex] = { ...car, x: finalX };
      } else {
        let newY = Math.round(initialCarPos.y + dy);
        newY = Math.max(0, Math.min(GRID_SIZE - car.length, newY));

        const direction = newY > car.y ? 1 : -1;
        let finalY = car.y;
        for (let y = car.y + direction; direction > 0 ? y <= newY : y >= newY; y += direction) {
          const checkY = direction > 0 ? y + car.length - 1 : y;
          if (isOccupied(car.x, checkY, car.id, prevCars)) break;
          finalY = y;
        }
        newCars[carIndex] = { ...car, y: finalY };
      }
      return newCars;
    });
  }, [draggingCarId, dragStartPos, initialCarPos]);

  const handleEnd = useCallback(() => {
    if (draggingCarId !== null) {
      const targetCar = cars.find(c => c.isTarget);
      if (targetCar && targetCar.x + targetCar.length === GRID_SIZE && targetCar.y === EXIT_ROW) {
        setGameState(GameState.WON);
      }
    }
    setDraggingCarId(null);
    setDragStartPos(null);
    setInitialCarPos(null);
  }, [draggingCarId, cars]);

  useEffect(() => {
    if (draggingCarId !== null) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [draggingCarId, handleMove, handleEnd]);

  return (
    <GameLayout
      title="快乐停车场"
      level={levelIndex + 1}
      onBack={onBack}
      bgColorClass="bg-slate-100"
      customHeader={
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-bold flex items-center gap-2">
            < Trophy size={18} />
            <span>关卡 {levelIndex + 1} / {LEVELS.length}</span>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-4">
        <div className="text-slate-500 font-medium text-center max-w-xs text-sm md:text-base">
          移动车辆为红色小车让路，从右侧出口开出！
        </div>

        <div className="relative p-4 bg-slate-300 rounded-3xl shadow-2xl border-8 border-slate-400">
          <div 
            ref={containerRef}
            className="relative bg-slate-200 rounded-xl overflow-visible shadow-inner grid grid-cols-6 grid-rows-6"
            style={{ width: 'min(85vw, 400px)', height: 'min(85vw, 400px)' }}
          >
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border border-slate-300/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-slate-400/20 rounded-full"></div>
              </div>
            ))}

            <div 
              className="absolute -right-12 top-0 flex items-center h-full z-0"
              style={{ top: `${(EXIT_ROW / GRID_SIZE) * 100}%`, height: `${(1 / GRID_SIZE) * 100}%` }}
            >
              <div className="flex flex-col items-center gap-1 bg-yellow-400 px-2 py-3 rounded-r-lg shadow-md border-y border-r border-yellow-500 animate-pulse">
                <LogOut size={20} className="text-yellow-900 rotate-180" />
                <span className="text-[10px] font-black text-yellow-900 leading-none">EXIT</span>
              </div>
            </div>

            {cars.map(car => (
              <div
                key={car.id}
                onMouseDown={(e) => handleStart(car.id, e)}
                onTouchStart={(e) => handleStart(car.id, e)}
                className={`absolute p-1 transition-shadow duration-200 cursor-grab active:cursor-grabbing z-10`}
                style={{
                  width: `${(car.orientation === 'h' ? car.length : 1) * (100 / GRID_SIZE)}%`,
                  height: `${(car.orientation === 'v' ? car.length : 1) * (100 / GRID_SIZE)}%`,
                  left: `${(car.x / GRID_SIZE) * 100}%`,
                  top: `${(car.y / GRID_SIZE) * 100}%`,
                  zIndex: draggingCarId === car.id ? 20 : 10
                }}
              >
                <div 
                  className={`w-full h-full rounded-2xl shadow-lg border-b-4 border-black/20 flex flex-col items-center justify-center relative overflow-hidden`}
                  style={{ backgroundColor: car.color }}
                >
                  <div className={`
                    bg-white/20 rounded-lg absolute
                    ${car.orientation === 'h' ? 'top-1.5 bottom-1.5 left-2 right-2 flex gap-2' : 'top-2 bottom-2 left-1.5 right-1.5 flex flex-col gap-2'}
                  `}>
                    <div className="flex-1 bg-white/10 rounded"></div>
                    <div className="flex-1 bg-white/10 rounded"></div>
                  </div>

                  <div className="relative z-10 text-white/50">
                    {car.orientation === 'h' ? <MoveHorizontal size={24} /> : <MoveVertical size={24} />}
                  </div>

                  {car.isTarget && (
                    <div className="absolute inset-0 border-4 border-yellow-400/50 rounded-2xl pointer-events-none ring-2 ring-yellow-200/50 inset-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
           <button 
            onClick={() => initLevel(levelIndex)}
            className="bg-white px-8 py-3 rounded-full font-bold text-slate-600 shadow-lg hover:bg-slate-50 transition-all active:scale-95"
           >
             重置关卡
           </button>
        </div>
      </div>

      <GameResultModal
        gameState={gameState}
        onRestart={() => initLevel(levelIndex)}
        onNextLevel={() => setLevelIndex(prev => prev + 1)}
        onHome={onBack}
        isLastLevel={levelIndex === LEVELS.length - 1}
        message="太棒了！交通堵塞被你解决了！"
      />
    </GameLayout>
  );
};

export default ParkingGame;
