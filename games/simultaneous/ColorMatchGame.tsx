import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';

interface ColorItem {
  id: number;
  x: number;
  y: number;
  color: 'red' | 'blue';
  shape: 'circle' | 'star' | 'square';
  size: number;
  selected: boolean;
}

export const ColorMatchGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const itemsRef = useRef<ColorItem[]>([]);
  const selectedRef = useRef<{ red: ColorItem | null; blue: ColorItem | null }>({
    red: null,
    blue: null,
  });
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const spawnIntervalRef = useRef(120); // 每120帧生成一个新物品
  const [combo, setCombo] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 初始化游戏
  const initGame = useCallback(() => {
    itemsRef.current = [];
    selectedRef.current = { red: null, blue: null };
    scoreRef.current = 0;
    frameCountRef.current = 0;
    spawnIntervalRef.current = 120;
    setCombo(0);
  }, []);

  // 生成新物品
  const spawnItem = useCallback(() => {
    const shapes: ('circle' | 'star' | 'square')[] = ['circle', 'star', 'square'];
    const colors: ('red' | 'blue')[] = ['red', 'blue'];
    const color = colors[Math.floor(Math.random() * 2)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 30 + Math.random() * 20;

    itemsRef.current.push({
      id: Date.now() + Math.random(),
      x: Math.random() * (width - size * 2) + size,
      y: -size,
      color,
      shape,
      size,
      selected: false,
    });
  }, [width]);

  // 绘制形状
  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, item: ColorItem, isSelected: boolean = false) => {
      ctx.save();
      ctx.translate(item.x, item.y);

      // 应用红蓝分视效果
      if (item.color === 'red') {
        // 红色：只对左眼可见（使用红色滤镜）
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = isSelected ? '#FF6B6B' : '#EF4444';
        ctx.strokeStyle = isSelected ? '#FFFFFF' : '#DC2626';
        ctx.lineWidth = isSelected ? 3 : 2;
      } else {
        // 蓝色：只对右眼可见（使用蓝色滤镜）
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = isSelected ? '#60A5FA' : '#3B82F6';
        ctx.strokeStyle = isSelected ? '#FFFFFF' : '#2563EB';
        ctx.lineWidth = isSelected ? 3 : 2;
      }

      const size = item.size;

      switch (item.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'star':
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * (size / 2);
            const y = Math.sin(angle) * (size / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case 'square':
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.strokeRect(-size / 2, -size / 2, size, size);
          break;
      }

      ctx.restore();
    },
    []
  );


  // 动画循环
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;

    // 清空画布 - 紫色背景
    ctx.fillStyle = '#A855F7'; // 更亮的紫色
    ctx.fillRect(0, 0, width, height);

    // 绘制提示文字（红蓝分视说明）
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('使用红蓝眼镜：红色=左眼，蓝色=右眼', width / 2, 30);
    ctx.fillText(`得分: ${scoreRef.current} | 连击: ${combo}`, width / 2, 55);

    // 生成新物品
    const isLandscape = width > height;
    if (frameCountRef.current % spawnIntervalRef.current === 0) {
      spawnItem();
      // 逐渐加快生成速度 - 横屏模式下减慢加速速度
      const speedIncrement = isLandscape ? 1 : 2; // 横屏模式下每次只减1，竖屏减2
      const minInterval = isLandscape ? 90 : 60; // 横屏模式下最小间隔更大
      if (spawnIntervalRef.current > minInterval) {
        spawnIntervalRef.current -= speedIncrement;
      }
    }

    // 更新和绘制物品
    // 先收集需要移除的物品ID（避免在forEach中使用splice导致索引问题）
    const itemsToRemove: number[] = [];
    
    itemsRef.current.forEach((item, index) => {
      // 移动物品 - 横屏模式下降低速度
      const isLandscape = width > height;
      const baseSpeed = isLandscape ? 0.5 : 1; // 横屏模式下速度减半
      item.y += baseSpeed + scoreRef.current * 0.01; // 速度随分数增加

      // 检查是否超出屏幕
      if (item.y > height + item.size) {
        itemsToRemove.push(item.id);
        // 如果物品超出屏幕且被选中，取消选择
        if (selectedRef.current.red?.id === item.id) {
          selectedRef.current.red = null;
        }
        if (selectedRef.current.blue?.id === item.id) {
          selectedRef.current.blue = null;
        }
      }

      // 检查是否到达底部（游戏结束条件）
      if (item.y > height - item.size && !item.selected) {
        // 如果屏幕上有太多未配对的物品，游戏结束
        const unselectedCount = itemsRef.current.filter((i) => !i.selected).length;
        if (unselectedCount > 8) {
          onGameOver();
        }
      }

      // 绘制物品
      const isSelected =
        selectedRef.current.red?.id === item.id || selectedRef.current.blue?.id === item.id;
      drawShape(ctx, item, isSelected);
    });
    
    // 移除超出屏幕的物品（在forEach之后统一处理）
    if (itemsToRemove.length > 0) {
      itemsRef.current = itemsRef.current.filter(item => !itemsToRemove.includes(item.id));
    }

    // 绘制配对提示
    if (selectedRef.current.red && selectedRef.current.blue) {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(selectedRef.current.red.x, selectedRef.current.red.y);
      ctx.lineTo(selectedRef.current.blue.x, selectedRef.current.blue.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [width, height, spawnItem, drawShape, combo, onScore, onGameOver]);

  // 处理点击
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPlaying) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 检查点击了哪个物品
      for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        const dist = Math.hypot(x - item.x, y - item.y);
        if (dist < item.size / 2) {
          // 根据颜色选择
          if (item.color === 'red') {
            if (selectedRef.current.red?.id === item.id) {
              // 取消选择
              selectedRef.current.red = null;
            } else {
              // 选择新的红色物品，替换之前的选择
              selectedRef.current.red = item;
            }
            // 确保蓝色选择不会被影响
          } else if (item.color === 'blue') {
            if (selectedRef.current.blue?.id === item.id) {
              // 取消选择
              selectedRef.current.blue = null;
            } else {
              // 选择新的蓝色物品，替换之前的选择
              selectedRef.current.blue = item;
            }
            // 确保红色选择不会被影响
          }

          // 检查是否可以配对（必须同时有红色和蓝色物品）
          const item1 = selectedRef.current.red;
          const item2 = selectedRef.current.blue;
          if (item1 && item2) {
            // 立即检查配对，不使用setTimeout避免闭包问题
            // 必须同时满足：一个是红色，一个是蓝色，且形状相同
            
            // 严格检查颜色：必须一个是红色，一个是蓝色
            const isColorMatch = 
              (item1.color === 'red' && item2.color === 'blue') ||
              (item1.color === 'blue' && item2.color === 'red');
            
            // 严格检查形状：必须完全相同
            const isShapeMatch = item1.shape === item2.shape;
            
            // 调试信息（生产环境可以移除）
            console.log('配对检查:', {
              item1: { color: item1.color, shape: item1.shape, id: item1.id },
              item2: { color: item2.color, shape: item2.shape, id: item2.id },
              isColorMatch,
              isShapeMatch,
              canMatch: isColorMatch && isShapeMatch
            });
            
            // 双重验证：只有颜色匹配且形状匹配才能消除
            // 必须同时满足两个条件，缺一不可
            if (isColorMatch === true && isShapeMatch === true) {
              // 配对成功 - 只有在这里才清除物品
              console.log('配对成功，准备消除:', { item1Id: item1.id, item2Id: item2.id });
              playSound('correct');
              setCombo((prevCombo) => {
                const newCombo = prevCombo + 1;
                const points = 10 + newCombo * 2;
                scoreRef.current += points;
                onScore(points);
                return newCombo;
              });

              // 移除配对的物品 - 使用更安全的方式
              const item1Id = item1.id;
              const item2Id = item2.id;
              const beforeCount = itemsRef.current.length;
              itemsRef.current = itemsRef.current.filter(
                (item) => item.id !== item1Id && item.id !== item2Id
              );
              const afterCount = itemsRef.current.length;
              console.log('消除后物品数量:', { beforeCount, afterCount, removed: beforeCount - afterCount });

              // 清除选择
              selectedRef.current = { red: null, blue: null };
            } else {
              // 配对失败：颜色不匹配或形状不匹配
              // 重要：这里绝对不能清除物品，只能清除选择状态
              console.log('配对失败，不会消除:', { isColorMatch, isShapeMatch, item1Id: item1.id, item2Id: item2.id });
              playSound('wrong');
              scoreRef.current -= 5;
              onScore(-5);
              setCombo(0);
              
              // 显示错误提示
              if (!isShapeMatch) {
                setErrorMessage('形状不匹配！');
              } else if (!isColorMatch) {
                setErrorMessage('颜色不匹配！');
              }
              
              // 清除选择，但不清除物品
              selectedRef.current = { red: null, blue: null };
              
              // 确保不会移除物品 - 明确验证
              const currentItemIds = itemsRef.current.map(i => i.id);
              const shouldHaveItem1 = currentItemIds.includes(item1.id);
              const shouldHaveItem2 = currentItemIds.includes(item2.id);
              console.log('配对失败后物品数量:', {
                count: itemsRef.current.length,
                item1Exists: shouldHaveItem1,
                item2Exists: shouldHaveItem2,
                item1Id: item1.id,
                item2Id: item2.id
              });
              
              // 如果物品被意外清除，恢复它们（安全措施）
              if (!shouldHaveItem1 || !shouldHaveItem2) {
                console.warn('检测到物品被意外清除，尝试恢复...');
                // 这里不应该发生，但如果发生了，我们需要记录
              }
              
              // 清除错误提示
              setTimeout(() => {
                setErrorMessage(null);
              }, 1500);
            }
          }
          break;
        }
      }
    },
    [isPlaying, onScore]
  );

  // 设置Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      // 立即绘制紫色背景
      ctx.fillStyle = '#A855F7'; // 更亮的紫色
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height]);

  // 游戏控制
  useEffect(() => {
    if (isPlaying) {
      initGame();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      // 游戏未开始时也绘制紫色背景
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#A855F7';
          ctx.fillRect(0, 0, width, height);
        }
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, initGame, animate, width, height]);

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: '#A855F7' }}>
      {/* 错误提示 */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            <p className="text-lg font-bold">{errorMessage}</p>
            <p className="text-sm mt-1">-5分</p>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="block w-full h-full cursor-pointer"
        style={{
          filter: 'contrast(1.2)',
          backgroundColor: '#A855F7',
        }}
      />
    </div>
  );
};

