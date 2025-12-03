
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';

// Normalized Points (0 to 1) for various shapes
const SHAPES = [
    { name: "三角形", points: [{x:0.5, y:0.1}, {x:0.9, y:0.9}, {x:0.1, y:0.9}], color: '#ef4444' },
    { name: "正方形", points: [{x:0.1, y:0.1}, {x:0.9, y:0.1}, {x:0.9, y:0.9}, {x:0.1, y:0.9}], color: '#3b82f6' },
    { name: "五角星", points: [{x:0.5,y:0.05}, {x:0.62,y:0.35}, {x:0.95,y:0.35}, {x:0.68,y:0.55}, {x:0.79,y:0.9}, {x:0.5,y:0.7}, {x:0.21,y:0.9}, {x:0.32,y:0.55}, {x:0.05,y:0.35}, {x:0.38,y:0.35}], color: '#eab308' },
    { name: "爱心", points: [{x:0.5,y:0.3}, {x:0.7,y:0.1}, {x:0.9,y:0.3}, {x:0.5,y:0.9}, {x:0.1,y:0.3}, {x:0.3,y:0.1}], color: '#ec4899' },
    { name: "钻石", points: [{x:0.5,y:0.1}, {x:0.9,y:0.4}, {x:0.5,y:0.9}, {x:0.1,y:0.4}], color: '#06b6d4' },
    { name: "闪电", points: [{x:0.6,y:0.1}, {x:0.3,y:0.5}, {x:0.6,y:0.5}, {x:0.4,y:0.9}, {x:0.7,y:0.5}, {x:0.4,y:0.5}], color: '#facc15' },
    { name: "小鱼", points: [{x:0.8,y:0.5}, {x:0.2,y:0.2}, {x:0.2,y:0.8}], color: '#f97316' },
    { name: "房子", points: [{x:0.5,y:0.1}, {x:0.9,y:0.4}, {x:0.9,y:0.9}, {x:0.1,y:0.9}, {x:0.1,y:0.4}], color: '#8b5cf6' },
    { name: "船", points: [{x:0.2,y:0.6}, {x:0.8,y:0.6}, {x:0.7,y:0.9}, {x:0.3,y:0.9}, {x:0.5,y:0.1}, {x:0.5,y:0.6}], color: '#10b981' },
    { name: "树", points: [{x:0.5,y:0.1}, {x:0.8,y:0.5}, {x:0.6,y:0.5}, {x:0.6,y:0.9}, {x:0.4,y:0.9}, {x:0.4,y:0.5}, {x:0.2,y:0.5}], color: '#166534' },
    { name: "月亮", points: [{x:0.5,y:0.1}, {x:0.7,y:0.3}, {x:0.6,y:0.5}, {x:0.7,y:0.7}, {x:0.5,y:0.9}, {x:0.3,y:0.5}], color: '#fef08a' },
    { name: "蝴蝶", points: [{x:0.5,y:0.2}, {x:0.9,y:0.1}, {x:0.9,y:0.4}, {x:0.5,y:0.5}, {x:0.9,y:0.6}, {x:0.9,y:0.9}, {x:0.5,y:0.8}, {x:0.1,y:0.9}, {x:0.1,y:0.6}, {x:0.5,y:0.5}, {x:0.1,y:0.4}, {x:0.1,y:0.1}], color: '#a855f7' },
    { name: "皇冠", points: [{x:0.1,y:0.3}, {x:0.3,y:0.6}, {x:0.5,y:0.2}, {x:0.7,y:0.6}, {x:0.9,y:0.3}, {x:0.9,y:0.9}, {x:0.1,y:0.9}], color: '#fbbf24' },
    { name: "信封", points: [{x:0.1,y:0.2}, {x:0.9,y:0.2}, {x:0.9,y:0.8}, {x:0.1,y:0.8}, {x:0.5,y:0.5}], color: '#60a5fa' },
    { name: "T恤", points: [{x:0.3,y:0.1}, {x:0.7,y:0.1}, {x:0.9,y:0.3}, {x:0.8,y:0.4}, {x:0.7,y:0.3}, {x:0.7,y:0.9}, {x:0.3,y:0.9}, {x:0.3,y:0.3}, {x:0.2,y:0.4}, {x:0.1,y:0.3}], color: '#f472b6' },
    { name: "猫耳", points: [{x:0.2,y:0.4}, {x:0.2,y:0.2}, {x:0.4,y:0.3}, {x:0.6,y:0.3}, {x:0.8,y:0.2}, {x:0.8,y:0.4}, {x:0.7,y:0.8}, {x:0.3,y:0.8}], color: '#374151' },
    { name: "火箭", points: [{x:0.5,y:0.1}, {x:0.7,y:0.3}, {x:0.7,y:0.7}, {x:0.9,y:0.9}, {x:0.5,y:0.8}, {x:0.1,y:0.9}, {x:0.3,y:0.7}, {x:0.3,y:0.3}], color: '#dc2626' },
    { name: "骨头", points: [{x:0.2,y:0.3}, {x:0.3,y:0.4}, {x:0.7,y:0.4}, {x:0.8,y:0.3}, {x:0.9,y:0.4}, {x:0.8,y:0.5}, {x:0.9,y:0.6}, {x:0.8,y:0.7}, {x:0.7,y:0.6}, {x:0.3,y:0.6}, {x:0.2,y:0.7}, {x:0.1,y:0.6}, {x:0.2,y:0.5}, {x:0.1,y:0.4}], color: '#e5e7eb' },
    { name: "蘑菇", points: [{x:0.2,y:0.5}, {x:0.5,y:0.1}, {x:0.8,y:0.5}, {x:0.6,y:0.5}, {x:0.6,y:0.9}, {x:0.4,y:0.9}, {x:0.4,y:0.5}], color: '#be123c' },
    { name: "盾牌", points: [{x:0.1,y:0.1}, {x:0.9,y:0.1}, {x:0.9,y:0.6}, {x:0.5,y:0.9}, {x:0.1,y:0.6}], color: '#4b5563' }
];

export const TraceContourGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    
    const [levelIdx, setLevelIdx] = useState(0);
    const [nextDotIndex, setNextDotIndex] = useState(0);
    const [completed, setCompleted] = useState(false);
    
    // Prevent multiple trigger
    const processingCompletion = useRef(false);
    const mousePos = useRef<{x:number, y:number} | null>(null);

    // Use a ref to store the latest onScore function to avoid dependency issues in useEffect
    const latestOnScore = useRef(onScore);
    useEffect(() => { latestOnScore.current = onScore; }, [onScore]);

    // Current Shape
    const currentShape = SHAPES[levelIdx];

    // Helper to get Game Layout Metrics
    const getLayout = useCallback(() => {
        const splitX = width * 0.35;
        const gameSize = Math.min((width - splitX) * 0.8, height * 0.7);
        const gameOffsetX = splitX + ((width - splitX) - gameSize) / 2;
        const gameOffsetY = (height - gameSize) / 2;
        return { splitX, gameSize, gameOffsetX, gameOffsetY };
    }, [width, height]);

    // Interaction Handler
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!canvasRef.current || completed || processingCompletion.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        mousePos.current = { x, y };

        // --- Collision Logic ---
        const { gameSize, gameOffsetX, gameOffsetY } = getLayout();
        const points = currentShape.points.map(p => ({ 
            x: p.x * gameSize + gameOffsetX, 
            y: p.y * gameSize + gameOffsetY 
        }));

        let targetIdx = nextDotIndex + 1;
        let isClosing = false;
        if (targetIdx >= points.length) {
            targetIdx = 0; // Close the loop
            isClosing = true;
        }

        const targetPt = points[targetIdx];
        const dist = Math.hypot(x - targetPt.x, y - targetPt.y);
        
        // STRICT PRECISION REQUIREMENT: 15px radius
        // Must be very close to the center of the dot to register
        if (dist < 15) {
            playSound('correct');
            if (isClosing) {
                setCompleted(true);
            } else {
                setNextDotIndex(targetIdx);
            }
        }
    };

    const handlePointerUp = () => {
        // mousePos.current = null; // Optional: keep showing cursor for visual continuity
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        handlePointerMove(e);
    };

    // Next Level Logic
    useEffect(() => {
        if (completed && !processingCompletion.current) {
            processingCompletion.current = true;
            
            latestOnScore.current(100);
            
            const timer = setTimeout(() => {
                setLevelIdx((prev) => (prev + 1) % SHAPES.length);
                setNextDotIndex(0);
                setCompleted(false);
                processingCompletion.current = false;
                mousePos.current = null;
            }, 1500);
            
            return () => clearTimeout(timer);
        }
    }, [completed]);

    // Animation Loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        const frame = frameCountRef.current;
        const { splitX, gameSize, gameOffsetX, gameOffsetY } = getLayout();

        // Clear
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Divider
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(splitX, 0); ctx.lineTo(splitX, height); ctx.stroke();

        // Labels
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('参考图', splitX / 2, 40);
        ctx.fillText(`连连看: ${currentShape.name}`, splitX + (width - splitX) / 2, 40);

        // --- Left: Reference ---
        const refSize = Math.min(splitX * 0.8, height * 0.6);
        const refOffsetX = (splitX - refSize) / 2;
        const refOffsetY = (height - refSize) / 2;

        ctx.save();
        ctx.translate(refOffsetX, refOffsetY);
        ctx.beginPath();
        if (currentShape.points.length > 0) {
            ctx.moveTo(currentShape.points[0].x * refSize, currentShape.points[0].y * refSize);
            for(let i=1; i<currentShape.points.length; i++) {
                ctx.lineTo(currentShape.points[i].x * refSize, currentShape.points[i].y * refSize);
            }
            ctx.closePath();
            ctx.fillStyle = currentShape.color;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();

        // --- Right: Game Area ---
        ctx.save();
        ctx.translate(gameOffsetX, gameOffsetY);

        const points = currentShape.points.map(p => ({ x: p.x * gameSize, y: p.y * gameSize }));

        // Draw Connected Lines
        ctx.lineWidth = 6; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = completed ? currentShape.color : '#3b82f6';
        
        ctx.beginPath();
        if (points.length > 0) {
            ctx.moveTo(points[0].x, points[0].y);
            let maxDrawIndex = nextDotIndex;
            if (completed) maxDrawIndex = points.length; 

            for(let i=1; i < points.length; i++) {
                if (i <= maxDrawIndex) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
            }
            if (completed) ctx.closePath(); 
            ctx.stroke();
        }

        if (completed) {
            ctx.fillStyle = currentShape.color; 
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Draw Elastic Line
        if (mousePos.current && !completed && points.length > 0) {
            const localMx = mousePos.current.x - gameOffsetX;
            const localMy = mousePos.current.y - gameOffsetY;
            
            const startPt = points[nextDotIndex];
            ctx.beginPath();
            ctx.moveTo(startPt.x, startPt.y);
            ctx.lineTo(localMx, localMy);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 10]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw Dots
        points.forEach((p, i) => {
            let radius = 8; // Base radius small
            let color = '#cbd5e1'; 
            
            let targetIdx = nextDotIndex + 1;
            if (targetIdx >= points.length) targetIdx = 0; 

            const isConnected = i <= nextDotIndex;
            const isTarget = !completed && (i === targetIdx);

            if (completed || (isConnected && !(isTarget && targetIdx === 0))) {
                color = currentShape.color;
            }
            
            // Highlight Target
            if (isTarget) {
                color = '#f59e0b'; 
                // Pulse
                const pulse = Math.abs(Math.sin(frame * 0.15)) * 8;
                
                // Range Indicator (The "Hit Box" visual)
                ctx.beginPath();
                ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); // 15px radius visual
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Outer Glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius + 5 + pulse, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius + 3, 0, Math.PI * 2);
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                radius = 10;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i+1}`, p.x, p.y);
        });

        // Draw Custom Cursor Sight (Crosshair)
        if (mousePos.current && !completed) {
            const localMx = mousePos.current.x - gameOffsetX;
            const localMy = mousePos.current.y - gameOffsetY;
            
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Circle
            ctx.arc(localMx, localMy, 15, 0, Math.PI*2); // Match hit radius
            ctx.stroke();
            // Cross
            ctx.beginPath(); ctx.moveTo(localMx - 20, localMy); ctx.lineTo(localMx + 20, localMy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(localMx, localMy - 20); ctx.lineTo(localMx, localMy + 20); ctx.stroke();
        }

        ctx.restore();

        if (completed) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(0, height/2 - 50, width, 100);
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("完成!", width/2, height/2);
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, currentShape, completed, nextDotIndex, getLayout]);

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

    return (
        <canvas 
            ref={canvasRef} 
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="block touch-none cursor-none" // Hide default cursor to use custom sight
        />
    );
};
