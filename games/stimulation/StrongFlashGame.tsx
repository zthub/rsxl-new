import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { getFrequencies } from '../../utils/visualRendering';

// 视觉刺激 - 强闪背景：根据视力档位和自定义速率，在 5 种纯色之间快速闪烁
export const StrongFlashGame: React.FC<GameComponentProps> = ({ width, height, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameRef = useRef(0);

  const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

  // 自定义速率倍率：0.5x ~ 15x，默认 1x，从本地存储读取上次保存的值
  const [speedMultiplier, setSpeedMultiplier] = useState(() => {
    const saved = localStorage.getItem('strongFlashSpeedMultiplier');
    if (saved) {
      const value = parseFloat(saved);
      // 验证值是否在有效范围内
      if (!isNaN(value) && value >= 0.5 && value <= 15) {
        return value;
      }
    }
    return 1;
  });

  const colors = ['#ff0000', '#ffd600', '#007bff', '#000000', '#ffffff']; // 红 黄 蓝 黑 白

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameRef.current += 1;
    const frame = frameRef.current;

    const { freq } = getFrequencies(visualAcuity);

    // 基础频率根据视力档位，乘以自定义倍率；限制在合理范围内
    const targetHz = Math.min(60, Math.max(0.5, freq * speedMultiplier));
    const fps = 60;
    const framesPerFlash = Math.max(1, Math.round(fps / targetHz));

    const step = Math.floor(frame / framesPerFlash);
    const colorIndex = step % colors.length;
    const color = colors[colorIndex];

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    requestRef.current = requestAnimationFrame(animate);
  }, [width, height, visualAcuity, speedMultiplier]);

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

  // 动画循环
  useEffect(() => {
    if (isPlaying) {
      frameRef.current = 0;
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  // 速率显示文本
  const getSpeedLabel = () => {
    if (speedMultiplier < 0.75) return '偏慢';
    if (speedMultiplier < 1.25) return '适中';
    if (speedMultiplier < 3) return '偏快';
    if (speedMultiplier < 6) return '很快';
    if (speedMultiplier < 10) return '超快';
    return '极限';
  };

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block touch-none w-full h-full" />

      {/* 顶部说明文字 */}
      <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
        <div className="px-4 py-1.5 rounded-full bg-black/50 text-white text-xs md:text-sm font-medium backdrop-blur-sm">
          强闪视觉刺激：背景在 5 色之间快速闪烁，请佩戴正确滤光片并注视屏幕中央
        </div>
      </div>

      {/* 底部速率调节 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-black/55 text-white rounded-xl px-4 py-3 shadow-lg backdrop-blur-md max-w-md w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-semibold">闪烁速率</span>
            <span className="text-[10px] md:text-xs text-purple-200">
              当前：{getSpeedLabel()}（约随视力档位自动调整，可微调）
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={15}
            step={0.1}
            value={speedMultiplier}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              setSpeedMultiplier(newValue);
              // 保存到本地存储
              localStorage.setItem('strongFlashSpeedMultiplier', newValue.toString());
            }}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
          <div className="flex justify-between text-[10px] md:text-xs text-slate-200 mt-1">
            <span>0.5x</span>
            <span>{speedMultiplier.toFixed(1)}x</span>
            <span>15.0x</span>
          </div>
        </div>
      </div>
    </div>
  );
};


