
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';

export const VisualStimulation: React.FC<GameComponentProps> = ({ width, height, isPlaying, gameId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    const animate = useCallback(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        const frame = frameCountRef.current;
        const w = width;
        const h = height;
        const centerX = w / 2;
        const centerY = h / 2;
        const minDimension = Math.min(w, h);

        // Dispatch Logic
        if (gameId === 'g1-4') { 
            renderCommonBackground(ctx, w, h, frame, visualAcuity);
            ctx.fillStyle = '#00FF00';
            ctx.beginPath(); ctx.arc(centerX, centerY, minDimension * 0.015, 0, Math.PI * 2); ctx.fill();
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, isPlaying, gameId, visualAcuity]);

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
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    return <canvas ref={canvasRef} className="block touch-none" />;
};