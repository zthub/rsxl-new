
import React, { useRef, useEffect, useCallback, useState } from 'react';
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

interface LevelConfig {
    targetCount: number; // 目标数量 1-5
    discSpeed: number; // 转盘速度
    reverseDirection: boolean; // 是否反向旋转
}

const SHOOTER_ITEMS = ['🥛', '🍾', '🥤', '🧃', '🍵', '🍼', '🏺', '🍶'];

// 关卡配置：最多5个物品，通过难度变化增加关卡
// 前面关卡：增加瓶子不增加速度，后续关卡逐步增加速度
const LEVEL_CONFIGS: LevelConfig[] = [
    // 基础关卡：1-5个物品，速度保持较低且不变
    { targetCount: 1, discSpeed: 0.015, reverseDirection: false },
    { targetCount: 2, discSpeed: 0.015, reverseDirection: false },
    { targetCount: 3, discSpeed: 0.015, reverseDirection: false },
    { targetCount: 4, discSpeed: 0.015, reverseDirection: false },
    { targetCount: 5, discSpeed: 0.015, reverseDirection: false },
    // 后续关卡：逐步增加速度
    { targetCount: 3, discSpeed: 0.02, reverseDirection: false },
    { targetCount: 4, discSpeed: 0.02, reverseDirection: false },
    { targetCount: 5, discSpeed: 0.025, reverseDirection: false },
    // 难度增加：反向旋转
    { targetCount: 3, discSpeed: 0.025, reverseDirection: true },
    { targetCount: 4, discSpeed: 0.03, reverseDirection: true },
    { targetCount: 5, discSpeed: 0.03, reverseDirection: true },
    // 难度增加：速度继续加快
    { targetCount: 3, discSpeed: 0.035, reverseDirection: false },
    { targetCount: 4, discSpeed: 0.04, reverseDirection: false },
    { targetCount: 5, discSpeed: 0.045, reverseDirection: false },
    // 难度增加：反向+快速
    { targetCount: 4, discSpeed: 0.05, reverseDirection: true },
    { targetCount: 5, discSpeed: 0.055, reverseDirection: true },
    { targetCount: 5, discSpeed: 0.06, reverseDirection: true },
];

export const SpinShooter: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver, onUpdateAmmo }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const lastTimeRef = useRef<number>(0);
    
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    const ammoRef = useRef(20);
    
    // 关卡状态
    const [level, setLevel] = useState(1);
    const [levelComplete, setLevelComplete] = useState(false);
    
    const stateRef = useRef({
        gunAngle: 0,
        gunPhase: 'AIMING' as 'SPINNING' | 'AIMING' | 'READY',
        gunSpinProgress: 0, // 转圈进度 0-2π
        discAngle: 0,
        targets: [] as ShooterTarget[],
        bullets: [] as Bullet[],
        particles: [] as Particle[],
        canShoot: true, // 是否可以发射（防止连发）
    });

    // 初始化关卡
    const initLevel = useCallback((levelNum: number) => {
        const config = LEVEL_CONFIGS[(levelNum - 1) % LEVEL_CONFIGS.length];
        const targets: ShooterTarget[] = [];
        
        // 根据配置创建目标
        for (let i = 0; i < config.targetCount; i++) {
            const angleOffset = (Math.PI * 2 / config.targetCount) * i;
            targets.push({
                type: SHOOTER_ITEMS[Math.floor(Math.random() * SHOOTER_ITEMS.length)],
                angleOffset: angleOffset,
                radius: 30, // 基础半径，竖屏时使用，横屏时会缩小显示
                isHit: false
            });
        }
        
        stateRef.current = {
            gunAngle: 0,
            gunPhase: 'AIMING',
            gunSpinProgress: 0,
            discAngle: 0,
            targets: targets,
            bullets: [],
            particles: [],
            canShoot: true,
        };
        
        // 延迟重置关卡完成状态，确保提示显示足够时间
        setTimeout(() => {
            setLevelComplete(false);
        }, 100);
    }, []);

    // Reset logic
    useEffect(() => {
        if (isPlaying) {
            setLevel(1);
            ammoRef.current = 20;
            if (onUpdateAmmo) onUpdateAmmo(20);
            initLevel(1);
        }
    }, [isPlaying, initLevel, onUpdateAmmo]);

    const shootBullet = useCallback(() => {
        const state = stateRef.current;
        
        // 防止连发：只有在 AIMING 状态且 canShoot 为 true 时才能发射
        if (!isPlaying || ammoRef.current <= 0 || state.gunPhase !== 'AIMING' || !state.canShoot) {
            return;
        }

        // 立即发射子弹
        const gunX = width / 2;
        const gunY = height - 40; // 枪下移
        const speed = 25;
        
        const vx = Math.sin(state.gunAngle) * speed;
        const vy = -Math.cos(state.gunAngle) * speed;
        
        state.bullets.push({
            x: gunX + vx * 2,
            y: gunY + vy * 2,
            vx, vy, active: true
        });

        // 发射后开始转圈
        state.canShoot = false;
        state.gunPhase = 'SPINNING';
        state.gunSpinProgress = 0;

        ammoRef.current -= 1;
        if (onUpdateAmmo) onUpdateAmmo(ammoRef.current);
        
        playSound('shoot');
    }, [isPlaying, width, height, onUpdateAmmo]);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 计算时间缩放
        const now = performance.now();
        const lastTime = lastTimeRef.current;
        const targetFPS = 60;
        const targetFrameTime = 1000 / targetFPS;
        let deltaTime: number;
        if (!lastTime || lastTime <= 0) {
            deltaTime = targetFrameTime;
        } else {
            const rawDelta = now - lastTime;
            deltaTime = rawDelta > 100 ? targetFrameTime : Math.min(rawDelta, 33.33);
        }
        lastTimeRef.current = now;
        const timeScale = Math.min(Math.max(deltaTime / targetFrameTime, 0.3), 1.2);

        frameCountRef.current++;
        
        // Clear
        ctx.clearRect(0, 0, width, height);
        
        // 1. Background
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        const state = stateRef.current;
        const config = LEVEL_CONFIGS[(level - 1) % LEVEL_CONFIGS.length];

        // 2. Gun Logic - 修改为：发射后转一圈，转完才能再次发射
        if (state.gunPhase === 'SPINNING') {
            const spinSpeed = 0.15 * timeScale; // 降低转圈速度，适配横屏
            state.gunSpinProgress += spinSpeed;
            state.gunAngle = state.gunSpinProgress;
            
            // 转完一圈（2π）后可以再次发射
            if (state.gunSpinProgress >= Math.PI * 2) {
                // 重置状态
                state.gunSpinProgress = 0;
                state.gunAngle = 0;
                state.gunPhase = 'AIMING';
                state.canShoot = true; // 转完后可以再次发射
            }
        } else if (state.gunPhase === 'AIMING') {
            state.gunAngle = 0;
        }

        // 3. Disc Logic - 根据配置调整速度和方向
        const discSpeed = config.discSpeed * timeScale;
        if (config.reverseDirection) {
            state.discAngle -= discSpeed;
        } else {
            state.discAngle += discSpeed;
        }
        
        // 适配横屏：动态计算转盘位置和大小
        const isLandscape = width > height;
        const discX = width / 2;
        const discY = isLandscape ? Math.max(100, height * 0.2) : 160; // 横屏时圆盘上移
        // 横屏时增大转盘大小，提高难度
        const discRadius = isLandscape 
            ? Math.min(width, height) * 0.18 
            : Math.min(width, height) * 0.16;

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

        // 4. Targets - 绘制所有未命中的目标
        state.targets.forEach(t => {
            if (!t.isHit) {
                const orbitAngle = state.discAngle + t.angleOffset;
                // 横屏时使用更小的显示半径，竖屏时保持原始大小
                const displayRadius = isLandscape ? t.radius * 0.65 : t.radius;
                const targetX = discX + Math.cos(orbitAngle) * (discRadius - 25);
                const targetY = discY + Math.sin(orbitAngle) * (discRadius - 25);
                
                ctx.beginPath(); ctx.arc(targetX, targetY, displayRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'white'; ctx.fill();
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.stroke();
                // 横屏时进一步减小字体大小，竖屏时保持正常大小
                const fontSize = isLandscape ? displayRadius * 0.6 : displayRadius * 1.2;
                ctx.font = `${fontSize}px serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(t.type, targetX, targetY + 4);
            }
        });

        // 5. Gun Draw
        const gunX = width / 2;
        const gunY = height - 40; // 枪下移
        // 横屏时缩短枪的长度
        const gunBarrelLength = isLandscape ? 40 : 60; // 横屏时枪管更短
        const gunBodyLength = isLandscape ? 35 : 50; // 横屏时枪身更短
        ctx.save();
        ctx.translate(gunX, gunY);
        ctx.rotate(state.gunAngle);
        ctx.fillStyle = '#475569'; ctx.fillRect(-10, -gunBodyLength, 20, gunBodyLength + 10);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(-8, -gunBarrelLength, 16, gunBarrelLength);
        ctx.save();
        ctx.translate(0, -gunBodyLength); ctx.rotate(frameCountRef.current * 0.1);
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = '#334155'; ctx.fill();
        ctx.fillStyle = '#1e293b';
        for(let i=0; i<6; i++) {
            const ang = i * (Math.PI / 3);
            ctx.beginPath(); ctx.arc(Math.cos(ang)*10, Math.sin(ang)*10, 4, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = 'red'; ctx.fillRect(-2, -gunBarrelLength - 2, 4, 4);
        ctx.restore();

        // 6. Bullets
        for (let i = state.bullets.length - 1; i >= 0; i--) {
            const b = state.bullets[i];
            b.x += b.vx * timeScale; b.y += b.vy * timeScale;
            ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill();
            
            if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
                state.bullets.splice(i, 1); continue;
            }

            // 检查是否命中任何目标
            state.targets.forEach((t, targetIdx) => {
                if (!t.isHit) {
                    const orbitAngle = state.discAngle + t.angleOffset;
                    const tx = discX + Math.cos(orbitAngle) * (discRadius - 25);
                    const ty = discY + Math.sin(orbitAngle) * (discRadius - 25);
                    // 使用与绘制时相同的显示半径进行碰撞检测
                    const displayRadius = isLandscape ? t.radius * 0.8 : t.radius;
                    if (Math.hypot(b.x - tx, b.y - ty) < displayRadius + 6) {
                        t.isHit = true;
                        state.bullets.splice(i, 1);
                        onScore(100);
                        playSound('correct');
                        for(let k=0; k<8; k++) {
                            state.particles.push({
                                x: tx, y: ty, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 30, color: '#fff'
                            });
                        }
                        
                        // 检查是否所有目标都被击中
                        const allHit = state.targets.every(target => target.isHit);
                        if (allHit && !levelComplete) {
                            setLevelComplete(true);
                            playSound('correct');
                            // 延迟进入下一关，等待粒子效果播放完成（粒子生命周期30帧，约500ms，加上足够缓冲时间让用户看到效果）
                            setTimeout(() => {
                                const nextLevel = level + 1;
                                setLevel(nextLevel);
                                ammoRef.current = 20; // 重置子弹数
                                if (onUpdateAmmo) onUpdateAmmo(20);
                                initLevel(nextLevel);
                            }, 2000); // 延迟2秒，确保击中效果播放完成
                        }
                    }
                }
            });
        }

        // 7. Particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.x += p.vx * timeScale; p.y += p.vy * timeScale; p.life--;
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
    }, [width, height, visualAcuity, isPlaying, onScore, onGameOver, level, levelComplete, initLevel]);

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
            lastTimeRef.current = 0; // 重置时间引用
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    return (
        <>
            <canvas ref={canvasRef} className="block touch-none" />
            {isPlaying && (
                <>
                    {/* 关卡完成提示 */}
                    {levelComplete && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                            <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full border-4 border-green-400">
                                <div className="text-6xl mb-4">🎉</div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">关卡完成!</h3>
                                <p className="text-slate-600 mb-4">恭喜通过第 {level} 关</p>
                                <p className="text-sm text-slate-500">准备进入第 {level + 1} 关...</p>
                            </div>
                        </div>
                    )}
                    
                    {/* 关卡显示 */}
                    <div className="absolute top-8 left-8 pb-safe">
                        <div className="bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700 text-center">
                            <div className="text-[10px] text-slate-400">关卡</div>
                            <div className="text-lg font-bold text-white">{level}</div>
                        </div>
                    </div>
                    
                    {/* 发射按钮 - 移到右侧 */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pb-safe">
                        <button 
                            onMouseDown={(e) => { e.stopPropagation(); shootBullet(); }}
                            onTouchStart={(e) => { e.stopPropagation(); shootBullet(); }}
                            className="w-24 h-24 rounded-full bg-red-500 border-4 border-white shadow-xl active:scale-95 active:bg-red-600 transition-all flex flex-col items-center justify-center"
                        >
                            <TargetIcon className="w-10 h-10 text-white mb-1" />
                            <span className="text-white font-black text-xs tracking-widest">发射</span>
                        </button>
                    </div>
                </>
            )}
        </>
    );
};
