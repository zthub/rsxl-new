import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';

interface FusionPoint {
  id: number;
  x: number;
  y: number;
  color: 'red' | 'blue';
  size: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  fused?: boolean; // 是否已融合
  pairId?: number; // 配对ID，用于标识同一对点
}

export const FusionPointGame: React.FC<GameComponentProps> = ({
  width,
  height,
  isPlaying,
  onScore,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  // 待融合的小球（红+蓝）
  const pointsRef = useRef<FusionPoint[]>([]);
  // 已经融合完成、需要一直保留在场上的小球（只画，不再参与逻辑）
  const fusedPointsRef = useRef<FusionPoint[]>([]);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const draggingRef = useRef<FusionPoint | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [combo, setCombo] = useState(0);
  const [fusionSuccess, setFusionSuccess] = useState<{ x: number; y: number } | null>(null);

  // 初始化游戏
  const initGame = useCallback(() => {
    pointsRef.current = [];
    fusedPointsRef.current = [];
    scoreRef.current = 0;
    frameCountRef.current = 0;
    setCombo(0);
  }, []);

  // 生成新的融合点对
  const spawnPair = useCallback(() => {
    const margin = 100;
    const size = 30 + Math.random() * 20;

    // 红点（左眼可见）- 随机位置，确保在屏幕内
    const redX = margin + Math.random() * (width - margin * 2);
    const redY = margin + Math.random() * (height - margin * 2);

    // 蓝点（右眼可见）- 在红点附近，但有一定距离，确保在屏幕内
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 100;
    let blueX = redX + Math.cos(angle) * distance;
    let blueY = redY + Math.sin(angle) * distance;
    
    // 确保蓝点在屏幕内
    const ballRadius = size / 2;
    blueX = Math.max(margin + ballRadius, Math.min(width - margin - ballRadius, blueX));
    blueY = Math.max(margin + ballRadius, Math.min(height - margin - ballRadius, blueY));

    const pairId = Date.now() + Math.random();

    pointsRef.current.push({
      id: pairId,
      x: redX,
      y: redY,
      color: 'red',
      size,
      targetX: redX,
      targetY: redY,
      vx: 0,
      vy: 0,
      fused: false,
      pairId: pairId,
    });

    pointsRef.current.push({
      id: pairId + 1,
      x: blueX,
      y: blueY,
      color: 'blue',
      size,
      targetX: blueX,
      targetY: blueY,
      vx: 0,
      vy: 0,
      fused: false,
      pairId: pairId,
    });
  }, [width, height]);

  // 处理鼠标按下（开始拖动）
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isPlaying) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 检查是否点击了某个点（只能拖动未融合的点）
      for (const point of pointsRef.current) {
        if (point.fused) continue; // 已融合的点不能拖动
        const dist = Math.hypot(x - point.x, y - point.y);
        if (dist < point.size / 2) {
          draggingRef.current = point;
          dragOffsetRef.current = { x: x - point.x, y: y - point.y };
          break;
        }
      }
    },
    [isPlaying]
  );

  // 处理鼠标移动（拖动中）
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isPlaying || !draggingRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 更新被拖动的点的位置
      draggingRef.current.x = x - dragOffsetRef.current.x;
      draggingRef.current.y = y - dragOffsetRef.current.y;
      draggingRef.current.targetX = draggingRef.current.x;
      draggingRef.current.targetY = draggingRef.current.y;
    },
    [isPlaying]
  );

  // 处理鼠标抬起（结束拖动）
  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // 检查并执行融合
  const checkAndFuse = useCallback(() => {
    // 1. 先按 pairId 把“待融合”的点分组
    const pairMap = new Map<number, FusionPoint[]>();
    pointsRef.current.forEach(point => {
      if (point.pairId !== undefined) {
        if (!pairMap.has(point.pairId)) {
          pairMap.set(point.pairId, []);
        }
        pairMap.get(point.pairId)!.push(point);
      }
    });

    const idsToRemove: number[] = [];

    pairMap.forEach(points => {
      if (points.length !== 2) return;

      const redPoint = points.find(p => p.color === 'red');
      const bluePoint = points.find(p => p.color === 'blue');
      if (!redPoint || !bluePoint) return;

      const dist = Math.hypot(bluePoint.x - redPoint.x, bluePoint.y - redPoint.y);
      const fusionThreshold = 5;
      if (dist >= fusionThreshold) return;

      // 融合成功：生成一个“新小球”放到 fusedPointsRef 里
      playSound('correct');
      const newCombo = combo + 1;
      setCombo(newCombo);
      const scorePoints = 10 + newCombo * 2;
      scoreRef.current += scorePoints;
      onScore(scorePoints);

      const centerX = (redPoint.x + bluePoint.x) / 2;
      const centerY = (redPoint.y + bluePoint.y) / 2;
      const fusedSize = Math.max(redPoint.size, bluePoint.size) * 1.2;

      fusedPointsRef.current.push({
        id: Date.now() + Math.random(),
        x: centerX,
        y: centerY,
        color: 'red', // 颜色无所谓，真正的颜色用 fused 字段控制
        size: fusedSize,
        targetX: centerX,
        targetY: centerY,
        vx: 0,
        vy: 0,
        fused: true,
      });

      idsToRemove.push(redPoint.id, bluePoint.id);

      setFusionSuccess({ x: centerX, y: centerY });
      setTimeout(() => {
        setFusionSuccess(null);
      }, 1500);
    });

    if (idsToRemove.length > 0) {
      pointsRef.current = pointsRef.current.filter(p => !idsToRemove.includes(p.id));
    }
  }, [combo, onScore]);

  // 动画循环
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;

    // 清空画布
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(0, 0, width, height);

    // 统计未融合的点对数量（红篮球对，只看待融合数组）
    const unfusedPairs = new Map<number, FusionPoint[]>();
    pointsRef.current.forEach(point => {
      if (!point.fused && point.pairId !== undefined) {
        if (!unfusedPairs.has(point.pairId)) {
          unfusedPairs.set(point.pairId, []);
        }
        unfusedPairs.get(point.pairId)!.push(point);
      }
    });
    const unfusedPairCount = Array.from(unfusedPairs.values()).filter(pair => pair.length === 2).length;

    // 按照一定速率生成新点对（每300帧约5秒，60fps），场上最多2对“待融合”的红篮球
    // 如果场上完全没有待融合的点，立即生成一对
    if (pointsRef.current.length === 0) {
      spawnPair();
    } else if (unfusedPairCount < 2 && frameCountRef.current % 300 === 0) {
      spawnPair();
    }

    // 先绘制所有“已融合”的小球（紫色，静止）
    fusedPointsRef.current.forEach(point => {
      const ctxPoint = point;
      ctx.save();
      ctx.fillStyle = '#A855F7';
      ctx.strokeStyle = '#9333EA';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ctxPoint.x, ctxPoint.y, ctxPoint.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 再绘制“待融合”的小球
    pointsRef.current.forEach(point => {
      // 如果不在拖动中且未融合，让点缓慢向目标位置移动（产生轻微的动画效果）
      if (draggingRef.current !== point) {
        point.x += (point.targetX - point.x) * 0.02;
        point.y += (point.targetY - point.y) * 0.02;
      }

      // 绘制点
      ctx.save();
      if (point.color === 'red') {
        ctx.fillStyle = '#EF4444';
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = '#3B82F6';
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2;
      }
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 绘制连接线（只绘制未融合的点对）
    const pairMap = new Map<number, FusionPoint[]>();
    pointsRef.current.forEach(point => {
      if (!point.fused && point.pairId !== undefined) {
        if (!pairMap.has(point.pairId)) {
          pairMap.set(point.pairId, []);
        }
        pairMap.get(point.pairId)!.push(point);
      }
    });

    pairMap.forEach((points) => {
      if (points.length !== 2) return;
      
      const redPoint = points.find(p => p.color === 'red');
      const bluePoint = points.find(p => p.color === 'blue');
      
      if (!redPoint || !bluePoint) return;

      const pointDist = Math.hypot(bluePoint.x - redPoint.x, bluePoint.y - redPoint.y);

      // 绘制虚线连接（距离越近，颜色越接近紫色）
      const progress = Math.max(0, Math.min(1, (80 - pointDist) / 80));
      const r = Math.floor(168 + (167 - 168) * progress); // 从灰色到紫色
      const g = Math.floor(181 + (85 - 181) * progress);
      const b = Math.floor(205 + (87 - 205) * progress);
      
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(redPoint.x, redPoint.y);
      ctx.lineTo(bluePoint.x, bluePoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 检查融合（每帧检查一次）
    checkAndFuse();

    // 绘制连击信息（只在有连击时显示）
    if (combo > 0) {
      ctx.fillStyle = '#A855F7';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`连击: ${combo}`, 20, 35);
    }

    // 绘制融合成功提示（小对号在球旁边，基于 fusedPointsRef）
    if (fusionSuccess) {
      const fusedPoint = fusedPointsRef.current.find(p =>
        Math.abs(p.x - fusionSuccess.x) < 10 &&
        Math.abs(p.y - fusionSuccess.y) < 10
      );
      
      if (fusedPoint) {
        // 对号显示在球的右上角
        const checkX = fusedPoint.x + fusedPoint.size / 2 + 15;
        const checkY = fusedPoint.y - fusedPoint.size / 2 - 15;
        
        ctx.save();
        ctx.translate(checkX, checkY);
        ctx.strokeStyle = '#10B981';
        ctx.fillStyle = '#10B981';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 绘制圆形背景
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制对号
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-2, 6);
        ctx.lineTo(8, -6);
        ctx.stroke();
        ctx.restore();
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [width, height, spawnPair, combo, checkAndFuse]);

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

  // 游戏控制
  useEffect(() => {
    if (isPlaying) {
      initGame();
      spawnPair();
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
  }, [isPlaying, initGame, spawnPair, animate]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="block w-full h-full cursor-pointer touch-none"
      />
    </div>
  );
};

