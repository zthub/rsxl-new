
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound, playNote } from '../../utils/gameUtils';

// Types
type EntityType = 'RABBIT' | 'GOLDEN_RABBIT' | 'BOMB' | 'EMPTY';
type EntityState = 'RISING' | 'WAITING' | 'HIDING' | 'HIT' | 'GONE';

// 阶段定义
interface Stage {
    name: string;
    minScore: number;
    spawnInterval: number;
    bombChance: number;
    goldenRabbitChance: number;
    waitTime: number;
    color: string;
}

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

// 阶段配置 - 调慢速度，降低分数要求
const STAGES: Stage[] = [
    { name: '新手训练', minScore: 0, spawnInterval: 100, bombChance: 0.15, goldenRabbitChance: 0.05, waitTime: 110, color: '#10b981' },
    { name: '进阶挑战', minScore: 800, spawnInterval: 85, bombChance: 0.25, goldenRabbitChance: 0.08, waitTime: 95, color: '#3b82f6' },
    { name: '高手对决', minScore: 2000, spawnInterval: 65, bombChance: 0.35, goldenRabbitChance: 0.12, waitTime: 80, color: '#f59e0b' },
    { name: '大师之路', minScore: 4000, spawnInterval: 45, bombChance: 0.45, goldenRabbitChance: 0.15, waitTime: 65, color: '#ef4444' },
    { name: '传说级别', minScore: 7000, spawnInterval: 30, bombChance: 0.5, goldenRabbitChance: 0.2, waitTime: 50, color: '#a855f7' },
];

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
        currentScore: 0,
        currentStage: 0,
        combo: 0,
        maxCombo: 0,
        stageChangeTimer: 0, // 阶段切换提示显示时间
    });

    // Initialize Holes
    useEffect(() => {
        const rows = 2;
        const cols = 3;
        const marginX = width * 0.15;
        // 动态计算顶部边距：根据屏幕高度百分比，但确保最小可用空间
        // 横屏模式下 height 较小，使用百分比更合适
        const topMargin = height * 0.2; // 20% 顶部边距
        const bottomMargin = height * 0.1; // 10% 底部边距
        const marginY = topMargin;
        const availW = width - marginX * 2;
        const availH = height - marginY - bottomMargin;
        const cellW = availW / cols;
        const cellH = availH / rows;

        // 确保兔子洞有最小尺寸，适配横屏模式
        const minHoleSize = Math.min(width, height) * 0.12; // 最小为屏幕较小边的12%
        const baseSize = Math.min(cellW, cellH) * 0.7;
        const holeWidth = Math.max(baseSize, minHoleSize);
        const holeHeight = holeWidth * 0.35; // 保持椭圆比例

        const newHoles: Hole[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                newHoles.push({
                    x: marginX + c * cellW + cellW / 2,
                    y: marginY + r * cellH + cellH / 2,
                    width: holeWidth,
                    height: holeHeight, // Ellipse height
                    entityType: 'EMPTY',
                    entityState: 'GONE',
                    animProgress: 0,
                    timer: 0
                });
            }
        }
        stateRef.current.holes = newHoles;
        stateRef.current.spawnTimer = 0;
        stateRef.current.currentScore = 0;
        stateRef.current.currentStage = 0;
        stateRef.current.combo = 0;
        stateRef.current.maxCombo = 0;
        stateRef.current.stageChangeTimer = 0;
    }, [width, height]);

    // 游戏开始时重置状态
    const initializedRef = useRef(false);
    useEffect(() => {
        if (isPlaying && !initializedRef.current) {
            stateRef.current.currentScore = 0;
            stateRef.current.currentStage = 0;
            stateRef.current.combo = 0;
            stateRef.current.maxCombo = 0;
            stateRef.current.stageChangeTimer = 0;
            stateRef.current.spawnTimer = 0;
            stateRef.current.holes.forEach(hole => {
                hole.entityType = 'EMPTY';
                hole.entityState = 'GONE';
                hole.animProgress = 0;
                hole.timer = 0;
            });
            initializedRef.current = true;
        } else if (!isPlaying) {
            initializedRef.current = false;
        }
    }, [isPlaying]);

    // 获取当前阶段
    const getCurrentStage = (score: number): Stage => {
        for (let i = STAGES.length - 1; i >= 0; i--) {
            if (score >= STAGES[i].minScore) {
                return STAGES[i];
            }
        }
        return STAGES[0];
    };

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
                if (hole.entityType === 'RABBIT' || hole.entityType === 'GOLDEN_RABBIT') {
                    // 立即设置为HIT状态，防止后续显示miss消息
                    hole.entityState = 'HIT';
                    const isGolden = hole.entityType === 'GOLDEN_RABBIT';
                    const baseScore = isGolden ? 250 : 80; // 降低基础分数
                    const comboBonus = Math.min(stateRef.current.combo * 8, 150); // 降低连击奖励，最多150
                    const totalScore = baseScore + comboBonus;
                    
                    stateRef.current.combo++;
                    stateRef.current.maxCombo = Math.max(stateRef.current.maxCombo, stateRef.current.combo);
                    
                    const comboText = stateRef.current.combo > 1 ? ` x${stateRef.current.combo}` : '';
                    const scoreText = isGolden ? `⭐ +${totalScore}${comboText}` : `+${totalScore}${comboText}`;
                    hole.textEffect = { 
                        text: scoreText, 
                        color: isGolden ? '#fbbf24' : '#10b981', 
                        life: 50, 
                        yOffset: 0 
                    };
                    stateRef.current.currentScore += totalScore;
                    onScore(totalScore);
                    playSound('correct');
                    hitMade = true;
                } else if (hole.entityType === 'BOMB') {
                    hole.entityState = 'HIT';
                    hole.textEffect = { text: '💥 -50', color: '#ef4444', life: 40, yOffset: 0 };
                    stateRef.current.currentScore = Math.max(0, stateRef.current.currentScore - 50);
                    onScore(-50);
                    stateRef.current.combo = 0; // 连击中断
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
        // 更新阶段
        const newStage = getCurrentStage(state.currentScore);
        const stageIndex = STAGES.findIndex(s => s === newStage);
        if (stageIndex !== state.currentStage && stageIndex > state.currentStage) {
            state.currentStage = stageIndex;
            state.stageChangeTimer = 180; // 显示3秒（60fps * 3）
            playSound('correct');
        }
        if (state.stageChangeTimer > 0) state.stageChangeTimer--;

        // 根据阶段调整参数
        const currentStageConfig = newStage;
        state.spawnInterval = currentStageConfig.spawnInterval;

        state.spawnTimer++;
        if (state.spawnTimer > state.spawnInterval) {
            // Find empty holes
            const emptyHoles = state.holes.filter(h => h.entityType === 'EMPTY');
            if (emptyHoles.length > 0) {
                const randomHole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
                const rand = Math.random();
                
                // 根据阶段概率生成实体
                if (rand < currentStageConfig.bombChance) {
                    randomHole.entityType = 'BOMB';
                } else if (rand < currentStageConfig.bombChance + currentStageConfig.goldenRabbitChance) {
                    randomHole.entityType = 'GOLDEN_RABBIT';
                } else {
                    randomHole.entityType = 'RABBIT';
                }
                
                randomHole.entityState = 'RISING';
                randomHole.timer = 0;
                randomHole.animProgress = 0;
            }
            state.spawnTimer = 0;
        }

        // Update Holes
        state.holes.forEach(hole => {
            if (hole.entityType === 'EMPTY') return;

            const riseSpeed = 0.1;
            const currentStageConfig = getCurrentStage(state.currentScore);
            const maxWait = hole.entityType === 'BOMB' ? currentStageConfig.waitTime + 30 : currentStageConfig.waitTime;

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
                    // 如果已经被打中，不应该显示miss消息
                    if (hole.entityState === 'HIT') {
                        break;
                    }
                    hole.animProgress -= riseSpeed;
                    if (hole.animProgress <= 0) {
                        hole.animProgress = 0;
                        // Rabbit Miss Logic - 只有在没被打中的情况下才显示
                        if (hole.entityType === 'RABBIT' || hole.entityType === 'GOLDEN_RABBIT') {
                            const msg = MISS_MESSAGES[Math.floor(Math.random() * MISS_MESSAGES.length)];
                            hole.textEffect = { text: msg, color: '#3b82f6', life: 60, yOffset: 0 };
                            stateRef.current.combo = 0; // 连击中断
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
                
                if (hole.entityType === 'RABBIT' || hole.entityType === 'GOLDEN_RABBIT') {
                    const isGolden = hole.entityType === 'GOLDEN_RABBIT';
                    
                    // Ears
                    ctx.fillStyle = isGolden ? '#fbbf24' : '#fce7f3'; // Golden or pinkish ears
                    ctx.beginPath();
                    ctx.ellipse(hx - rw*0.2, entityY - rw*0.6, rw*0.1, rw*0.3, -0.2, 0, Math.PI*2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(hx + rw*0.2, entityY - rw*0.6, rw*0.1, rw*0.3, 0.2, 0, Math.PI*2);
                    ctx.fill();

                    // Head
                    ctx.fillStyle = isGolden ? '#fef3c7' : '#ffffff';
                    ctx.beginPath();
                    ctx.arc(hx, entityY, rw * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Golden glow effect
                    if (isGolden) {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#fbbf24';
                        ctx.beginPath();
                        ctx.arc(hx, entityY, rw * 0.4, 0, Math.PI * 2);
                        ctx.strokeStyle = '#fbbf24';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                    
                    // Face
                    ctx.fillStyle = '#000'; // Eyes
                    ctx.beginPath(); ctx.arc(hx - rw*0.12, entityY - rw*0.05, 3, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(hx + rw*0.12, entityY - rw*0.05, 3, 0, Math.PI*2); ctx.fill();
                    
                    ctx.fillStyle = '#f472b6'; // Nose
                    ctx.beginPath(); ctx.arc(hx, entityY + rw*0.05, 4, 0, Math.PI*2); ctx.fill();
                    
                    // Golden star icon
                    if (isGolden) {
                        ctx.fillStyle = '#fbbf24';
                        ctx.font = '16px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('⭐', hx, entityY - rw*0.5);
                    }
                    
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
                // 响应式文字大小
                const effectFontSize = Math.min(24, Math.min(width, height) * 0.05);
                const effectOffset = Math.max(50, Math.min(width, height) * 0.1);
                ctx.font = `bold ${effectFontSize}px "Comic Sans MS"`;
                ctx.fillStyle = fx.color;
                ctx.strokeStyle = 'white';
                ctx.lineWidth = Math.max(2, effectFontSize * 0.12);
                ctx.textAlign = 'center';
                
                ctx.strokeText(fx.text, hx, hy - effectOffset - fx.yOffset);
                ctx.fillText(fx.text, hx, hy - effectOffset - fx.yOffset);
                
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

        // 5. Render UI: Stage, Combo, Score
        // currentStageConfig 已在上面声明，直接使用
        
        // 阶段提示
        if (state.stageChangeTimer > 0) {
            const alpha = Math.min(1, state.stageChangeTimer / 60);
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
            ctx.fillRect(0, 0, width, height);
            
            // 响应式文字大小
            const titleFontSize = Math.min(48, width * 0.08, height * 0.12);
            const subtitleFontSize = Math.min(24, width * 0.04, height * 0.06);
            
            ctx.fillStyle = currentStageConfig.color;
            ctx.font = `bold ${titleFontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 20;
            ctx.shadowColor = currentStageConfig.color;
            ctx.fillText('🎉 ' + currentStageConfig.name + ' 🎉', width/2, height/2 - height * 0.05);
            
            ctx.font = `bold ${subtitleFontSize}px sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.fillText('难度提升！', width/2, height/2 + height * 0.05);
            ctx.restore();
        }
        
        // 顶部信息栏 - 只显示当前阶段，无背景
        // 动态计算位置：标题栏高度 + 间距
        const titleBarHeight = Math.min(100, height * 0.15); // 标题栏高度，横屏时使用百分比
        const infoBarY = titleBarHeight + 10;
        ctx.save();
        
        // 响应式文字大小
        const stageFontSize = Math.min(20, width * 0.04, height * 0.05);
        const padding = Math.max(10, width * 0.02);
        
        // 阶段显示 - 只显示阶段名称
        ctx.fillStyle = currentStageConfig.color;
        ctx.font = `bold ${stageFontSize}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = Math.max(2, stageFontSize * 0.15);
        ctx.strokeText(currentStageConfig.name, padding, infoBarY);
        ctx.fillText(currentStageConfig.name, padding, infoBarY);
        
        ctx.restore();

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, onScore]);

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
            className="block touch-none cursor-none" // Hide default cursor
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
        />
    );
};
