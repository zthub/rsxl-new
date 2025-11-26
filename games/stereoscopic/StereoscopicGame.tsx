
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';

interface StereoObject { x: number; y: number; z: number; type: 'good' | 'bad'; id: number; }

export const StereoscopicGame: React.FC<GameComponentProps> = ({ width, height, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const stereoRef = useRef<StereoObject[]>([]);
    const frameCountRef = useRef(0);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        const cx = width / 2; const cy = height / 2;
        
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        for(let i=1; i<=10; i++) { 
            const scale = i / 10; const sw = width * scale; const sh = height * scale; 
            ctx.strokeRect(cx - sw/2, cy - sh/2, sw, sh); 
        }

        if (frameCountRef.current % 60 === 0) {
            stereoRef.current.push({
                id: Date.now(), x: (Math.random() - 0.5) * width * 0.2, y: (Math.random() - 0.5) * height * 0.2,
                z: 0.1, type: Math.random() > 0.3 ? 'good' : 'bad'
            });
        }

        stereoRef.current.forEach((obj, idx) => {
            obj.z += 0.01; const scale = obj.z * 5;
            const screenX = cx + (obj.x * (1/obj.z) * 5); const screenY = cy + (obj.y * (1/obj.z) * 5);
            const size = 20 * scale;
            if (obj.z >= 1.2) { stereoRef.current.splice(idx, 1); return; }
            ctx.save(); ctx.translate(screenX, screenY);
            if (obj.type === 'good') {
                ctx.fillStyle = '#4ADE80'; ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(5*scale, 5*scale, size, 0, Math.PI * 2); ctx.fill();
            } else { ctx.fillStyle = '#F87171'; ctx.fillRect(-size, -size, size*2, size*2); }
            ctx.restore();
        });

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    return <canvas ref={canvasRef} width={width} height={height} className="block touch-none" />;
};
