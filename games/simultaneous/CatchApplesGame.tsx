import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { AppleIcon, BasketIcon } from './CatchApplesAssets';
import { AppleTreeSVG } from './AppleTreeSVG';
import { playSound } from '../../utils/gameUtils';

interface FallingApple {
  x: number; // percent 0-100
  y: number; // percent 0-100
  active: boolean;
}

interface StaticApple {
  x: number; // percent
  y: number; // percent
}

export const CatchApplesGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const [basketX, setBasketX] = useState(50); // Percent 0-100
  const [fallingApple, setFallingApple] = useState<FallingApple | null>(null);
  const [staticApples, setStaticApples] = useState<StaticApple[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'miss'; show: boolean }>({ type: 'success', show: false });
  const [gameStarted, setGameStarted] = useState(false); // 标记游戏是否已开始（已接住过至少一个苹果）

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const appleRef = useRef<FallingApple | null>(null);
  const missedCountRef = useRef(0);

  // 初始化静态苹果
  useEffect(() => {
    if (!isPlaying) return;
    const apples: StaticApple[] = [];
    // 将苹果集中在树冠区域（树的顶部中心）
    for (let i = 0; i < 8; i++) {
      apples.push({
        x: 30 + Math.random() * 40, // 30% to 70% width
        y: 5 + Math.random() * 25,  // 5% to 30% height (Upper tree canopy)
      });
    }
    setStaticApples(apples);
  }, [isPlaying]);

  // 生成新苹果
  const spawnApple = useCallback(() => {
    if (!isPlaying || gameOver) return;
    // 从树宽范围内生成（35% to 65%）
    const startX = 35 + Math.random() * 30;
    appleRef.current = { x: startX, y: 20, active: true }; // 从树冠稍低的位置开始
    setFallingApple({ ...appleRef.current });
  }, [isPlaying, gameOver]);

  // 游戏循环
  const updateGame = useCallback(() => {
    if (!isPlaying || gameOver) return;

    if (!appleRef.current || !appleRef.current.active) {
      // 如果没有苹果，立即生成一个
      if (!appleRef.current) {
        spawnApple();
      }
    } else {
      // 苹果下落
      appleRef.current.y += 0.2;

      // 检查是否超出边界（未接住）
      if (appleRef.current.y > 95) {
        appleRef.current.active = false;
        missedCountRef.current += 1;
        setMissedCount(missedCountRef.current);
        onScore(-1);
        playSound('wrong'); // 未接住音效
        
        // 显示未接住反馈
        setFeedback({ type: 'miss', show: true });
        setTimeout(() => {
          setFeedback({ type: 'miss', show: false });
        }, 1000);

        // 检查游戏结束条件：连续未接住3个
        if (missedCountRef.current >= 3) {
          setGameOver(true);
          onGameOver();
          return;
        }

        // 延迟后重新生成
        setTimeout(() => {
          if (isPlaying && !gameOver) {
            spawnApple();
          }
        }, 500);
      }

      setFallingApple({ ...appleRef.current });
    }

    requestRef.current = requestAnimationFrame(updateGame);
  }, [isPlaying, gameOver, spawnApple, onScore, onGameOver]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      requestRef.current = requestAnimationFrame(updateGame);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, gameOver, updateGame]);

  // 篮子移动
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying || gameOver || !containerRef.current) return;

    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const containerWidth = rect.width;

    // 将篮子限制在容器内
    const xPct = (x / containerWidth) * 100;
    setBasketX(Math.min(95, Math.max(5, xPct)));
  };

  // 接住苹果（需要点击篮子，苹果在篮子红色区域内就算接住）
  const handleBasketClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPlaying || gameOver || !appleRef.current || !appleRef.current.active) return;

    const apple = appleRef.current;

    // 明确计算篮子的实际区域（像素）
    // 篮子：bottom-[10%]，宽度90px，高度90px，中心在 basketX%
    const basketWidthPx = 90;
    const basketHeightPx = 90;
    const basketBottomPercent = 90; // 篮子底部距离屏幕顶部90%
    const basketTopPercent = basketBottomPercent - (basketHeightPx / height * 100); // 篮子顶部位置
    
    // 篮子水平范围：中心在 basketX%，宽度90px
    const basketLeftPercent = basketX - (basketWidthPx / width * 100) / 2;
    const basketRightPercent = basketX + (basketWidthPx / width * 100) / 2;
    
    // 苹果大小：w-12 h-12 (48px) 或 md:w-16 md:h-16 (64px)，取较大值64px
    const appleSizePx = 64;
    const appleHalfSizePercent = (appleSizePx / width * 100) / 2; // 苹果半径（百分比，用宽度计算水平）
    const appleHalfSizePercentV = (appleSizePx / height * 100) / 2; // 苹果半径（百分比，用高度计算垂直）
    
    // 计算苹果底部位置（苹果中心 + 苹果高度的一半）
    const appleBottomPercent = apple.y + appleHalfSizePercentV;
    
    // 碰撞检测规则：
    // 1. 水平：苹果必须在篮子水平范围内
    const appleLeft = apple.x - appleHalfSizePercent;
    const appleRight = apple.x + appleHalfSizePercent;
    const isHorizontalInRange = appleRight >= basketLeftPercent && appleLeft <= basketRightPercent;
    
    // 2. 垂直：苹果底部必须在篮子顶部和底部之间（未碰到篮子顶部时不能接，出了篮子底部也不能接）
    const isVerticalInRange = appleBottomPercent >= basketTopPercent && appleBottomPercent <= basketBottomPercent;

    if (isVerticalInRange && isHorizontalInRange) {
      // 接住了！
      onScore(1);
      playSound('correct'); // 接住音效
      missedCountRef.current = 0; // 重置未接住计数
      setMissedCount(0);
      setGameStarted(true); // 标记游戏已开始
      appleRef.current.active = false; // 立即隐藏
      setFallingApple(null);
      
      // 显示接住反馈
      setFeedback({ type: 'success', show: true });
      setTimeout(() => {
        setFeedback({ type: 'success', show: false });
      }, 1000);

      // 生成下一个
      setTimeout(() => {
        if (isPlaying && !gameOver) {
          spawnApple();
        }
      }, 500);
    } else {
      // 点击了但没接住
      playSound('wrong');
      setFeedback({ type: 'miss', show: true });
      setTimeout(() => {
        setFeedback({ type: 'miss', show: false });
      }, 1000);
    }
  };

  // 重置游戏状态
  useEffect(() => {
    if (isPlaying) {
      setMissedCount(0);
      setBasketX(50);
      setFallingApple(null);
      setGameOver(false);
      setFeedback({ type: 'success', show: false });
      setGameStarted(false); // 重置游戏开始标记
      missedCountRef.current = 0;
      appleRef.current = null;
      // 游戏开始时立即生成第一个苹果
      setTimeout(() => {
        spawnApple();
      }, 500);
    }
  }, [isPlaying, spawnApple]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#E040FB]">
      {/* 游戏容器 */}
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-hidden cursor-crosshair touch-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        {/* 背景云朵 */}
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

        {/* 大树 - 使用SVG，居中，从顶部到地面 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-[80%] h-full pointer-events-none z-10 flex items-end justify-center">
          <AppleTreeSVG className="w-full h-full object-contain object-bottom drop-shadow-2xl" />
        </div>

        {/* 树上的静态红苹果（装饰） */}
        {staticApples.map((pos, i) => (
          <div
            key={i}
            className="absolute w-10 h-10 md:w-14 md:h-14 z-20"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <AppleIcon color="#EF4444" className="w-full h-full animate-[bounce_3s_infinite]" />
          </div>
        ))}

        {/* 下落的深蓝色苹果（目标） */}
        {fallingApple && fallingApple.active && (
          <div
            className="absolute w-12 h-12 md:w-16 md:h-16 z-20 transition-transform"
            style={{
              left: `${fallingApple.x}%`,
              top: `${fallingApple.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* 蓝色苹果 - 使用红蓝配对消除中的蓝色 (#3B82F6) */}
            <AppleIcon color="#3B82F6" className="w-full h-full drop-shadow-md" />
          </div>
        )}

        {/* 底部草地 */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[25%] bg-[#81C784] rounded-[50%] border-t-4 border-[#66BB6A] z-0"></div>
        {/* 深色草块 */}
        <div className="absolute bottom-[2%] left-[20%] w-[10%] h-[5%] bg-[#4CAF50] rounded-full z-0 opacity-50"></div>
        <div className="absolute bottom-[5%] right-[30%] w-[15%] h-[6%] bg-[#4CAF50] rounded-full z-0 opacity-50"></div>

        {/* 玩家篮子 - 红色 */}
        <div
          className="absolute bottom-[10%] z-30 transition-transform duration-75 ease-out cursor-pointer"
          style={{
            left: `${basketX}%`,
            transform: 'translateX(-50%)',
            width: '90px',
            height: '90px',
          }}
          onClick={handleBasketClick}
        >
          <div className="w-full h-full relative group">
            <BasketIcon className="w-full h-full filter drop-shadow-2xl group-hover:scale-110 transition-transform" />
            {/* 点击提示 - 显示在篮子内部 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 text-purple-900 font-bold px-3 py-1 rounded-full text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              点击!
            </div>
          </div>
        </div>

        {/* 反馈提示 - 接住或未接住 */}
        {feedback.show && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className={`px-8 py-4 rounded-2xl shadow-2xl animate-bounce ${
              feedback.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              <p className="text-5xl font-black">
                {feedback.type === 'success' ? '✓' : '✗'}
              </p>
            </div>
          </div>
        )}

        {/* 游戏结束提示 */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40 pointer-events-none">
            <div className="bg-white/95 p-6 rounded-2xl text-center shadow-2xl">
              <p className="text-2xl font-bold text-red-600 mb-2">游戏结束</p>
              <p className="text-lg text-slate-700">连续未接住3个苹果</p>
            </div>
          </div>
        )}

        {/* 游戏说明覆盖层（淡出） */}
        {!gameStarted && missedCount === 0 && !fallingApple && !gameOver && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white pointer-events-none z-40 bg-black/20 p-6 rounded-3xl backdrop-blur-sm">
            <p className="text-2xl font-black mb-2 drop-shadow-lg">移动红篮子</p>
            <p className="font-bold drop-shadow-md">
              接住掉落的 <span className="text-blue-200 text-xl">蓝苹果</span>
            </p>
            <p className="text-sm mt-4 bg-white/30 px-3 py-1 rounded-full inline-block">重合时点击屏幕</p>
          </div>
        )}
      </div>
    </div>
  );
};

