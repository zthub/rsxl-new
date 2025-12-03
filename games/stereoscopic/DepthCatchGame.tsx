import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';

interface Ball {
  id: number;
  x: number;
  y: number;
  z: number; // 深度值，0-1，0为最近，1为最远
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
}

const UI_TOP_OFFSET = 90;
const MAX_MISSES = 5;
const LEVEL_STEP_SCORE = 100;

export const DepthCatchGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const ballsRef = useRef<Ball[]>([]);
  const catcherRef = useRef({ x: width / 2, width: 100 });
  const mouseRef = useRef({ x: width / 2 });
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const missedRef = useRef(0);
  const gameOverTriggeredRef = useRef(false);
  const nextLevelScoreRef = useRef(LEVEL_STEP_SCORE);
  const [level, setLevel] = useState(1);

  // 生成新球
  const spawnBall = useCallback(() => {
    const z = Math.random() * 0.8 + 0.1; // 深度在0.1到0.9之间
    const speed = 2 + z * 3; // 深度越大，垂直速度越快（像素/帧）
    const size = 20 + (1 - z) * 30; // 深度越小，球越大

    ballsRef.current.push({
      id: Date.now() + Math.random(),
      x: Math.random() * width,
      y: -size,
      z,
      vx: (Math.random() - 0.5) * 2,
      vy: speed,
      vz: 0.001, // 球逐渐接近
      size,
      color: z < 0.3 ? '#10B981' : z < 0.6 ? '#F59E0B' : '#EF4444', // 根据深度改变颜色
    });
  }, [width]);

  // 3D投影：将3D坐标投影到2D屏幕
  const project3D = useCallback((x: number, y: number, z: number) => {
    // 视差效果：根据深度调整X坐标
    const parallax = (z - 0.5) * 20; // 深度差异造成的视差
    const scale = 1 - z * 0.5; // 深度越大，缩放越小
    const screenX = x + parallax;
    const screenY = y;
    const screenSize = 20 * scale;

    return { x: screenX, y: screenY, size: screenSize };
  }, []);

  const handleProgress = useCallback(() => {
    while (scoreRef.current >= nextLevelScoreRef.current) {
      nextLevelScoreRef.current += LEVEL_STEP_SCORE;
      setLevel((prev) => prev + 1);
      playSound('correct');
    }
  }, []);

  // 检查接球
  const checkCatch = useCallback((ball: Ball) => {
    const projected = project3D(ball.x, ball.y, ball.z);
    const catcherLeft = catcherRef.current.x - catcherRef.current.width / 2;
    const catcherRight = catcherRef.current.x + catcherRef.current.width / 2;

    if (
      projected.y > height - 50 &&
      projected.y < height - 20 &&
      projected.x > catcherLeft &&
      projected.x < catcherRight
    ) {
      // 接球成功
      playSound('correct');
      const points = Math.floor((1 - ball.z) * 20) + 10; // 深度越小，分数越高
      scoreRef.current += points;
      onScore(points);
      handleProgress();
      return true;
    }
    return false;
  }, [height, project3D, onScore, handleProgress]);

  // 动画循环
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;

    // 清空画布
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // 绘制背景网格（增强深度感）
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const depth = i / 20;
      const scale = 1 - depth * 0.5;
      const gridSize = 50 * scale;
      const offsetX = (width / 2) * (1 - scale);
      const offsetY = (height / 2) * (1 - scale);

      ctx.beginPath();
      for (let x = offsetX; x < width - offsetX; x += gridSize) {
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, height - offsetY);
      }
      for (let y = offsetY; y < height - offsetY; y += gridSize) {
        ctx.moveTo(offsetX, y);
        ctx.lineTo(width - offsetX, y);
      }
      ctx.stroke();
    }

    // 更新接球器位置
    catcherRef.current.x += (mouseRef.current.x - catcherRef.current.x) * 0.15;

    // 生成新球
    const spawnRate = Math.max(60 - level * 5, 30); // 关卡越高，生成越快
    if (frameCountRef.current % spawnRate === 0) {
      spawnBall();
    }

    // 更新和绘制球
    ballsRef.current = ballsRef.current.filter((ball) => {
      // 更新位置
      ball.x += ball.vx;
      ball.y += ball.vy; // 速度已在生成时根据深度设定
      ball.z -= ball.vz; // 球逐渐接近

      // 边界反弹
      if (ball.x < 0 || ball.x > width) {
        ball.vx *= -1;
      }

      // 检查是否接住
      if (checkCatch(ball)) {
        // 立即补充一个新球，避免画面“被清空”
        spawnBall();
        return false; // 移除球
      }

      // 检查是否错过：只统计“错过次数”，不再触发整局结束刷新
      if (ball.y > height + ball.size) {
        missedRef.current++;
        if (missedRef.current >= MAX_MISSES && !gameOverTriggeredRef.current) {
          gameOverTriggeredRef.current = true;
          onGameOver();
        }
        return false; // 移除这颗球，游戏继续（直到达到上限）
      }

      // 绘制球（带深度效果）
      const projected = project3D(ball.x, ball.y, ball.z);

      // 根据深度调整透明度和模糊
      const alpha = 0.6 + ball.z * 0.4;
      const blur = ball.z * 3;

      ctx.save();
      ctx.globalAlpha = alpha;

      // 绘制阴影（增强深度感）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(
        projected.x,
        height - 10,
        projected.size * 0.8,
        projected.size * 0.3,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 绘制球体
      const gradient = ctx.createRadialGradient(
        projected.x - projected.size * 0.3,
        projected.y - projected.size * 0.3,
        0,
        projected.x,
        projected.y,
        projected.size
      );
      gradient.addColorStop(0, ball.color);
      // 创建半透明版本的颜色
      const colorWithAlpha = ball.color.includes('rgba') 
        ? ball.color.replace(/[\d\.]+\)$/g, '0.5)')
        : ball.color.replace('rgb', 'rgba').replace(')', ', 0.5)');
      gradient.addColorStop(1, colorWithAlpha);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, projected.size, 0, Math.PI * 2);
      ctx.fill();

      // 高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(
        projected.x - projected.size * 0.3,
        projected.y - projected.size * 0.3,
        projected.size * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();

      return true;
    });

    // 绘制接球器
    const catcherY = height - 30;
    const gradient = ctx.createLinearGradient(
      catcherRef.current.x - catcherRef.current.width / 2,
      catcherY,
      catcherRef.current.x + catcherRef.current.width / 2,
      catcherY
    );
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(0.5, '#8B5CF6');
    gradient.addColorStop(1, '#3B82F6');
    ctx.fillStyle = gradient;
    ctx.fillRect(
      catcherRef.current.x - catcherRef.current.width / 2,
      catcherY,
      catcherRef.current.width,
      20
    );
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      catcherRef.current.x - catcherRef.current.width / 2,
      catcherY,
      catcherRef.current.width,
      20
    );

    // 顶部渐变遮罩，提升标题栏可读性
    ctx.save();
    const topGradient = ctx.createLinearGradient(0, 0, 0, UI_TOP_OFFSET + 30);
    topGradient.addColorStop(0, 'rgba(2, 6, 23, 0.95)');
    topGradient.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, UI_TOP_OFFSET + 30);
    ctx.restore();

    // 左上角：关卡 & 错过（分数在外部标题栏显示）
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`关卡: ${level}`, 20, UI_TOP_OFFSET);
    ctx.fillText(`错过: ${missedRef.current}/${MAX_MISSES}`, 20, UI_TOP_OFFSET + 26);

    // 右上角：深度指示器
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('深度指示', width - 20, UI_TOP_OFFSET);
    for (let i = 0; i < 5; i++) {
      const depth = i / 4;
      const y = UI_TOP_OFFSET + 20 + i * 16;
      const color = depth < 0.3 ? '#10B981' : depth < 0.6 ? '#F59E0B' : '#EF4444';
      ctx.fillStyle = color;
      ctx.fillRect(width - 60, y, 30, 10);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [width, height, spawnBall, checkCatch, project3D, level, onScore, onGameOver]);

  // 处理鼠标移动
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current.x = e.clientX - rect.left;
    }
  }, []);

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
    }
  }, [width, height]);

  // 初始化
  useEffect(() => {
    catcherRef.current = { x: width / 2, width: 100 };
    mouseRef.current.x = width / 2;
  }, [width]);

  // 游戏控制
  useEffect(() => {
    if (isPlaying) {
      ballsRef.current = [];
      scoreRef.current = 0;
      missedRef.current = 0;
      gameOverTriggeredRef.current = false;
      nextLevelScoreRef.current = LEVEL_STEP_SCORE;
      frameCountRef.current = 0;
      setLevel(1);
      catcherRef.current = { x: width / 2, width: 100 };
      requestRef.current = requestAnimationFrame(animate);
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
  }, [isPlaying, width, animate]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        className="block w-full h-full cursor-crosshair"
      />
    </div>
  );
};

