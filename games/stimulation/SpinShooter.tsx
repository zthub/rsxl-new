
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound } from '../../utils/gameUtils';
import { Target as TargetIcon } from 'lucide-react';

interface ShooterTarget {
    type: string; 
    angleOffset: number; 
    radius: number;
    isHit: boolean;
}
interface Bullet {
    x: number; y: number; vx: number; vy: number; active: boolean;
}
interface Particle {
    x: number; y: number; vx: number; vy: number; life: number; color: string;
}

const SHOOTER_ITEMS = ['🥛', '🍾', '🥤', '🧃', '🍵', '🍼', '🏺', '🍶'];

export const SpinShooter: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver, onUpdateAmmo }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    const ammoRef = useRef(20);
    
    const stateRef = useRef({
        gunAngle: 0,
        gunPhase: 'AIMING' as 'SPINNING' | 'AIMING',
        gunTimer: 60,
        discAngle: 0,
        activeTarget: { type: '🥛', angleOffset: 0, radius: 35, isHit: false } as ShooterTarget,
        bullets: [] as Bullet[],
        particles: [] as Particle[],
    });

    // Reset logic
    useEffect(() => {
        if (isPlaying) {
            stateRef.current = {
                gunAngle: 0,
                gunPhase: 'AIMING',
                gunTimer: 60,
                discAngle: 0,
                activeTarget: { 
                    type: SHOOTER_ITEMS[Math.floor(Math.random() * SHOOTER_ITEMS.length)], 
                    angleOffset: 0, 
                    radius: 35, 
                    isHit: false 
                },
                bullets: [],
                particles: []
            };
            ammoRef.current = 20;
            if (onUpdateAmmo) onUpdateAmmo(20);
        }
    }, [isPlaying, onUpdateAmmo]);

    const shootBullet = useCallback(() => {
        if (!isPlaying || ammoRef.current <= 0) return;

        ammoRef.current -= 1;
        if (onUpdateAmmo) onUpdateAmmo(ammoRef.current);
        
        playSound('shoot');

        const { gunAngle } = stateRef.current;
        // Gun pivot assumed center x, bottom y - 80
        const gunX = width / 2;
        const gunY = height - 80;
        const speed = 25;
        
        const vx = Math.sin(gunAngle) * speed;
        const vy = -Math.cos(gunAngle) * speed;
        
        stateRef.current.bullets.push({
            x: gunX + vx * 2,
            y: gunY + vy * 2,
            vx, vy, active: true
        });
    }, [isPlaying, width, height, onUpdateAmmo]);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        
        // Clear
        ctx.clearRect(0, 0, width, height);
        
        // 1. Background
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        const state = stateRef.current;

        // 2. Gun Logic
        if (state.gunPhase === 'AIMING') {
            state.gunAngle = 0;
            state.gunTimer--;
            if (state.gunTimer <= 0) {
                state.gunPhase = 'SPINNING';
                state.gunAngle = 0;
            }
        } else {
            const spinSpeed = 0.4;
            state.gunAngle += spinSpeed;
            if (state.gunAngle >= Math.PI * 2) {
                state.gunAngle = 0;
                state.gunPhase = 'AIMING';
                // Short Pause 0.8s - 1.1s
                state.gunTimer = 50 + Math.random() * 20;
            }
        }

        // 3. Disc Logic
        state.discAngle += 0.04;
        const discX = width / 2;
        const discY = 160;
        const discRadius = Math.min(width, height) * 0.16;

        ctx.save();
        ctx.translate(discX, discY);
        ctx.rotate(state.discAngle);
        ctx.beginPath(); ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, discRadius);
        grad.addColorStop(0, '#fde047'); grad.addColorStop(1, '#b45309');
        ctx.fillStyle = grad; ctx.fill();
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 4; ctx.stroke();
        for(let i=0; i<8; i++) {
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(i * Math.PI/4) * discRadius, Math.sin(i * Math.PI/4) * discRadius);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();

        // 4. Target
        if (!state.activeTarget.isHit) {
            const t = state.activeTarget;
            const orbitAngle = state.discAngle + t.angleOffset;
            const targetX = discX + Math.cos(orbitAngle) * (discRadius - 30);
            const targetY = discY + Math.sin(orbitAngle) * (discRadius - 30);
            
            ctx.beginPath(); ctx.arc(targetX, targetY, t.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'white'; ctx.fill();
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.stroke();
            ctx.font = `${t.radius * 1.2}px serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(t.type, targetX, targetY + 4);
        }

        // 5. Gun Draw
        const gunX = width / 2;
        const gunY = height - 80;
        ctx.save();
        ctx.translate(gunX, gunY);
        ctx.rotate(state.gunAngle);
        ctx.fillStyle = '#475569'; ctx.fillRect(-10, -50, 20, 60);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(-8, -100, 16, 60);
        ctx.save();
        ctx.translate(0, -50); ctx.rotate(frameCountRef.current * 0.1);
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = '#334155'; ctx.fill();
        ctx.fillStyle = '#1e293b';
        for(let i=0; i<6; i++) {
            const ang = i * (Math.PI / 3);
            ctx.beginPath(); ctx.arc(Math.cos(ang)*10, Math.sin(ang)*10, 4, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = 'red'; ctx.fillRect(-2, -102, 4, 4);
        ctx.restore();

        // 6. Bullets
        for (let i = state.bullets.length - 1; i >= 0; i--) {
            const b = state.bullets[i];
            b.x += b.vx; b.y += b.vy;
            ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill();
            
            if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
                state.bullets.splice(i, 1); continue;
            }

            if (!state.activeTarget.isHit) {
                const t = state.activeTarget;
                const orbitAngle = state.discAngle + t.angleOffset;
                const tx = discX + Math.cos(orbitAngle) * (discRadius - 30);
                const ty = discY + Math.sin(orbitAngle) * (discRadius - 30);
                if (Math.hypot(b.x - tx, b.y - ty) < t.radius + 6) {
                    state.activeTarget.isHit = true;
                    state.bullets.splice(i, 1);
                    onScore(100);
                    playSound('correct');
                    for(let k=0; k<8; k++) {
                        state.particles.push({
                            x: tx, y: ty, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 30, color: '#fff'
                        });
                    }
                    setTimeout(() => {
                        stateRef.current.activeTarget = {
                            type: SHOOTER_ITEMS[Math.floor(Math.random() * SHOOTER_ITEMS.length)],
                            angleOffset: Math.random() * Math.PI * 2, radius: 35, isHit: false
                        };
                    }, 500);
                }
            }
        }

        // 7. Particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1.0;
            if (p.life <= 0) state.particles.splice(i, 1);
        }

        // Game Over Check
        if (ammoRef.current <= 0 && state.bullets.length === 0) {
            onGameOver();
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, isPlaying, onScore, onGameOver]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    return (
        <>
            <canvas ref={canvasRef} width={width} height={height} className="block touch-none" />
            {isPlaying && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center pb-safe">
                    <button 
                        onMouseDown={(e) => { e.stopPropagation(); shootBullet(); }}
                        onTouchStart={(e) => { e.stopPropagation(); shootBullet(); }}
                        className="w-24 h-24 rounded-full bg-red-500 border-4 border-white shadow-xl active:scale-95 active:bg-red-600 transition-all flex flex-col items-center justify-center"
                    >
                        <TargetIcon className="w-10 h-10 text-white mb-1" />
                        <span className="text-white font-black text-xs tracking-widest">发射</span>
                    </button>
                </div>
            )}
        </>
    );
};
