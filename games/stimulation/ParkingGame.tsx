import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import GameResultModal from '../../components/GameResultModal';
import { MoveHorizontal, MoveVertical } from 'lucide-react';

interface Car {
  id: number;
  x: number;
  y: number;
  length: number;
  orientation: 'h' | 'v';
  color: string;
  isTarget?: boolean;
}

enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
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

export const ParkingGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver }) => {
  // 设置默认进入第一关 (Index 0)
  const [levelIndex, setLevelIndex] = useState(0);
  const [cars, setCars] = useState<Car[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [draggingCarId, setDraggingCarId] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  const [initialCarPos, setInitialCarPos] = useState<{ x: number, y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

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
    if (gameState !== GameState.PLAYING || !isPlaying) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setDraggingCarId(id);
    setDragStartPos({ x: clientX, y: clientY });
    const car = cars.find(c => c.id === id);
    if (car) setInitialCarPos({ x: car.x, y: car.y });
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (draggingCarId === null || !dragStartPos || !initialCarPos || !containerRef.current || !isPlaying) return;

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
  }, [draggingCarId, dragStartPos, initialCarPos, isPlaying]);

  const handleEnd = useCallback(() => {
    if (draggingCarId !== null && isPlaying) {
      // 使用更高效的方式找到目标车
      const targetCarIndex = cars.findIndex(c => c.isTarget);
      if (targetCarIndex !== -1) {
        const targetCar = cars[targetCarIndex];
        // 检查胜利条件
        if (targetCar.x + targetCar.length === GRID_SIZE && targetCar.y === EXIT_ROW) {
          // 立即更新游戏状态
          setGameState(GameState.WON);
          // 异步调用分数回调，避免阻塞主线程
          if (onScore) {
            setTimeout(() => onScore(100), 0); // 每次过关得100分
          }
        }
      }
    }
    // 立即重置拖动状态
    setDraggingCarId(null);
    setDragStartPos(null);
    setInitialCarPos(null);
  }, [draggingCarId, cars, isPlaying, onScore]);

  // 处理下一关
  const handleNextLevel = useCallback(() => {
    setLevelIndex(prev => prev + 1);
  }, []);

  // 检查是否是最后一关
  const isLastLevel = levelIndex === LEVELS.length - 1;

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

  // --- 背景动画循环 --- 与火眼金睛游戏完全一致
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;
    
    ctx.clearRect(0, 0, width, height);
    
    // 渲染与火眼金睛完全一致的背景效果
    renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

    requestRef.current = requestAnimationFrame(animate);
  }, [width, height, visualAcuity]);

  // 设置Canvas高DPI支持
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    
    // 设置实际分辨率（物理像素）
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // 设置CSS显示尺寸（逻辑像素）
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // 缩放上下文以匹配设备像素比
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
      ctx.scale(dpr, dpr);
    }
  }, [width, height]);

  useEffect(() => {
    // 只要开始游戏，就启动动画循环
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 1. 背景层 Canvas - 与火眼金睛游戏完全一致 */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-0"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 py-4">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
                  className={`w-full h-full rounded-2xl shadow-lg border-b-4 border-black/20 relative overflow-hidden ${car.orientation === 'h' ? 'rounded-l-[20px] rounded-r-[40px]' : 'rounded-t-[20px] rounded-b-[40px]'}`}
                  style={{ backgroundColor: car.color }}
                >
                  {/* 横向汽车样式 */}
                  {car.orientation === 'h' && (
                    <>
                      {/* 车顶 */}
                      <div className="absolute top-1/4 left-1/5 right-1/5 h-1/2 bg-white/15 rounded-t-[15px] rounded-b-none"></div>
                      
                      {/* 车窗 */}
                      <div className="absolute top-1/4 left-1/4 right-1/4 h-1/3 bg-white/30 rounded-[10px]"></div>
                      
                      {/* 车轮 */}
                      <div className="absolute bottom-1 left-1/4 w-1/6 h-1/4 bg-gray-700 rounded-full shadow-inner"></div>
                      <div className="absolute bottom-1 right-1/4 w-1/6 h-1/4 bg-gray-700 rounded-full shadow-inner"></div>
                      
                      {/* 车灯 */}
                      <div className="absolute top-1/3 right-1 w-1/8 h-1/6 bg-white/80 rounded-r-[8px]"></div>
                      <div className="absolute bottom-1/3 right-1 w-1/8 h-1/6 bg-white/80 rounded-r-[8px]"></div>
                    </>
                  )}
                  
                  {/* 竖向汽车样式 */}
                  {car.orientation === 'v' && (
                    <>
                      {/* 车顶 */}
                      <div className="absolute top-1/5 left-1/4 right-1/4 h-1/2 bg-white/15 rounded-t-[15px] rounded-b-none"></div>
                      
                      {/* 车窗 */}
                      <div className="absolute top-1/4 left-1/3 right-1/3 h-1/3 bg-white/30 rounded-[10px]"></div>
                      
                      {/* 车轮 */}
                      <div className="absolute left-1 top-1/4 w-1/4 h-1/6 bg-gray-700 rounded-full shadow-inner"></div>
                      <div className="absolute right-1 top-1/4 w-1/4 h-1/6 bg-gray-700 rounded-full shadow-inner"></div>
                      <div className="absolute left-1 bottom-1/4 w-1/4 h-1/6 bg-gray-700 rounded-full shadow-inner"></div>
                      <div className="absolute right-1 bottom-1/4 w-1/4 h-1/6 bg-gray-700 rounded-full shadow-inner"></div>
                      
                      {/* 车灯 */}
                      <div className="absolute bottom-1 left-1/3 w-1/3 h-1/8 bg-white/80 rounded-b-[8px]"></div>
                      <div className="absolute bottom-1 right-1/3 w-1/3 h-1/8 bg-white/80 rounded-b-[8px]"></div>
                    </>
                  )}

                  <div className="relative z-10 text-white/80 flex items-center justify-center h-full">
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

        <div className="flex items-center gap-4">
          <div className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m6 15 6-6 6 6"/></svg>
            <span>关卡 {levelIndex + 1} / {LEVELS.length}</span>
          </div>
           <button 
            onClick={() => initLevel(levelIndex)}
            className="bg-white px-6 py-2 rounded-full font-bold text-slate-600 shadow-lg hover:bg-slate-50 transition-all active:scale-95"
          >
            重置关卡
          </button>
        </div>
      </div>

      {/* 胜利提示模态框 */}
      <GameResultModal
        gameState={gameState}
        onRestart={() => initLevel(levelIndex)}
        onNextLevel={handleNextLevel}
        onHome={onGameOver}
        message="太棒了！红色汽车成功出库！"
        isLastLevel={isLastLevel}
      />
    </div>
  );
};