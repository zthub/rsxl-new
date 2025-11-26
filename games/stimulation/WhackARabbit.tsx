
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound, playNote } from '../../utils/gameUtils';

// Types
type EntityType = 'RABBIT' | 'BOMB' | 'EMPTY';
type EntityState = 'RISING' | 'WAITING' | 'HIDING' | 'HIT' | 'GONE';

interface Hole {
    x: number;
    y: number;
    width: number;
    height: number;
    entityType: EntityType;
    entityState: EntityState;
    animProgress: number; // 0 to 1 (height factor)
    timer: number;
    textEffect?: { text: string; color: string; life: number; yOffset: number };
}

interface Hammer {
    x: number;
    y: number;
    angle: number;
    isStriking: boolean;
}

const MISS_MESSAGES = ["我跑啦", "打不到", "略略略", "下次吧", "溜了溜了"];

export const WhackARabbit: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    // Game State Refs
    const stateRef = useRef({
        holes: [] as Hole[],
        hammer: { x: width/2, y: height/2, angle: 0, isStriking: false } as Hammer,
        spawnTimer: 0,
        spawnInterval: 80, // Frames
    });

    // Initialize Holes
    useEffect(() => {
        const rows = 2;
        const cols = 3;
        const marginX = width * 0.15;
        const marginY = height * 0.25;
        const availW = width - marginX * 2;
        const availH = height - marginY * 2;
        const cellW = availW / cols;
        const cellH = availH / rows;

        const newHoles: Hole[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                newHoles.push({
                    x: marginX + c * cellW + cellW / 2,
                    y: marginY + r * cellH + cellH / 2,
                    width: Math.min(cellW, cellH) * 0.7,
                    height: Math.min(cellW, cellH) * 0.25, // Ellipse height
                    entityType: 'EMPTY',
                    entityState: 'GONE',
                    animProgress: 0,
                    timer: 0
                });
            }
        }
        stateRef.current.holes = newHoles;
        stateRef.current.spawnTimer = 0;
    }, [width, height]);

    // Handle Clicks
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isPlaying) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Update hammer visual position instantly
        stateRef.current.hammer.x = clickX;
        stateRef.current.hammer.y = clickY;
        stateRef.current.hammer.isStriking = true;
        stateRef.current.hammer.angle = -Math.PI / 4; // Cock back
        
        // Check hits
        let hitMade = false;
        stateRef.current.holes.forEach(hole => {
            if (hole.entityType === 'EMPTY' || hole.entityState === 'HIT' || hole.entityState === 'GONE') return;
            
            // Hitbox area (above the hole)
            const hitBoxBottom = hole.y;
            const hitBoxTop = hole.y - hole.width * 1.2; // Approx height of rabbit
            const hitBoxLeft = hole.x - hole.width / 2;
            const hitBoxRight = hole.x + hole.width / 2;

            if (clickX >= hitBoxLeft && clickX <= hitBoxRight && 
                clickY >= hitBoxTop && clickY <= hitBoxBottom + 20) {
                
                // Effective Hit
                if (hole.entityType === 'RABBIT') {
                    hole.entityState = 'HIT';
                    hole.textEffect = { text: '+100', color: '#10b981', life: 40, yOffset: 0 };
                    onScore(100);
                    playSound('correct');
                    hitMade = true;
                } else if (hole.entityType === 'BOMB') {
                    hole.entityState = 'HIT';
                    hole.textEffect = { text: '💥 -50', color: '#ef4444', life: 40, yOffset: 0 };
                    onScore(-50);
                    playSound('wrong');
                    hitMade = true;
                }
            }
        });

        // Trigger hammer animation
        setTimeout(() => {
            stateRef.current.hammer.isStriking = false;
        }, 150);
    };
    
    // Move hammer with mouse/touch
    const handlePointerMove = (e: React.PointerEvent) => {
         const rect = canvasRef.current?.getBoundingClientRect();
         if (rect) {
             stateRef.current.hammer.x = e.clientX - rect.left;
             stateRef.current.hammer.y = e.clientY - rect.top;
         }
    };

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        const state = stateRef.current;

        // 1. Render Background (Visual Stimulation)
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        // 2. Logic Update
        state.spawnTimer++;
        if (state.spawnTimer > state.spawnInterval) {
            // Find empty holes
            const emptyHoles = state.holes.filter(h => h.entityType === 'EMPTY');
            if (emptyHoles.length > 0) {
                const randomHole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
                randomHole.entityType = Math.random() > 0.25 ? 'RABBIT' : 'BOMB';
                randomHole.entityState = 'RISING';
                randomHole.timer = 0;
                randomHole.animProgress = 0;
            }
            state.spawnTimer = 0;
            // Gradually increase speed
            state.spawnInterval = Math.max(40, 80 - Math.floor(frameCountRef.current / 600)); 
        }

        // Update Holes
        state.holes.forEach(hole => {
            if (hole.entityType === 'EMPTY') return;

            const riseSpeed = 0.1;
            const maxWait = hole.entityType === 'BOMB' ? 120 : 90; // Bombs stay longer to trick player

            switch (hole.entityState) {
                case 'RISING':
                    hole.animProgress += riseSpeed;
                    if (hole.animProgress >= 1) {
                        hole.animProgress = 1;
                        hole.entityState = 'WAITING';
                        hole.timer = 0;
                    }
                    break;
                case 'WAITING':
                    hole.timer++;
                    if (hole.timer > maxWait) {
                        hole.entityState = 'HIDING';
                    }
                    break;
                case 'HIDING':
                    hole.animProgress -= riseSpeed;
                    if (hole.animProgress <= 0) {
                        hole.animProgress = 0;
                        // Rabbit Miss Logic
                        if (hole.entityType === 'RABBIT') {
                            const msg = MISS_MESSAGES[Math.floor(Math.random() * MISS_MESSAGES.length)];
                            hole.textEffect = { text: msg, color: '#3b82f6', life: 60, yOffset: 0 };
                            // Cute miss sound
                            playNote(600, 0.1, 0, 'sine');
                            setTimeout(() => playNote(400, 0.1, 0, 'sine'), 100);
                        }
                        hole.entityType = 'EMPTY';
                        hole.entityState = 'GONE';
                    }
                    break;
                case 'HIT':
                    // Shake or simple disappear
                    hole.animProgress -= 0.2;
                    if (hole.animProgress <= 0) {
                        hole.entityType = 'EMPTY';
                        hole.entityState = 'GONE';
                    }
                    break;
            }
        });

        // 3. Render Holes and Entities
        // To make entities appear "inside" the hole, we need to handle layering carefully.
        // Layer 1: Hole Back (Dark)
        // Layer 2: Entity (Clipped to area above hole bottom)
        // Layer 3: Hole Front (Ground cover)

        state.holes.forEach(hole => {
            const hx = hole.x;
            const hy = hole.y;
            const rw = hole.width;
            const rh = hole.height;

            // Draw Hole (Back) - The dark void
            ctx.fillStyle = '#1f2937'; // Dark gray
            ctx.beginPath();
            ctx.ellipse(hx, hy, rw/2, rh/2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw Entity
            if (hole.entityType !== 'EMPTY') {
                const popHeight = rw * 1.2 * hole.animProgress;
                
                ctx.save();
                // Clip region: Everything above the bottom edge of the hole
                // Actually, standard clipping is hard for "behind the front rim but in front of back rim".
                // Simple trick: Draw entity, then draw the front rim of the hole over it.
                
                const entityY = hy - popHeight + (rh * 0.2); // Start slightly inside
                
                if (hole.entityType === 'RABBIT') {
                    // Ears
                    ctx.fillStyle = '#fce7f3'; // Pinkish ears
                    ctx.beginPath();
                    ctx.ellipse(hx - rw*0.2, entityY - rw*0.6, rw*0.1, rw*0.3, -0.2, 0, Math.PI*2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(hx + rw*0.2, entityY - rw*0.6, rw*0.1, rw*0.3, 0.2, 0, Math.PI*2);
                    ctx.fill();

                    // Head
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(hx, entityY, rw * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Face
                    ctx.fillStyle = '#000'; // Eyes
                    ctx.beginPath(); ctx.arc(hx - rw*0.12, entityY - rw*0.05, 3, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(hx + rw*0.12, entityY - rw*0.05, 3, 0, Math.PI*2); ctx.fill();
                    
                    ctx.fillStyle = '#f472b6'; // Nose
                    ctx.beginPath(); ctx.arc(hx, entityY + rw*0.05, 4, 0, Math.PI*2); ctx.fill();
                    
                    // Hit Effect (Dizzy eyes)
                    if (hole.entityState === 'HIT') {
                        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(hx-10, entityY-10); ctx.lineTo(hx-2, entityY-2); 
                        ctx.moveTo(hx-2, entityY-10); ctx.lineTo(hx-10, entityY-2); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(hx+2, entityY-10); ctx.lineTo(hx+10, entityY-2);
                        ctx.moveTo(hx+10, entityY-10); ctx.lineTo(hx+2, entityY-2); ctx.stroke();
                    }

                } else if (hole.entityType === 'BOMB') {
                    ctx.fillStyle = '#374151'; // Black/Grey bomb
                    ctx.beginPath();
                    ctx.arc(hx, entityY, rw * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Fuse
                    ctx.strokeStyle = '#d97706';
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(hx, entityY - rw*0.3); 
                    ctx.quadraticCurveTo(hx + 10, entityY - rw*0.4, hx + 15, entityY - rw*0.35);
                    ctx.stroke();
                    
                    // Spark
                    if (Math.floor(frameCountRef.current / 5) % 2 === 0) {
                        ctx.fillStyle = '#ef4444';
                        ctx.beginPath(); ctx.arc(hx + 15, entityY - rw*0.35, 4, 0, Math.PI*2); ctx.fill();
                    }
                    
                    // Skull icon
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline='middle';
                    ctx.fillText('☠️', hx, entityY + 2);

                    if (hole.entityState === 'HIT') {
                        // Explosion flash
                        ctx.fillStyle = '#ef4444';
                        ctx.beginPath(); ctx.arc(hx, entityY, rw*0.5, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = '#facc15';
                        ctx.beginPath(); ctx.arc(hx, entityY, rw*0.3, 0, Math.PI*2); ctx.fill();
                    }
                }
                ctx.restore();
            }

            // Draw Hole (Front Rim) - to hide the bottom of the entity
            // We draw the bottom half of the ellipse again with the ground color? 
            // Since the background is dynamic (flashing), we can't easily "erase".
            // Instead, we just rely on the entity Y position. 
            // If we want it to look perfect, we can use `ctx.globalCompositeOperation = 'destination-over'` but that's complex with the flashing BG.
            // Simple fix: Draw a thick border for the hole to cover slight overlaps.
            
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(hx, hy, rw/2, rh/2, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            // Render Text Effects
            if (hole.textEffect) {
                const fx = hole.textEffect;
                ctx.save();
                ctx.font = 'bold 24px "Comic Sans MS"';
                ctx.fillStyle = fx.color;
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 3;
                ctx.textAlign = 'center';
                
                ctx.strokeText(fx.text, hx, hy - 50 - fx.yOffset);
                ctx.fillText(fx.text, hx, hy - 50 - fx.yOffset);
                
                fx.yOffset += 1;
                fx.life--;
                if (fx.life <= 0) hole.textEffect = undefined;
                ctx.restore();
            }
        });

        // 4. Render Hammer
        const hammer = state.hammer;
        ctx.save();
        ctx.translate(hammer.x, hammer.y);
        // Animate swing
        const angle = hammer.isStriking ? -Math.PI / 2 : 0; 
        // Interpolate angle for smoother visual
        if (hammer.isStriking) hammer.angle = -Math.PI/3;
        else hammer.angle = hammer.angle * 0.8; // Return to 0
        
        ctx.rotate(hammer.angle);
        
        // Hammer Visual
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10;
        // Handle
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-5, 0, 10, 60);
        // Head
        ctx.fillStyle = '#374151';
        ctx.fillRect(-25, -20, 50, 30);
        ctx.fillStyle = '#6b7280'; // Shine
        ctx.fillRect(-20, -15, 40, 5);
        
        ctx.restore();

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    return (
        <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            className="block touch-none cursor-none" // Hide default cursor
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
        />
    );
};
