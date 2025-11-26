
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';

export const FusionGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const fusionRef = useRef({ x: 0, y: 0, angle: 0, speed: 0.02 });
    const mouseRef = useRef({ x: 0, y: 0 });
    const frameCountRef = useRef(0);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        ctx.fillStyle = '#F0F0F0'; ctx.fillRect(0, 0, width, height);
        
        const f = fusionRef.current;
        f.angle += f.speed; 
        f.x = (width / 2) + Math.cos(f.angle) * (width / 3); 
        f.y = (height / 2) + Math.sin(f.angle * 2) * (height / 4);
        
        ctx.beginPath(); ctx.arc(f.x - 20, f.y, 40, 0, Math.PI * 2); 
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; ctx.lineWidth = 4; ctx.stroke();
        
        ctx.beginPath(); ctx.arc(f.x + 20, f.y, 40, 0, Math.PI * 2); 
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)'; ctx.lineWidth = 4; ctx.stroke();
        
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI * 2); ctx.fill();
        
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; 
        ctx.strokeRect(mouseRef.current.x - 15, mouseRef.current.y - 15, 30, 30);

        const dist = Math.hypot(mouseRef.current.x - f.x, mouseRef.current.y - f.y);
        if (dist < 50 && frameCountRef.current % 10 === 0) {
            onScore(1);
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, onScore]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    const handlePointerMove = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if(rect) mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    return <canvas ref={canvasRef} width={width} height={height} onPointerMove={handlePointerMove} className="block touch-none" />;
};
