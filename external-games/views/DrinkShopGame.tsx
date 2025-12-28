
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import GameLayout from '../components/GameLayout';
import GameResultModal from '../components/GameResultModal';
import { Trophy, User, ArrowBigDownDash, Beer, ShoppingBag, CheckCircle2, RotateCcw, RefreshCw, Star } from 'lucide-react';

interface Cup {
  id: number;
  layers: string[]; // Max length 4
}

interface Customer {
  id: number;
  color: string;
  isServed: boolean;
}

interface PouringState {
  color: string;
  fromId: number;
  toId: number;
  fromRect: DOMRect;
  toRect: DOMRect;
}

const MAX_LAYERS = 4;
const HIGH_CONTRAST_COLORS = [
  '#FF0000', // 纯红
  '#0044FF', // 纯蓝
  '#008800', // 深绿
  '#FFCC00', // 金黄
  '#9900FF', // 紫色
  '#FF6600', // 橙色
];

const DrinkShopGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [score, setScore] = useState(0); // 关卡索引，从0开始
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [cups, setCups] = useState<Cup[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCupId, setSelectedCupId] = useState<number | null>(null);
  const [targetSold, setTargetSold] = useState(0);
  const [currentSold, setCurrentSold] = useState(0);
  const [isDeadlocked, setIsDeadlocked] = useState(false);
  const [showResetOptions, setShowResetOptions] = useState(false);
  const [pouringState, setPouringState] = useState<PouringState | null>(null);
  
  const initialLevelData = useRef<{
    cups: Cup[];
    customerQueue: Customer[];
  } | null>(null);

  const customerIdCounter = useRef(0);
  const customerQueueRef = useRef<Customer[]>([]);
  const spawnTimerRef = useRef<number | null>(null);
  const cupRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const startLevel = useCallback((isRestartingSame: boolean) => {
    if (isRestartingSame && initialLevelData.current) {
      const data = initialLevelData.current;
      setCups(JSON.parse(JSON.stringify(data.cups)));
      customerQueueRef.current = JSON.parse(JSON.stringify(data.customerQueue));
    } else {
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
        for (let i = 0; i < MAX_LAYERS; i++) allLayers.push(color);
      });

      for (let i = allLayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allLayers[i], allLayers[j]] = [allLayers[j], allLayers[i]];
      }

      const newCups: Cup[] = [];
      for (let i = 0; i < colorCount; i++) {
        newCups.push({ id: i, layers: allLayers.slice(i * MAX_LAYERS, (i + 1) * MAX_LAYERS) });
      }
      for (let i = 0; i < emptyCupCount; i++) {
        newCups.push({ id: colorCount + i, layers: [] });
      }

      const freshQueue = activeColors.map(color => ({
        id: ++customerIdCounter.current,
        color,
        isServed: false
      })).sort(() => Math.random() - 0.5);

      initialLevelData.current = {
        cups: JSON.parse(JSON.stringify(newCups)),
        customerQueue: JSON.parse(JSON.stringify(freshQueue))
      };

      setCups(newCups);
      customerQueueRef.current = JSON.parse(JSON.stringify(freshQueue));
      setTargetSold(colorCount);
    }

    const firstQueue = JSON.parse(JSON.stringify(customerQueueRef.current));
    const firstCustomer = firstQueue.shift();
    customerQueueRef.current = firstQueue;
    
    setCustomers(firstCustomer ? [firstCustomer] : []);
    setGameState(GameState.PLAYING);
    setCurrentSold(0);
    setIsDeadlocked(false);
    setSelectedCupId(null);
    setShowResetOptions(false);
    setPouringState(null);

    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    spawnTimerRef.current = window.setInterval(() => {
        setCustomers(prev => {
            if (prev.length >= 3 || customerQueueRef.current.length === 0) return prev;
            const next = customerQueueRef.current.shift();
            return next ? [...prev, next] : prev;
        });
    }, 8000); 
  }, [score]);

  useEffect(() => {
    startLevel(false);
    return () => {
        if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [score, startLevel]);

  const checkDeadlock = useCallback((currentCups: Cup[]) => {
    for (let i = 0; i < currentCups.length; i++) {
      const source = currentCups[i];
      if (source.layers.length === 0) continue;
      const isFullSorted = source.layers.length === MAX_LAYERS && source.layers.every(l => l === source.layers[0]);
      if (isFullSorted) continue;

      for (let j = 0; j < currentCups.length; j++) {
        if (i === j) continue;
        const target = currentCups[j];
        if (target.layers.length < MAX_LAYERS) {
          if (target.layers.length === 0 || target.layers[target.layers.length - 1] === source.layers[source.layers.length - 1]) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  useEffect(() => {
    if (gameState !== GameState.PLAYING || pouringState) return;

    let anySaleHappening = false;
    cups.forEach(cup => {
      if (cup.layers.length === MAX_LAYERS && cup.layers.every(l => l === cup.layers[0])) {
        const color = cup.layers[0];
        let customerIndex = customers.findIndex(cust => cust.color === color && !cust.isServed);
        
        if (customerIndex === -1 && customerQueueRef.current.some(c => c.color === color)) {
          const queueIdx = customerQueueRef.current.findIndex(c => c.color === color);
          if (queueIdx !== -1) {
            const [neededCustomer] = customerQueueRef.current.splice(queueIdx, 1);
            setCustomers(prev => {
              const newCusts = [...prev];
              if (newCusts.length >= 3) newCusts.pop();
              return [neededCustomer, ...newCusts];
            });
            anySaleHappening = true;
            return;
          }
        }

        if (customerIndex !== -1) {
          anySaleHappening = true;
          setCustomers(prev => prev.map((c, idx) => idx === customerIndex ? { ...c, isServed: true } : c));
          
          setTimeout(() => {
            setCups(prevCups => prevCups.map(c => c.id === cup.id ? { ...c, layers: [] } : c));
            setCustomers(prevCust => prevCust.filter((_, idx) => idx !== customerIndex));
            setCurrentSold(prev => prev + 1);
          }, 1200);
        }
      }
    });

    if (!anySaleHappening && currentSold < targetSold) {
       if (checkDeadlock(cups)) {
          const checkTimer = setTimeout(() => {
            if (checkDeadlock(cups) && gameState === GameState.PLAYING) {
               setGameState(GameState.GAME_OVER);
               setIsDeadlocked(true);
            }
          }, 2000);
          return () => clearTimeout(checkTimer);
       }
    }
  }, [cups, customers, gameState, checkDeadlock, currentSold, targetSold, pouringState]);

  useEffect(() => {
      if (gameState === GameState.PLAYING && currentSold >= targetSold && targetSold > 0) {
          setGameState(GameState.WON);
      }
  }, [currentSold, targetSold, gameState]);

  const handleCupClick = (id: number) => {
    if (gameState !== GameState.PLAYING || pouringState) return;

    if (selectedCupId === null) {
      const sourceCup = cups.find(c => c.id === id);
      if (sourceCup && sourceCup.layers.length > 0) {
          const isFullSorted = sourceCup.layers.length === MAX_LAYERS && sourceCup.layers.every(l => l === sourceCup.layers[0]);
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

      if (targetCup.layers.length < MAX_LAYERS && (targetCup.layers.length === 0 || targetTopColor === sourceTopColor)) {
        let layersToMove = 0;
        for (let i = sourceCup.layers.length - 1; i >= 0; i--) {
          if (sourceCup.layers[i] === sourceTopColor) layersToMove++;
          else break;
        }
        const spaceInTarget = MAX_LAYERS - targetCup.layers.length;
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
    <GameLayout
      title="色彩饮品店"
      level={score + 1}
      onBack={onBack}
      bgColorClass="bg-orange-50"
      customHeader={
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-lg md:text-xl font-bold text-orange-900 leading-none">色彩饮品店</h1>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap shadow-sm">
              <Star size={12} fill="currentColor" />
              <span>第 {score + 1} 关</span>
            </div>
            <div className="bg-orange-100 text-orange-700 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap shadow-sm">
              <Trophy size={12} />
              <span>销量: {currentSold}/{targetSold}</span>
            </div>
          </div>
        </div>
      }
      headerRight={
        <button 
          onClick={() => setShowResetOptions(true)}
          className="p-2 bg-white rounded-full text-orange-600 shadow-sm active:scale-90 transition-transform border border-orange-100"
        >
          <RotateCcw size={20} />
        </button>
      }
    >
      <div className="flex-1 flex flex-col items-center justify-between py-2 h-full max-w-5xl mx-auto w-full relative">
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

        {/* 点单吧台区 */}
        <div className="w-full flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-orange-800 font-black text-lg">
             <ShoppingBag size={20} />
             <span>进店顾客</span>
          </div>
          <div className="flex gap-4 min-h-[90px] w-full justify-center px-4">
            {[0, 1, 2].map(slotIdx => {
              const customer = customers[slotIdx];
              return (
                <div key={slotIdx} className="w-20 h-20 md:w-24 md:h-24 bg-white/60 border-2 border-dashed border-orange-200 rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-500">
                  {customer ? (
                    <div className={`flex flex-col items-center transition-all duration-500 ${customer.isServed ? 'opacity-30 scale-90' : 'animate-[bounce_3s_infinite]'}`}>
                      <div className="relative">
                        <User size={36} className="text-gray-600 md:size-[44px]" />
                        <div 
                           className="absolute -top-1 -right-1 w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white shadow-lg"
                           style={{ backgroundColor: customer.color }}
                        />
                        {customer.isServed && (
                             <div className="absolute inset-0 flex items-center justify-center text-green-500">
                                <CheckCircle2 size={32} />
                             </div>
                        )}
                      </div>
                      <span className="text-[8px] font-black text-orange-600 mt-1">
                          {customer.isServed ? '请慢用' : '想喝这个'}
                      </span>
                    </div>
                  ) : (
                    <div className="opacity-10 flex flex-col items-center">
                        <User size={24} className="text-orange-900" />
                        <span className="text-[7px] font-bold">空闲中</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 瓶子网格区域 */}
        <div className="flex-1 flex items-center justify-center w-full px-4 py-2 overflow-y-auto">
            <div className={`grid gap-3 md:gap-8 lg:gap-12 justify-center
                ${cups.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-4'}
            `}>
                {cups.map(cup => {
                    const isSelected = selectedCupId === cup.id;
                    const isFullSorted = cup.layers.length === MAX_LAYERS && cup.layers.every(l => l === cup.layers[0]);
                    const matchedCustomer = isFullSorted && customers.some(cust => cust.color === cup.layers[0] && !cust.isServed);
                    
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
                            className={`relative group cursor-pointer transition-all duration-300
                                ${isSelected ? '-translate-y-4 md:-translate-y-6' : ''}
                                ${isPouringFrom ? '-translate-y-12 z-40' : ''}
                            `}
                            style={isPouringFrom ? { transform: `rotate(${tiltAngle}deg) translateY(-3rem)` } : {}}
                        >
                            <div className={`
                                w-14 h-32 md:w-20 md:h-44 bg-white/50 rounded-b-2xl md:rounded-b-3xl border-x-[3px] border-b-[3px] md:border-x-4 md:border-b-4 relative overflow-hidden flex flex-col-reverse transition-all duration-300
                                ${isSelected ? 'border-orange-500 shadow-2xl' : 'border-slate-200'}
                                ${isFullSorted ? 'ring-4 ring-green-400/30 scale-105' : ''}
                            `}>
                                {cup.layers.map((color, idx) => (
                                    <div 
                                        key={idx}
                                        className={`w-full h-1/4 transition-all duration-500 ease-out border-t border-white/5
                                            ${isPouringFrom && idx === cup.layers.length - 1 ? 'opacity-0 scale-x-0' : ''}
                                        `}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                
                                {/* 目标杯子的注入层预览 */}
                                {isPouringTo && (
                                  <div 
                                    className="w-full h-1/4 animate-pour-in border-t border-white/5" 
                                    style={{ backgroundColor: pouringState.color }} 
                                  />
                                )}

                                {isFullSorted && (
                                    <div className="absolute inset-0 bg-white/10 flex flex-col items-center justify-center pointer-events-none">
                                        <Beer className={`text-white drop-shadow-md ${matchedCustomer ? 'animate-pulse' : ''}`} size={28} />
                                        <div className={`text-[8px] md:text-[10px] text-white px-2 py-0.5 rounded-full font-black mt-1 shadow-sm uppercase
                                            ${matchedCustomer ? 'bg-green-500' : 'bg-gray-400'}
                                        `}>
                                            {matchedCustomer ? '取货中' : '等单中'}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {isSelected && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-orange-500 animate-bounce">
                                    <ArrowBigDownDash size={24} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 底部信息面板 */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-orange-100 shadow-lg max-w-sm text-center mb-2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-orange-500 shrink-0" size={18} />
              <p className="text-[10px] md:text-xs font-bold text-orange-900 leading-tight">
                  本局共{targetSold}种口味！空瓶有限，只有当顾客点单匹配时才会被买走。
              </p>
            </div>
            <button 
              onClick={() => setShowResetOptions(true)}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-orange-600 transition-colors shadow-md active:scale-95"
            >
              <RotateCcw size={14} />
              重新开始
            </button>
        </div>
      </div>

      {/* 重置选项弹窗 (手动或死锁触发) */}
      {(showResetOptions || isDeadlocked) && gameState !== GameState.WON && (
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
                        <RefreshCw size={20} />
                        重玩本关 (保留原样)
                    </button>
                    <button 
                        onClick={() => startLevel(false)}
                        className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg transition-all"
                    >
                        <RotateCcw size={20} />
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
                            onClick={onBack}
                            className="w-full py-2 text-gray-400 font-bold hover:text-gray-600"
                        >
                            返回主页
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      <GameResultModal
        gameState={gameState}
        onRestart={() => startLevel(true)} 
        onNextLevel={() => setScore(prev => prev + 1)}
        onHome={onBack}
        message={`色彩店长太厉害了！第 ${score + 1} 关已售罄！`}
      />

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
    </GameLayout>
  );
};

export default DrinkShopGame;
