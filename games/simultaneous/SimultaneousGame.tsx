
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';

interface Point { x: number; y: number; }

export const SimultaneousGame: React.FC<GameComponentProps> = ({ width, height, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const stateRef = useRef<{birdPos: Point; cagePos: Point; isDragging: boolean}>({
        birdPos: { x: 100, y: 100 }, cagePos: { x: 300, y: 300 }, isDragging: false
    });

    useEffect(() => {
        // Reset positions on resize
        stateRef.current.birdPos = { x: width * 0.2, y: height / 2 };
        stateRef.current.cagePos = { x: width * 0.8, y: height / 2 };
    }, [width, height]);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#222'; ctx.fillRect(0, 0, width, height);
        const { birdPos, cagePos } = stateRef.current;
        
        // Cage (Left/Green Eye usually)
        ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 4;
        ctx.strokeRect(cagePos.x - 50, cagePos.y - 50, 100, 100);
        ctx.beginPath(); ctx.moveTo(cagePos.x - 20, cagePos.y - 50); ctx.lineTo(cagePos.x - 20, cagePos.y + 50);
        ctx.moveTo(cagePos.x + 20, cagePos.y - 50); ctx.lineTo(cagePos.x + 20, cagePos.y + 50); ctx.stroke();
        
        // Bird (Right/Red Eye usually)
        ctx.fillStyle = '#FF0000'; ctx.beginPath(); ctx.arc(birdPos.x, birdPos.y, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#990000'; ctx.beginPath(); ctx.ellipse(birdPos.x - 5, birdPos.y, 10, 6, 0.5, 0, Math.PI * 2); ctx.fill();

        const dist = Math.hypot(birdPos.x - cagePos.x, birdPos.y - cagePos.y);
        if (dist < 10 && !stateRef.current.isDragging) {
            ctx.fillStyle = '#FFFF00'; ctx.font = '20px sans-serif'; ctx.fillText("很好！", cagePos.x - 25, cagePos.y - 60);
        }

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

    const handlePointerMove = (e: React.PointerEvent) => {
        if (stateRef.current.isDragging) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if(rect) stateRef.current.birdPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if(!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const bird = stateRef.current.birdPos;
        if (Math.hypot(bird.x - x, bird.y - y) < 40) stateRef.current.isDragging = true;
    };

    const handlePointerUp = () => { stateRef.current.isDragging = false; };

    return <canvas ref={canvasRef} 
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
        className="block touch-none" />;
};
