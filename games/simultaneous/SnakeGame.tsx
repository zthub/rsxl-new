import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Cell {
  x: number;
  y: number;
}

interface SnakeState {
  snake: Cell[];
  direction: Direction;
  pendingDirection: Direction;
  food: Cell;
  lastUpdate: number;
  gameOver: boolean;
}

// 贪吃蛇 - 同时视版本：红色蛇身 + 蓝色食物 + 紫色背景
export const SnakeGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const stateRef = useRef<SnakeState | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // 虚拟摇杆状态
  const joystickRef = useRef<{
    isActive: boolean;
    centerX: number;
    centerY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  
  // 摇杆尺寸常量
  const joystickSize = 120;
  const joystickRadius = joystickSize / 2;
  const knobSize = 50;
  const knobRadius = knobSize / 2;

  // 更新摇杆方向
  const updateJoystickDirection = useCallback((x: number, y: number, centerX: number, centerY: number) => {
    const state = stateRef.current;
    if (!state || !isPlaying) return;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.hypot(dx, dy);
    const threshold = 20; // 最小拖拽距离
    
    if (distance < threshold) return;
    
    const currentDir = state.direction;
    let newDir: Direction | null = null;
    
    // 根据拖拽方向确定新的方向
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平方向
      if (dx > 0 && currentDir !== 'LEFT') {
        newDir = 'RIGHT';
      } else if (dx < 0 && currentDir !== 'RIGHT') {
        newDir = 'LEFT';
      }
    } else {
      // 垂直方向
      if (dy > 0 && currentDir !== 'UP') {
        newDir = 'DOWN';
      } else if (dy < 0 && currentDir !== 'DOWN') {
        newDir = 'UP';
      }
    }
    
    if (newDir) {
      state.pendingDirection = newDir;
    }
  }, [isPlaying]);

  // 检测是否为触摸设备
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  // 全局事件监听，确保手指移出摇杆区域时也能响应
  useEffect(() => {
    if (!isTouchDevice) return;

    const handleGlobalMove = (e: PointerEvent) => {
      if (joystickRef.current?.isActive) {
        const { centerX, centerY } = joystickRef.current;
        joystickRef.current.currentX = e.clientX;
        joystickRef.current.currentY = e.clientY;
        
        // 更新摇杆视觉位置
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.hypot(dx, dy);
        const maxDrag = joystickRadius - knobRadius - 5;
        
        if (distance > maxDrag) {
          const angle = Math.atan2(dy, dx);
          setJoystickPosition({
            x: Math.cos(angle) * maxDrag,
            y: Math.sin(angle) * maxDrag,
          });
        } else {
          setJoystickPosition({ x: dx, y: dy });
        }
        
        updateJoystickDirection(e.clientX, e.clientY, centerX, centerY);
      }
    };

    const handleGlobalUp = (e: PointerEvent) => {
      if (joystickRef.current?.isActive) {
        joystickRef.current = null;
        setJoystickPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, [isTouchDevice, joystickRadius, knobRadius, updateJoystickDirection]);

  // 网格设置：根据屏幕和设备类型自适应方格大小
  const getGridSize = () => {
    const isLandscape = width > height;
    // 用画布尺寸来判断是不是“小屏”，避免只看 window.innerWidth 导致手机横屏识别不到
    const longestSide = Math.max(width, height);
    const isSmallCanvas = longestSide <= 900; // 一般手机画布最长边 < 900
    
    if (isLandscape) {
      const isPhoneLandscape = isSmallCanvas;
      // 横屏手机：在之前基础上放大 3 倍（更粗的格子），平板/电脑保持原来偏大的格子
      const approxCell = isPhoneLandscape ? 18 : 42; // 手机目标单格 ~18px
      const minCols = isPhoneLandscape ? 14 : 9;
      const cols = Math.max(minCols, Math.floor(width / approxCell));
      const cellSize = Math.floor(width / cols);
      const minRows = isPhoneLandscape ? 10 : 5;
      const rows = Math.max(minRows, Math.floor(height / cellSize));
      return { cellSize, cols, rows };
    } else {
      const isPhonePortrait = isSmallCanvas;
      // 竖屏手机：格子放大 3 倍；平板/电脑稍粗一点
      const base = Math.min(width, height);
      const approxCell = isPhonePortrait ? 27 : 32;
      const minCols = isPhonePortrait ? 8 : 9;
      const cols = Math.max(minCols, Math.floor(base / approxCell));
      const cellSize = Math.floor(base / cols);
      const rows = Math.floor(height / cellSize);
      return { cellSize, cols, rows };
    }
  };

  const randomFood = (snake: Cell[], cols: number, rows: number): Cell => {
    while (true) {
      const cell = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
      if (!snake.some((s) => s.x === cell.x && s.y === cell.y)) {
        return cell;
      }
    }
  };

  const resetGame = useCallback(() => {
    const { cols, rows } = getGridSize();
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    const snake: Cell[] = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    stateRef.current = {
      snake,
      direction: 'RIGHT',
      pendingDirection: 'RIGHT',
      food: randomFood(snake, cols, rows),
      lastUpdate: performance.now(),
      gameOver: false,
    };
  }, [width, height]);

  useEffect(() => {
    if (isPlaying && !stateRef.current) {
      resetGame();
    }
  }, [isPlaying, resetGame]);

  const stepSnake = (now: number) => {
    const state = stateRef.current;
    if (!state || state.gameOver) return;

    // 速度节奏：一开始慢，吃到越多越快（但有下限，避免过快）
    const baseInterval = 260; // 初始约 4 步/秒
    const minInterval = 90;   // 最快约 11 步/秒
    const extraSegments = Math.max(0, state.snake.length - 3);
    const stepInterval = Math.max(minInterval, baseInterval - extraSegments * 12);
    if (now - state.lastUpdate < stepInterval) return;
    state.lastUpdate = now;

    const { cellSize, cols, rows } = getGridSize();
    const dir = state.pendingDirection;
    state.direction = dir;

    const head = state.snake[0];
    let newHead: Cell = { ...head };
    if (dir === 'UP') newHead.y -= 1;
    else if (dir === 'DOWN') newHead.y += 1;
    else if (dir === 'LEFT') newHead.x -= 1;
    else if (dir === 'RIGHT') newHead.x += 1;

    // 撞墙
    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      state.gameOver = true;
      if (onGameOver) onGameOver();
      return;
    }

    // 撞到自己
    if (state.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      state.gameOver = true;
      if (onGameOver) onGameOver();
      return;
    }

    state.snake.unshift(newHead);

    // 吃到食物
    if (newHead.x === state.food.x && newHead.y === state.food.y) {
      if (onScore) onScore(10);
      state.food = randomFood(state.snake, cols, rows);
    } else {
      state.snake.pop();
    }
  };

  const animate = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!stateRef.current || !isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      stepSnake(now);

      const { cellSize, cols, rows } = getGridSize();
      const state = stateRef.current;

      // 背景紫色棋盘（接近参考图的粉紫色）
      ctx.fillStyle = '#e15ad9';
      ctx.fillRect(0, 0, width, height);

      // 取消两侧的蓝色边界，统一使用背景紫色
      ctx.fillStyle = '#e15ad9';
      ctx.fillRect(0, 0, Math.max(6, cellSize * 0.25), height);
      ctx.fillRect(width - Math.max(6, cellSize * 0.25), 0, Math.max(6, cellSize * 0.25), height);

      // 方格线条偏深一些
      ctx.strokeStyle = '#40104f';
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        const px = x * cellSize;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, rows * cellSize);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        const py = y * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(cols * cellSize, py);
        ctx.stroke();
      }

      // 食物（蓝色圆点）- 尽量贴近参考图颜色
      const food = state.food;
      ctx.fillStyle = '#3c6fff';
      ctx.beginPath();
      ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        (cellSize * 0.4),
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 蛇身（红色圆点）- 头部和身体用偏亮的红色
      state.snake.forEach((seg, index) => {
        const cx = seg.x * cellSize + cellSize / 2;
        const cy = seg.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.45;
        const isHead = index === 0;

        ctx.beginPath();
        ctx.fillStyle = isHead ? '#ff3030' : '#ff5050';
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 高光
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Game Over 提示
      if (state.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Game Over', width / 2, height / 2);
      }

      requestRef.current = requestAnimationFrame(animate);
    },
    [width, height, isPlaying]
  );

  // 高 DPI 支持
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
    }
  }, [width, height]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  // 键盘控制（PC）
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state || !isPlaying) return;
      const dir = state.direction;
      if (e.key === 'ArrowUp' && dir !== 'DOWN') state.pendingDirection = 'UP';
      else if (e.key === 'ArrowDown' && dir !== 'UP') state.pendingDirection = 'DOWN';
      else if (e.key === 'ArrowLeft' && dir !== 'RIGHT') state.pendingDirection = 'LEFT';
      else if (e.key === 'ArrowRight' && dir !== 'LEFT') state.pendingDirection = 'RIGHT';
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying]);

  // 触摸/拖动方向（手机端）- 仅在非摇杆区域时生效
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // 如果点击在摇杆区域，不处理
    const target = e.target as HTMLElement;
    if (target.closest('.joystick-container')) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    touchStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // 如果点击在摇杆区域，不处理
    const target = e.target as HTMLElement;
    if (target.closest('.joystick-container')) return;
    
    const state = stateRef.current;
    if (!state || !isPlaying || !touchStartRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    const dir = state.direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && dir !== 'LEFT') state.pendingDirection = 'RIGHT';
      else if (dx < 0 && dir !== 'RIGHT') state.pendingDirection = 'LEFT';
    } else {
      if (dy > 0 && dir !== 'UP') state.pendingDirection = 'DOWN';
      else if (dy < 0 && dir !== 'DOWN') state.pendingDirection = 'UP';
    }
  };

  // 虚拟摇杆处理函数
  const handleJoystickDown = (e: React.PointerEvent) => {
    if (!isPlaying) return;
    e.preventDefault();
    const container = joystickContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    joystickRef.current = {
      isActive: true,
      centerX,
      centerY,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    
    // 更新初始位置
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const maxDrag = joystickRadius - knobRadius - 5;
    
    if (distance > maxDrag) {
      const angle = Math.atan2(dy, dx);
      setJoystickPosition({
        x: Math.cos(angle) * maxDrag,
        y: Math.sin(angle) * maxDrag,
      });
    } else {
      setJoystickPosition({ x: dx, y: dy });
    }
    
    // 处理初始方向
    updateJoystickDirection(e.clientX, e.clientY, centerX, centerY);
  };

  const handleJoystickMove = (e: React.PointerEvent) => {
    if (!joystickRef.current?.isActive) return;
    e.preventDefault();
    
    const { centerX, centerY } = joystickRef.current;
    joystickRef.current.currentX = e.clientX;
    joystickRef.current.currentY = e.clientY;
    
    // 更新摇杆视觉位置
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const maxDrag = joystickRadius - knobRadius - 5;
    
    if (distance > maxDrag) {
      const angle = Math.atan2(dy, dx);
      setJoystickPosition({
        x: Math.cos(angle) * maxDrag,
        y: Math.sin(angle) * maxDrag,
      });
    } else {
      setJoystickPosition({ x: dx, y: dy });
    }
    
    updateJoystickDirection(e.clientX, e.clientY, centerX, centerY);
  };

  const handleJoystickUp = (e: React.PointerEvent) => {
    if (!joystickRef.current?.isActive) return;
    e.preventDefault();
    joystickRef.current = null;
    setJoystickPosition({ x: 0, y: 0 });
  };


  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="block touch-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
      
      {/* 拖拽式转盘方向键 - 仅在触摸设备上显示（放在右侧，方便右手操作） */}
      {isTouchDevice && (
        <div 
          ref={joystickContainerRef}
          className="joystick-container absolute bottom-6 right-6 pointer-events-none z-10"
          style={{ width: joystickSize, height: joystickSize }}
        >
          <div 
            className="relative pointer-events-auto touch-none"
            style={{ width: joystickSize, height: joystickSize }}
            onPointerDown={handleJoystickDown}
            onPointerMove={handleJoystickMove}
            onPointerUp={handleJoystickUp}
            onPointerCancel={handleJoystickUp}
          >
            {/* 外圈背景 */}
            <div 
              className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/50 shadow-lg"
              style={{ width: joystickSize, height: joystickSize }}
            />
            
            {/* 可拖拽的摇杆 */}
            <div
              className="absolute bg-blue-500/90 rounded-full border-2 border-white/70 shadow-lg transition-all duration-100"
              style={{
                width: knobSize,
                height: knobSize,
                left: joystickRadius - knobRadius + joystickPosition.x,
                top: joystickRadius - knobRadius + joystickPosition.y,
                transform: joystickRef.current?.isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};


