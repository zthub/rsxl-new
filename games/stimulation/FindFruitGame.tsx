
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound, FRUIT_TYPES } from '../../utils/gameUtils';

interface ScatteredFruit {
    id: number; x: number; y: number; level: number; radius: number; rotation: number;
}

export const FindFruitGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    const scatteredFruitsRef = useRef<ScatteredFruit[]>([]);
    const targetFruitsRef = useRef<number[]>([]);
    const foundTargetsRef = useRef<boolean[]>([]);

    const initLevel = useCallback(() => {
        const minDimension = Math.min(width, height);
        const fixedRadius = minDimension * 0.055; 

        const allIndices = Array.from({ length: FRUIT_TYPES.length }, (_, i) => i);
        const targets: number[] = [];
        const tempPool = [...allIndices];
        
        for(let i=0; i<4; i++) {
            const randIdx = Math.floor(Math.random() * tempPool.length);
            targets.push(tempPool[randIdx]);
            tempPool.splice(randIdx, 1);
        }
        
        targetFruitsRef.current = targets;
        foundTargetsRef.current = [false, false, false, false];

        const distractorPool: number[] = [...targets];
        targets.forEach(tIdx => {
            const typeDef = FRUIT_TYPES[tIdx];
            if (typeDef.pairId !== undefined) distractorPool.push(typeDef.pairId);
        });

        const desiredTotalCount = 18 + Math.floor(Math.random() * 5);
        while(distractorPool.length < desiredTotalCount) {
            const randomType = Math.floor(Math.random() * FRUIT_TYPES.length);
            if (!distractorPool.includes(randomType)) distractorPool.push(randomType);
        }

        const uniqueTypesToScatter = Array.from(new Set(distractorPool));
        scatteredFruitsRef.current = [];
        const bottomBarHeight = 120;

        for(const level of uniqueTypesToScatter) {
            let validPos = false; let attempts = 0;
            let x = 0, y = 0;
            while(!validPos && attempts < 100) {
                x = Math.random() * (width - 2 * fixedRadius) + fixedRadius;
                y = Math.random() * (height - bottomBarHeight - 50 - 2 * fixedRadius) + 50 + fixedRadius;
                validPos = true;
                for(const existing of scatteredFruitsRef.current) {
                    if (Math.hypot(x - existing.x, y - existing.y) < fixedRadius * 2 + 5) {
                        validPos = false; break;
                    }
                }
                attempts++;
            }
            if(validPos) {
                scatteredFruitsRef.current.push({
                    id: Date.now() + Math.random(), x: x, y: y, level, radius: fixedRadius, 
                    rotation: Math.random() * Math.PI * 2,
                });
            }
        }
    }, [width, height]);

    useEffect(() => {
        if (isPlaying) initLevel();
    }, [isPlaying, initLevel]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isPlaying) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let clickedFruitIndex = -1;
        for(let i = scatteredFruitsRef.current.length - 1; i >= 0; i--) {
            const f = scatteredFruitsRef.current[i];
            if(Math.hypot(f.x - x, f.y - y) < f.radius + 10) {
                clickedFruitIndex = i; break;
            }
        }

        if (clickedFruitIndex !== -1) {
            const clickedFruit = scatteredFruitsRef.current[clickedFruitIndex];
            const targetIdx = targetFruitsRef.current.indexOf(clickedFruit.level);

            if (targetIdx !== -1) {
                if (!foundTargetsRef.current[targetIdx]) {
                    foundTargetsRef.current[targetIdx] = true;
                    scatteredFruitsRef.current.splice(clickedFruitIndex, 1);
                    playSound('correct');
                    onScore(100);
                    if (foundTargetsRef.current.every(Boolean)) setTimeout(initLevel, 500);
                } else {
                    scatteredFruitsRef.current.splice(clickedFruitIndex, 1);
                    playSound('correct');
                }
            } else {
                playSound('wrong');
                onScore(-10);
            }
        }
    };

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        const drawSpecificFruit = (x: number, y: number, radius: number, levelIdx: number, rotation: number) => {
            const info = FRUIT_TYPES[levelIdx];
            ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
            ctx.beginPath(); ctx.arc(0, 0, radius + 3, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fillStyle = info.color; ctx.fill();
            if (info.viewType === 'cut' && info.fleshColor) {
                ctx.beginPath(); ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = info.fleshColor; ctx.fill();
                ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.stroke();
            }
            ctx.font = `${radius}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000'; ctx.fillText(info.label, 0, radius * 0.1);
            ctx.beginPath(); ctx.arc(-radius*0.3, -radius*0.3, radius*0.2, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
            ctx.restore();
        };
        
        scatteredFruitsRef.current.forEach(f => {
            drawSpecificFruit(f.x, f.y, f.radius, f.level, f.rotation);
        });

        // Bottom Bar
        const boxSize = 60; 
        const gap = 15;
        const totalWidth = 4 * boxSize + 3 * gap + 40;
        const barHeight = boxSize + 20;
        const barX = (width - totalWidth) / 2;
        const barY = height - barHeight - 20;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath(); ctx.roundRect(barX, barY, totalWidth, barHeight, 20); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 2; ctx.stroke();
        
        targetFruitsRef.current.forEach((level, idx) => {
            const bx = barX + 20 + idx * (boxSize + gap);
            const by = barY + 10;
            ctx.fillStyle = '#f0f9ff';
            ctx.strokeStyle = foundTargetsRef.current[idx] ? '#22c55e' : '#cbd5e1';
            ctx.lineWidth = foundTargetsRef.current[idx] ? 4 : 2;
            ctx.beginPath(); ctx.roundRect(bx, by, boxSize, boxSize, 10); ctx.fill(); ctx.stroke();

            drawSpecificFruit(bx + boxSize/2, by + boxSize/2, boxSize * 0.35, level, 0);

            if (foundTargetsRef.current[idx]) {
                ctx.fillStyle = '#22c55e';
                ctx.beginPath(); ctx.arc(bx + boxSize - 8, by + 8, 10, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(bx + boxSize - 13, by + 8);
                ctx.lineTo(bx + boxSize - 10, by + 11);
                ctx.lineTo(bx + boxSize - 4, by + 5); ctx.stroke();
            }
        });

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    return <canvas ref={canvasRef} width={width} height={height} onPointerDown={handlePointerDown} className="block touch-none" />;
};
