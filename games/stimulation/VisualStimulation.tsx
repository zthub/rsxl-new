
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

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    return <canvas ref={canvasRef} width={width} height={height} className="block touch-none" />;
};