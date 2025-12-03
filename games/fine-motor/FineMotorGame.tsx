
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';

interface Target {
    id: number; x: number; y: number; radius: number; 
    maxLife: number; life: number; color: string;
}

export const FineMotorGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const targetsRef = useRef<Target[]>([]);
    const frameCountRef = useRef(0);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        
        ctx.fillStyle = '#F0F9FF'; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#E0F2FE'; ctx.lineWidth = 2; 
        const gridSize = 50;
        for(let x=0; x<width; x+=gridSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
        for(let y=0; y<height; y+=gridSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }

        if (frameCountRef.current % 40 === 0 && targetsRef.current.length < 5) {
            targetsRef.current.push({
                id: Date.now() + Math.random(),
                x: Math.random() * (width - 60) + 30, 
                y: Math.random() * (height - 60) + 30,
                radius: 0, maxLife: 150, life: 150,
                color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 4)]
            });
        }

        targetsRef.current.forEach((t, index) => {
            if (t.radius < 30) t.radius += 2;
            t.life--;
            ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
            ctx.fillStyle = t.color; ctx.fill();
            ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke();
            ctx.beginPath(); ctx.arc(t.x, t.y, t.radius + 5, 0, (Math.PI * 2) * (t.life / t.maxLife));
            ctx.strokeStyle = t.color; ctx.lineWidth = 2; ctx.stroke();
            if (t.life <= 0) targetsRef.current.splice(index, 1);
        });

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height]);

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
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    const onPointerDown = (e: React.PointerEvent) => {
        if (!isPlaying) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const hitIndex = targetsRef.current.findIndex(t => Math.hypot(t.x - x, t.y - y) < t.radius + 10);
        if (hitIndex !== -1) {
            targetsRef.current.splice(hitIndex, 1);
            onScore(10);
        }
    };

    return <canvas ref={canvasRef} onPointerDown={onPointerDown} className="block touch-none" />;
};
