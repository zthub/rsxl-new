import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';

interface Cup {
  id: number;
  layers: string[]; // Max length 4
}

interface PouringState {
  color: string;
  fromId: number;
  toId: number;
  fromRect: DOMRect;
  toRect: DOMRect;
}

// 动态层数：第9关及以后使用5层，之前使用4层
const getMaxLayers = (score: number): number => {
  return score >= 8 ? 5 : 4;
};

const HIGH_CONTRAST_COLORS = [
  '#FF0000', // 纯红
  '#0044FF', // 纯蓝
  '#008800', // 深绿
  '#FFCC00', // 金黄
  '#9900FF', // 紫色
  '#FF6600', // 橙色
];

const DrinkShopGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, difficulty = 'Easy' }) => {
  const [score, setScore] = useState(0); // 关卡索引，从0开始（第1关）
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'WON' | 'GAME_OVER'>('IDLE');
  const [cups, setCups] = useState<Cup[]>([]);
  const [selectedCupId, setSelectedCupId] = useState<number | null>(null);
  const [isDeadlocked, setIsDeadlocked] = useState(false);
  const [showResetOptions, setShowResetOptions] = useState(false);
  const [pouringState, setPouringState] = useState<PouringState | null>(null);

  // 背景动画相关
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

  const initialLevelData = useRef<{
    cups: Cup[];
  } | null>(null);

  const cupRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // 背景动画循环
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;

    ctx.clearRect(0, 0, width, height);

    // 渲染与火眼金睛完全一致的闪烁刺激背景
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

  const startLevel = useCallback((isRestartingSame: boolean) => {
    if (isRestartingSame && initialLevelData.current) {
      const data = initialLevelData.current;
      setCups(JSON.parse(JSON.stringify(data.cups)));
    } else {
      // 动态获取当前关卡的层数
      const maxLayers = getMaxLayers(score);

      // --- 阶梯式难度逻辑 ---
      let colorCount = 2;
      let emptyCupCount = 1;

      if (score === 1) { // 第2关
        colorCount = 3;
        emptyCupCount = 1;
      } else if (score === 2) { // 第3关
        colorCount = 4;
        emptyCupCount = 2;
      } else if (score === 3) { // 第4关
        colorCount = 5;
        emptyCupCount = 2;
      } else if (score >= 4) { // 第5关及以后
        colorCount = 6;
        emptyCupCount = 2;
      }

      const activeColors = HIGH_CONTRAST_COLORS.slice(0, colorCount);

      let allLayers: string[] = [];
      activeColors.forEach(color => {
        for (let i = 0; i < maxLayers; i++) allLayers.push(color);
      });

      for (let i = allLayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allLayers[i], allLayers[j]] = [allLayers[j], allLayers[i]];
      }

      const newCups: Cup[] = [];
      for (let i = 0; i < colorCount; i++) {
        newCups.push({ id: i, layers: allLayers.slice(i * maxLayers, (i + 1) * maxLayers) });
      }
      for (let i = 0; i < emptyCupCount; i++) {
        newCups.push({ id: colorCount + i, layers: [] });
      }

      initialLevelData.current = {
        cups: JSON.parse(JSON.stringify(newCups))
      };

      setCups(newCups);
    }

    setGameState('PLAYING');
    setIsDeadlocked(false);
    setSelectedCupId(null);
    setShowResetOptions(false);
    setPouringState(null);
  }, [score]);

  useEffect(() => {
    startLevel(false);
  }, [score, startLevel]);

  const checkDeadlock = useCallback((currentCups: Cup[]) => {
    // 首先检查是否所有饮料都是同一种颜色（胜利条件）
    const allSameColor = checkAllSameColor(currentCups);
    if (allSameColor) return false; // 不是死锁，而是胜利

    const maxLayers = getMaxLayers(score);

    // 检查是否还有空杯子
    const hasEmptyCup = currentCups.some(cup => cup.layers.length === 0);
    if (hasEmptyCup) return false; // 有空杯子，不是死锁

    for (let i = 0; i < currentCups.length; i++) {
      const source = currentCups[i];
      if (source.layers.length === 0) continue;

      for (let j = 0; j < currentCups.length; j++) {
        if (i === j) continue;
        const target = currentCups[j];
        if (target.layers.length < maxLayers) {
          if (target.layers.length === 0 || target.layers[target.layers.length - 1] === source.layers[source.layers.length - 1]) {
            return false;
          }
        }
      }
    }
    return true;
  }, [score]);

  // 检查是否所有饮料都是同一种颜色
  const checkAllSameColor = useCallback((currentCups: Cup[]) => {
    const nonEmptyCups = currentCups.filter(cup => cup.layers.length > 0);
    if (nonEmptyCups.length === 0) return false; // 所有杯子都空，不算胜利

    // 获取第一个非空杯子的颜色作为基准
    const firstColor = nonEmptyCups[0].layers[0];

    // 检查所有非空杯子的所有层是否都是这个颜色
    for (const cup of nonEmptyCups) {
      for (const layerColor of cup.layers) {
        if (layerColor !== firstColor) {
          return false;
        }
      }
    }

    return true;
  }, []);

  // 检查是否每个颜色都放到一个独立的瓶子中
  const checkAllColorsInSeparateCups = useCallback((currentCups: Cup[]) => {
    // 获取当前关卡使用的颜色数量和层数
    const activeColors = HIGH_CONTRAST_COLORS.slice(0, Math.min(score + 2, HIGH_CONTRAST_COLORS.length));
    const maxLayers = getMaxLayers(score);

    // 检查每个颜色是否都有一个独立的瓶子（每个瓶子装满同一种颜色）
    const completedColors = new Set<string>();

    for (const cup of currentCups) {
      if (cup.layers.length === maxLayers && cup.layers.every(l => l === cup.layers[0])) {
        const color = cup.layers[0];
        if (activeColors.includes(color)) {
          completedColors.add(color);
        }
      }
    }

    // 如果所有活跃颜色都有对应的完成瓶子，则胜利
    return activeColors.every(color => completedColors.has(color));
  }, [score]);

  // 死锁检测和胜利条件检查
  useEffect(() => {
    if (gameState !== 'PLAYING' || pouringState) return;

    // 检查胜利条件：每个颜色都放到一个独立的瓶子中
    if (checkAllColorsInSeparateCups(cups)) {
      setGameState('WON');
      return;
    }

    // 死锁检测
    if (checkDeadlock(cups)) {
      const checkTimer = setTimeout(() => {
        if (checkDeadlock(cups) && gameState === 'PLAYING') {
          // 再次检查胜利条件
          if (!checkAllColorsInSeparateCups(cups)) {
            setGameState('GAME_OVER');
            setIsDeadlocked(true);
          }
        }
      }, 2000);
      return () => clearTimeout(checkTimer);
    }
  }, [cups, gameState, pouringState, checkDeadlock, checkAllColorsInSeparateCups]);

  // 处理胜利状态，自动结算并进入下一关
  useEffect(() => {
    if (gameState === 'WON') {
      // 延迟显示胜利效果，然后自动进入下一关
      const timer = setTimeout(() => {
        // 调用 onScore 回调增加分数/关卡
        onScore && onScore(1);
        // 增加关卡索引
        setScore(prev => prev + 1);
        // 直接开始下一关，不需要设置 IDLE 状态
        startLevel(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState, onScore, startLevel]);



  const handleCupClick = (id: number) => {
    if (gameState !== 'PLAYING' || pouringState) return;

    const maxLayers = getMaxLayers(score);

    if (selectedCupId === null) {
      const sourceCup = cups.find(c => c.id === id);
      if (sourceCup && sourceCup.layers.length > 0) {
        const isFullSorted = sourceCup.layers.length === maxLayers && sourceCup.layers.every(l => l === sourceCup.layers[0]);
        if (!isFullSorted) {
          setSelectedCupId(id);
        }
      }
    } else if (selectedCupId === id) {
      setSelectedCupId(null);
    } else {
      const sourceCup = cups.find(c => c.id === selectedCupId)!;
      const targetCup = cups.find(c => c.id === id)!;
      const sourceTopColor = sourceCup.layers[sourceCup.layers.length - 1];
      const targetTopColor = targetCup.layers[targetCup.layers.length - 1];

      if (targetCup.layers.length < maxLayers && (targetCup.layers.length === 0 || targetTopColor === sourceTopColor)) {
        let layersToMove = 0;
        for (let i = sourceCup.layers.length - 1; i >= 0; i--) {
          if (sourceCup.layers[i] === sourceTopColor) layersToMove++;
          else break;
        }
        const spaceInTarget = maxLayers - targetCup.layers.length;
        const actualMoveCount = Math.min(layersToMove, spaceInTarget);

        if (actualMoveCount > 0) {
          const fromEl = cupRefs.current[selectedCupId];
          const toEl = cupRefs.current[id];

          if (fromEl && toEl) {
            setPouringState({
              color: sourceTopColor,
              fromId: selectedCupId,
              toId: id,
              fromRect: fromEl.getBoundingClientRect(),
              toRect: toEl.getBoundingClientRect(),
            });

            // 执行动画后更新状态
            setTimeout(() => {
              const movedLayers = sourceCup.layers.slice(-actualMoveCount);
              const remainingSourceLayers = sourceCup.layers.slice(0, -actualMoveCount);
              const newTargetLayers = [...targetCup.layers, ...movedLayers];

              setCups(prevCups => prevCups.map(c => {
                if (c.id === selectedCupId) return { ...c, layers: remainingSourceLayers };
                if (c.id === id) return { ...c, layers: newTargetLayers };
                return c;
              }));
              setPouringState(null);
            }, 600);
          }
        }
      }
      setSelectedCupId(null);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 背景Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {/* 游戏内容 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-1 sm:py-2 max-w-5xl mx-auto">

        {/* 倾倒动画层 (全局 SVG) */}
        {pouringState && (
          <svg className="fixed inset-0 pointer-events-none z-50 w-full h-full overflow-visible">
            <defs>
              <filter id="liquid-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path
              filter="url(#liquid-glow)"
              d={`
                M ${pouringState.fromRect.left + pouringState.fromRect.width / 2} ${pouringState.fromRect.top + 10}
                Q ${pouringState.fromRect.left + pouringState.fromRect.width / 2 + (pouringState.toRect.left - pouringState.fromRect.left) / 2} ${Math.min(pouringState.fromRect.top, pouringState.toRect.top) - 80}
                  ${pouringState.toRect.left + pouringState.toRect.width / 2} ${pouringState.toRect.top + 5}
              `}
              fill="none"
              stroke={pouringState.color}
              strokeWidth="12"
              strokeLinecap="round"
              className="animate-liquid-flow"
              style={{
                strokeDasharray: '500',
                strokeDashoffset: '500',
                animation: 'liquid-flow-anim 0.6s ease-in-out forwards'
              }}
            />
          </svg>
        )}

        {/* 顶部信息栏 */}
        <div className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border border-orange-100 shadow-lg mt-1 sm:mt-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap shadow-sm">
              <span>第 {score + 1} 关</span>
            </div>
            <button
              onClick={() => setShowResetOptions(true)}
              className="p-1 sm:p-2 bg-white rounded-full text-orange-600 shadow-sm active:scale-90 transition-transform border border-orange-100 text-sm"
            >
              ↺
            </button>
          </div>
        </div>



        {/* 瓶子网格区域 */}
        <div className="flex-1 flex items-center justify-center w-full px-1 sm:px-2 py-1 sm:py-2 overflow-y-auto min-h-0">
          <div className={`grid gap-1 sm:gap-2 md:gap-4 lg:gap-6 justify-center items-center
                ${cups.length <= 4 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' :
              cups.length <= 6 ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6' :
                'grid-rows-2 grid-flow-col grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4'}
            `}>
            {cups.map(cup => {
              const maxLayers = getMaxLayers(score);
              const isSelected = selectedCupId === cup.id;
              const isFullSorted = cup.layers.length === maxLayers && cup.layers.every(l => l === cup.layers[0]);

              const isPouringFrom = pouringState?.fromId === cup.id;
              const isPouringTo = pouringState?.toId === cup.id;

              // 动态倾斜角度：往左倒则倾斜-35度，往右倒则倾斜35度
              let tiltAngle = 35;
              if (isPouringFrom && pouringState) {
                if (pouringState.toRect.left < pouringState.fromRect.left) {
                  tiltAngle = -35;
                }
              }

              return (
                <div
                  key={cup.id}
                  ref={el => cupRefs.current[cup.id] = el}
                  onClick={() => handleCupClick(cup.id)}
                  className={`relative group cursor-pointer transition-all duration-300 flex flex-col items-center
                                ${isSelected ? '-translate-y-2 sm:-translate-y-4 md:-translate-y-6' : ''}
                                ${isPouringFrom ? '-translate-y-8 sm:-translate-y-12 z-40' : ''}
                            `}
                  style={isPouringFrom ? { transform: `rotate(${tiltAngle}deg) translateY(-2rem)` } : {}}
                >
                  <div className={`
                                w-12 h-28 sm:w-14 sm:h-32 md:w-16 md:h-36 lg:w-20 lg:h-44 bg-white/50 rounded-b-2xl md:rounded-b-3xl border-x-[2px] border-b-[2px] sm:border-x-[3px] sm:border-b-[3px] md:border-x-4 md:border-b-4 relative overflow-hidden flex flex-col-reverse transition-all duration-300
                                ${isSelected ? 'border-orange-500 shadow-xl sm:shadow-2xl' : 'border-slate-200'}
                                ${isFullSorted ? 'ring-2 sm:ring-4 ring-green-400/30 scale-105' : ''}
                            `}>
                    {cup.layers.map((color, idx) => (
                      <div
                        key={idx}
                        className={`w-full transition-all duration-500 ease-out border-t border-white/5
                                            ${isPouringFrom && idx === cup.layers.length - 1 ? 'opacity-0 scale-x-0' : ''}
                                        `}
                        style={{
                          backgroundColor: color,
                          height: `${100 / maxLayers}%`
                        }}
                      />
                    ))}

                    {/* 目标杯子的注入层预览 */}
                    {isPouringTo && (
                      <div
                        className="w-full animate-pour-in border-t border-white/5"
                        style={{
                          backgroundColor: pouringState.color,
                          height: `${100 / maxLayers}%`
                        }}
                      />
                    )}

                    {isFullSorted && (
                      <div className="absolute inset-0 bg-white/10 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-[8px] md:text-[10px] text-white px-2 py-0.5 rounded-full font-black mt-1 shadow-sm uppercase bg-green-500">
                          已完成
                        </div>
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-orange-500 animate-bounce">
                      ↓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 胜利提示 */}
        {gameState === 'WON' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-8 rounded-3xl shadow-2xl text-center max-w-md mx-4">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">恭喜过关！</h2>
              <p className="text-lg mb-4">所有颜色都已正确分离！</p>
              <p className="text-sm opacity-80">即将进入下一关...</p>
            </div>
          </div>
        )}


      </div>

      {/* 重置选项弹窗 (手动或死锁触发) */}
      {(showResetOptions || isDeadlocked) && gameState !== 'WON' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            <div className="text-6xl mb-4">🍹</div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">
              {isDeadlocked ? '哎呀，没步骤了！' : '想要怎么做？'}
            </h3>
            <p className="text-gray-600 mb-8 font-medium">
              你可以选择重玩当前的布局，或者重新生成新的一局。
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => startLevel(true)}
                className="w-full py-4 bg-orange-100 text-orange-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-200 transition-colors"
              >
                重玩本关 (保留原样)
              </button>
              <button
                onClick={() => startLevel(false)}
                className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg transition-all"
              >
                新的一局 (随机生成)
              </button>
              {!isDeadlocked && (
                <button
                  onClick={() => setShowResetOptions(false)}
                  className="w-full py-2 text-gray-400 font-bold hover:text-gray-600"
                >
                  取消
                </button>
              )}
              {isDeadlocked && (
                <button
                  onClick={() => { }}
                  className="w-full py-2 text-gray-400 font-bold hover:text-gray-600"
                >
                  返回主页
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes liquid-flow-anim {
          0% { stroke-dashoffset: 500; opacity: 0; }
          20% { opacity: 1; }
          80% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -500; opacity: 0; }
        }
        .animate-pour-in {
          animation: pour-in-grow 0.6s ease-in-out forwards;
          transform-origin: bottom;
        }
        @keyframes pour-in-grow {
          0% { height: 0; opacity: 0; }
          40% { height: 0; opacity: 1; }
          100% { height: 25%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DrinkShopGame;