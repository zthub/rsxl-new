import React, { useRef, useEffect, useCallback } from 'react';
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

  // 网格设置：方格稍大，贴近参考图片效果
  const getGridSize = () => {
    const base = Math.min(width, height);
    const approxCell = 40; // 目标每格大小（像素）- 比原来更大
    const cols = Math.max(8, Math.floor(base / approxCell));
    const cellSize = Math.floor(base / cols);
    const rows = Math.floor(height / cellSize);
    return { cellSize, cols, rows };
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

      // 边缘加入一点青色边框，模拟参考图两侧的蓝色条
      ctx.fillStyle = '#12b5ff';
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

  // 触摸/拖动方向（手机端）
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    touchStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
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

  return (
    <canvas
      ref={canvasRef}
      className="block touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  );
};


