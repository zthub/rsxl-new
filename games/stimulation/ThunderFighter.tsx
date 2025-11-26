
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound } from '../../utils/gameUtils';

// --- 类型定义 ---

type WeaponType = 'NORMAL' | 'LASER' | 'FLAME';
type EnemyType = 'BASIC' | 'SPEED' | 'TANK' | 'BOSS';
type BuffType = 'HEAL' | 'WEAPON_LASER' | 'WEAPON_FLAME' | 'WEAPON_SPREAD' | 'SHIELD';

interface Entity {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    vx: number;
    vy: number;
    type?: string; 
    color?: string;
    
    // 战斗属性
    hp?: number;
    maxHp?: number;
    damage?: number; // 子弹伤害
    scoreValue?: number; // 击杀分数
    
    // 敌人特有
    enemyType?: EnemyType;
    shootTimer?: number;
    hitFlash?: number; // 受击闪白倒计时
    
    // Buff 特有
    buffType?: BuffType;
    isDropped?: boolean; // 是否是玩家掉落的

    // 子弹特有：记录已命中的实体ID，防止穿透武器单帧多次伤害
    hitEntityIds?: number[];
}

interface Particle {
    x: number; y: number; vx: number; vy: number; life: number; color: string; size: number;
    text?: string; 
}

// --- 配置常量 ---
const WEAPON_CONFIG = {
    NORMAL: { damage: 10, speed: 12, width: 6, height: 16, color: '#facc15', interval: 15 },
    SPREAD: { damage: 10, speed: 12, width: 6, height: 16, color: '#facc15', interval: 15 },
    LASER:  { damage: 5,  speed: 25, width: 6, height: 50, color: '#06b6d4', interval: 6 },  // 激光单发伤害略降，靠频率和多重
    FLAME:  { damage: 45, speed: 8,  width: 24, height: 24, color: '#f97316', interval: 22 }, 
};

export const ThunderFighter: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    // 游戏核心状态
    const gameState = useRef({
        player: { 
            id: 0, x: width / 2, y: height - 100, width: 44, height: 60, 
            vx: 0, vy: 0, hp: 5, maxHp: 5,
            weaponType: 'NORMAL' as WeaponType,
            weaponLevel: 1, // 1: 初始, 2: 强化, 3: 究极
            shieldTimer: 0, 
            invincibleTimer: 0,
            hitFlashTimer: 0,
        },
        
        bullets: [] as Entity[],     
        enemyBullets: [] as Entity[],
        enemies: [] as Entity[],     
        buffs: [] as Entity[],       
        particles: [] as Particle[], 
        
        phase: 'WAVE' as 'WAVE' | 'BOSS_WARNING' | 'BOSS_FIGHT',
        boss: null as Entity | null,
        lastShotTime: 0,
        enemySpawnTimer: 0,
        difficultyLevel: 1, // 随BOSS击杀增加
        score: 0,
        nextBossScore: 3000, 
        
        screenShake: 0,
        redFlash: 0,
    });

    // 初始化 - 仅在 isPlaying 变为 true 时重置，移除 width/height 依赖防止Resize导致重置
    useEffect(() => {
        if (isPlaying) {
            gameState.current = {
                player: { 
                    id: 0, x: width / 2, y: height - 100, width: 44, height: 60, 
                    vx: 0, vy: 0, hp: 5, maxHp: 5,
                    weaponType: 'NORMAL',
                    weaponLevel: 1,
                    shieldTimer: 0, invincibleTimer: 0, hitFlashTimer: 0
                },
                bullets: [], enemyBullets: [], enemies: [], buffs: [], particles: [],
                phase: 'WAVE', boss: null,
                lastShotTime: 0, enemySpawnTimer: 0, difficultyLevel: 1, score: 0, nextBossScore: 3000,
                screenShake: 0, redFlash: 0
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying]); 

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPlaying) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            let targetX = e.clientX - rect.left;
            let targetY = e.clientY - rect.top;
            targetX = Math.max(0, Math.min(width, targetX));
            targetY = Math.max(0, Math.min(height, targetY));
            gameState.current.player.x = targetX;
            gameState.current.player.y = targetY - 40;
        }
    };

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        const state = gameState.current;
        const p = state.player;

        // Resize 保护：确保玩家不会因为窗口变小而被卡在外面
        p.x = Math.max(20, Math.min(width - 20, p.x));
        p.y = Math.max(40, Math.min(height - 40, p.y));

        // 0. 特效处理 (震动)
        ctx.save();
        if (state.screenShake > 0) {
            const dx = (Math.random() - 0.5) * state.screenShake;
            const dy = (Math.random() - 0.5) * state.screenShake;
            ctx.translate(dx, dy);
            state.screenShake *= 0.9;
            if (state.screenShake < 1) state.screenShake = 0;
        }

        // 1. 渲染背景
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        // 2. 玩家状态更新
        if (p.invincibleTimer > 0) p.invincibleTimer--;
        if (p.shieldTimer > 0) p.shieldTimer--;
        if (p.hitFlashTimer > 0) p.hitFlashTimer--;

        // 3. 玩家射击逻辑
        const wConfig = WEAPON_CONFIG[p.weaponType];
        // 普通武器散射使用 SPREAD 配置
        const currentInterval = p.weaponType === 'NORMAL' && p.weaponLevel >= 2 ? WEAPON_CONFIG.SPREAD.interval : wConfig.interval;

        if (frameCountRef.current - state.lastShotTime > currentInterval) {
            playSound('shoot');
            state.lastShotTime = frameCountRef.current;

            const baseProps = {
                width: wConfig.width, height: wConfig.height, color: wConfig.color, 
                damage: wConfig.damage, type: 'bullet'
            };

            // --- 激光射击逻辑 (等级叠加) ---
            if (p.weaponType === 'LASER') {
                // Lv1: 单发
                state.bullets.push({ ...baseProps, id: Date.now(), x: p.x, y: p.y - 40, vx: 0, vy: -wConfig.speed });
                
                // Lv2: 双发
                if (p.weaponLevel >= 2) {
                     state.bullets.push({ ...baseProps, id: Date.now()+1, x: p.x - 12, y: p.y - 30, vx: 0, vy: -wConfig.speed });
                     state.bullets.push({ ...baseProps, id: Date.now()+2, x: p.x + 12, y: p.y - 30, vx: 0, vy: -wConfig.speed });
                }
                // Lv3: 额外侧翼激光
                if (p.weaponLevel >= 3) {
                     state.bullets.push({ ...baseProps, id: Date.now()+3, x: p.x - 24, y: p.y - 20, vx: -1, vy: -wConfig.speed });
                     state.bullets.push({ ...baseProps, id: Date.now()+4, x: p.x + 24, y: p.y - 20, vx: 1, vy: -wConfig.speed });
                }
            
            // --- 火焰射击逻辑 (等级叠加) ---
            } else if (p.weaponType === 'FLAME') {
                // Lv1: 单发
                state.bullets.push({ 
                    ...baseProps, id: Date.now(), x: p.x, y: p.y - 30, 
                    vx: (Math.random()-0.5)*2, vy: -wConfig.speed 
                });

                // Lv2: 威力加强 (变大) 或 射速略微提升(配置控制)，此处增加额外的弹丸模拟大范围
                if (p.weaponLevel >= 2) {
                    state.bullets.push({ 
                        ...baseProps, id: Date.now()+1, x: p.x - 15, y: p.y - 30, width: 28, height: 28,
                        vx: -1.5, vy: -wConfig.speed * 0.9 
                    });
                     state.bullets.push({ 
                        ...baseProps, id: Date.now()+2, x: p.x + 15, y: p.y - 30, width: 28, height: 28,
                        vx: 1.5, vy: -wConfig.speed * 0.9 
                    });
                }
                // Lv3: 扇面火焰
                if (p.weaponLevel >= 3) {
                    state.bullets.push({ 
                        ...baseProps, id: Date.now()+3, x: p.x - 30, y: p.y - 20, width: 20, height: 20,
                        vx: -4, vy: -wConfig.speed * 0.8 
                    });
                     state.bullets.push({ 
                        ...baseProps, id: Date.now()+4, x: p.x + 30, y: p.y - 20, width: 20, height: 20,
                        vx: 4, vy: -wConfig.speed * 0.8 
                    });
                }

            // --- 普通射击逻辑 ---
            } else {
                state.bullets.push({ ...baseProps, id: Date.now(), x: p.x, y: p.y - 30, vx: 0, vy: -wConfig.speed });
                if (p.weaponLevel >= 2) {
                    state.bullets.push({ ...baseProps, id: Date.now()+1, x: p.x-10, y: p.y-20, width: 4, height: 14, vx: -3, vy: -wConfig.speed * 0.9 });
                    state.bullets.push({ ...baseProps, id: Date.now()+2, x: p.x+10, y: p.y-20, width: 4, height: 14, vx: 3, vy: -wConfig.speed * 0.9 });
                }
                if (p.weaponLevel >= 3) {
                    state.bullets.push({ ...baseProps, id: Date.now()+3, x: p.x-20, y: p.y-10, width: 4, height: 14, vx: -5, vy: -wConfig.speed * 0.8 });
                    state.bullets.push({ ...baseProps, id: Date.now()+4, x: p.x+20, y: p.y-10, width: 4, height: 14, vx: 5, vy: -wConfig.speed * 0.8 });
                }
            }
        }

        // 4. Boss 触发逻辑
        if (state.score >= state.nextBossScore && state.phase === 'WAVE') {
            state.phase = 'BOSS_WARNING';
            state.enemies.forEach(e => { e.vy = -5; e.shootTimer = undefined; });
            setTimeout(() => {
                if (!isPlaying) return;
                state.phase = 'BOSS_FIGHT';
                const bossHp = 800 + (state.difficultyLevel * 400); 
                state.boss = {
                    id: Date.now(), x: width/2, y: -100, width: 140, height: 100,
                    vx: 2, vy: 2, hp: bossHp, maxHp: bossHp,
                    type: 'enemy', enemyType: 'BOSS',
                    shootTimer: 0, hitFlash: 0
                };
                playSound('wrong'); 
            }, 3000);
        }

        // 5. 敌人生成逻辑 (数值大幅调优：前期更简单)
        if (state.phase === 'WAVE') {
            state.enemySpawnTimer++;
            const spawnRate = Math.max(30, 70 - state.difficultyLevel * 5); 
            
            if (state.enemySpawnTimer > spawnRate) {
                const rand = Math.random();
                let eType: EnemyType = 'BASIC';
                let size = 35;
                // 基础HP大幅降低：10起步
                let hp = 10 + (state.difficultyLevel * 10); 
                // 速度降低：0.8起步
                let spdY = 0.8 + Math.random() * 1.0 + (state.difficultyLevel * 0.2);
                let spdX = (Math.random() - 0.5) * 1.5;
                let color = '#ef4444';
                let score = 100;

                const tankProb = Math.min(0.35, 0.05 + (state.difficultyLevel * 0.05));
                
                if (rand < tankProb) {
                    eType = 'TANK'; size = 55; 
                    // 坦克血量降低，前期更容易打
                    hp = 60 + (state.difficultyLevel * 30); 
                    spdY = 0.5 + (state.difficultyLevel * 0.1); 
                    color = '#1e293b'; 
                    score = 300;
                } else if (rand > 0.85) {
                    eType = 'SPEED'; size = 25; 
                    hp = 5 + (state.difficultyLevel * 5); 
                    spdY = 3.0 + (state.difficultyLevel * 0.5); 
                    color = '#eab308';
                    score = 150;
                }

                state.enemies.push({
                    id: Date.now(), x: Math.random() * (width - size - 20) + 10 + size/2, y: -50,
                    width: size, height: size, vx: spdX, vy: spdY,
                    hp, maxHp: hp, enemyType: eType,
                    shootTimer: Math.random() * 100, color, hitFlash: 0,
                    scoreValue: score
                });
                state.enemySpawnTimer = 0;
            }
        } else if (state.phase === 'BOSS_FIGHT' && state.boss) {
            const boss = state.boss;
            if (boss.y < 120) boss.y += 2;
            else {
                boss.x += boss.vx;
                if (boss.x < boss.width/2 + 10 || boss.x > width - boss.width/2 - 10) boss.vx *= -1;
            }

            boss.shootTimer = (boss.shootTimer || 0) + 1;
            const fireInterval = Math.max(30, 70 - state.difficultyLevel * 5);
            
            if (boss.shootTimer > fireInterval) {
                // 弹幕模式
                const mode = Math.floor(Math.random() * 3);
                if (mode === 0) { // 扇形 - 速度减慢 (7 -> 4)
                    for(let i=-3; i<=3; i++) {
                         state.enemyBullets.push({
                            id: Date.now()+i, x: boss.x, y: boss.y + 50, width: 12, height: 12,
                            vx: i * 1.5, vy: 4, type: 'enemyBullet' 
                        });
                    }
                } else if (mode === 1) { // 狙击 - 速度减慢 (9 -> 5)
                     const angle = Math.atan2(p.y - boss.y, p.x - boss.x);
                     state.enemyBullets.push({
                        id: Date.now(), x: boss.x, y: boss.y+40, width: 20, height: 20,
                        vx: Math.cos(angle)*5, vy: Math.sin(angle)*5, type: 'enemyBullet', color: '#c026d3'
                    });
                } else { // 散弹 - 速度减慢
                     for(let i=0; i<5; i++) {
                         state.enemyBullets.push({
                            id: Date.now()+i, x: boss.x + (Math.random()-0.5)*80, y: boss.y + 40, width: 10, height: 10,
                            vx: (Math.random()-0.5)*3, vy: 3 + Math.random()*3, type: 'enemyBullet'
                        });
                     }
                }
                boss.shootTimer = 0;
            }
        }

        // 6. 碰撞与更新
        
        // --- 玩家子弹 ---
        for (let i = state.bullets.length - 1; i >= 0; i--) {
            const b = state.bullets[i];
            b.x += b.vx; b.y += b.vy;
            
            ctx.fillStyle = b.color || '#facc15';
            ctx.fillRect(b.x - b.width/2, b.y, b.width, b.height);

            if (b.y < -20) { state.bullets.splice(i, 1); continue; }

            // 穿透性武器处理：确保同一颗子弹不会对同一个实体造成多次伤害
            if (!b.hitEntityIds) b.hitEntityIds = [];

            let hit = false;
            const dmg = b.damage || 10;

            // 击中 Boss
            if (state.phase === 'BOSS_FIGHT' && state.boss) {
                const boss = state.boss;
                // 检查是否已经击中过BOSS
                if (!b.hitEntityIds.includes(boss.id)) {
                    if (Math.abs(b.x - boss.x) < boss.width/2 + 10 && Math.abs(b.y - boss.y) < boss.height/2 + 10) {
                        boss.hp = (boss.hp || 1) - dmg;
                        boss.hitFlash = 3; 
                        hit = true;
                        b.hitEntityIds.push(boss.id); // 记录命中

                        if (boss.hp <= 0) {
                            handleBossDeath(state);
                            onScore(1000 * state.difficultyLevel);
                        }
                    }
                }
            }

            // 击中敌人
            if (!hit) {
                for (let j = state.enemies.length - 1; j >= 0; j--) {
                    const e = state.enemies[j];
                    // 检查是否已经击中过该敌人
                    if (b.hitEntityIds.includes(e.id)) continue;

                    if (Math.abs(b.x - e.x) < e.width/2 + 5 && Math.abs(b.y - e.y) < e.height/2 + 5) {
                        e.hp = (e.hp || 1) - dmg;
                        e.hitFlash = 3;
                        hit = true;
                        b.hitEntityIds.push(e.id); // 记录命中
                        
                        state.particles.push({
                             x: b.x, y: b.y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, 
                             life: 5, color: '#fff', size: 2
                        });

                        if (e.hp <= 0) {
                            handleEnemyDeath(state, j);
                            state.enemies.splice(j, 1);
                        }
                        
                        // 普通子弹命中一个敌人后就消失，穿透性子弹则继续
                        if (p.weaponType === 'NORMAL') {
                            break;
                        }
                    }
                }
            }

            // 只有普通子弹会消失，激光和火焰穿透
            if (hit && p.weaponType === 'NORMAL') {
                state.bullets.splice(i, 1);
            }
        }

        // --- 敌方子弹 ---
        for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
            const b = state.enemyBullets[i];
            b.x += b.vx; b.y += b.vy;
            
            ctx.shadowBlur = 5; ctx.shadowColor = '#d946ef';
            ctx.fillStyle = b.color || '#e879f9';
            ctx.beginPath(); ctx.arc(b.x, b.y, b.width/2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(b.x, b.y, b.width/4, 0, Math.PI * 2); ctx.fill();

            if (b.y > height + 20) { state.enemyBullets.splice(i, 1); continue; }

            if (p.invincibleTimer <= 0 && p.shieldTimer <= 0) {
                if (Math.abs(b.x - p.x) < 20 && Math.abs(b.y - p.y) < 25) {
                    takeDamage();
                    state.enemyBullets.splice(i, 1);
                }
            }
        }

        // --- 敌人渲染与更新 ---
        for (let i = state.enemies.length - 1; i >= 0; i--) {
            const e = state.enemies[i];
            e.x += e.vx; e.y += e.vy;
            if (e.hitFlash && e.hitFlash > 0) e.hitFlash--;

            // 射击
            if (e.enemyType !== 'SPEED' && e.shootTimer !== undefined) {
                e.shootTimer++;
                const threshold = e.enemyType === 'TANK' ? 100 : 150;
                if (e.shootTimer > threshold) {
                     const bulletSpd = 3 + (state.difficultyLevel * 0.5); // 降低基础速度
                     state.enemyBullets.push({
                        id: Date.now() + Math.random(), x: e.x, y: e.y + 10, width: 10, height: 10,
                        vx: 0, vy: bulletSpd, type: 'enemyBullet'
                    });
                    if (e.enemyType === 'TANK') { 
                         state.enemyBullets.push({ id: Date.now()+1, x: e.x, y: e.y, width: 8, height: 8, vx: 2, vy: bulletSpd*0.8, type: 'enemyBullet' });
                         state.enemyBullets.push({ id: Date.now()+2, x: e.x, y: e.y, width: 8, height: 8, vx: -2, vy: bulletSpd*0.8, type: 'enemyBullet' });
                    }
                    e.shootTimer = 0;
                }
            }
            
            drawEnemy(ctx, e);

            // 撞击
            if (p.invincibleTimer <= 0 && p.shieldTimer <= 0) {
                 if (Math.abs(e.x - p.x) < (p.width + e.width)/2.5 && Math.abs(e.y - p.y) < (p.height + e.height)/2.5) {
                     takeDamage();
                     e.hp = 0; 
                     handleEnemyDeath(state, i);
                     state.enemies.splice(i, 1);
                     continue;
                 }
            }
            if (e.y > height + 50) state.enemies.splice(i, 1);
        }

        // Boss 渲染
        if (state.phase === 'BOSS_FIGHT' && state.boss) {
            if (state.boss.hitFlash && state.boss.hitFlash > 0) state.boss.hitFlash--;
            drawBoss(ctx, state.boss);
        }

        // --- Buff ---
        for (let i = state.buffs.length - 1; i >= 0; i--) {
            const buff = state.buffs[i];
            // 如果是掉落的buff，给它一点重力感或漂浮感
            if (buff.isDropped) {
                buff.y += buff.vy;
                buff.vx *= 0.95; // 阻力
                if (buff.y > height - 100) buff.vy *= 0.8; // 底部减速
            } else {
                buff.y += buff.vy;
            }

            drawBuff(ctx, buff);
            
            if (Math.hypot(buff.x - p.x, buff.y - p.y) < 40) {
                applyBuff(buff.buffType as BuffType);
                playSound('correct');
                state.buffs.splice(i, 1);
                state.particles.push({ x: p.x, y: p.y - 30, vx: 0, vy: -1, life: 40, color: '#4ade80', size: 0, text: 'UP!' });
            } else if (buff.y > height + 20) {
                state.buffs.splice(i, 1);
            }
        }

        drawPlayer(ctx, p, frameCountRef.current);

        // 粒子
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const pt = state.particles[i];
            pt.x += pt.vx; pt.y += pt.vy; pt.life--;
            ctx.globalAlpha = Math.max(0, pt.life / 30);
            if (pt.text) {
                ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = pt.color; ctx.textAlign = 'center';
                ctx.lineWidth = 3; ctx.strokeStyle = 'black'; ctx.strokeText(pt.text, pt.x, pt.y);
                ctx.fillText(pt.text, pt.x, pt.y);
            } else {
                ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            if (pt.life <= 0) state.particles.splice(i, 1);
        }

        // UI 绘制
        ctx.restore();
        drawHUD(ctx, width, height, state);

        if (state.redFlash > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${state.redFlash * 0.4})`; // 降低最大透明度，避免全盲
            ctx.fillRect(0, 0, width, height);
            state.redFlash -= 0.04;
        }

        if (state.phase === 'BOSS_WARNING') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, height/2 - 60, width, 120);
            ctx.fillStyle = '#ef4444'; ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            if (Math.floor(frameCountRef.current / 10) % 2 === 0) ctx.fillText("⚠️ WARNING ⚠️", width/2, height/2);
        }

        if (state.player.hp <= 0) onGameOver();

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, onScore, onGameOver]);


    // --- 逻辑处理函数 ---

    const handleBossDeath = (state: any) => {
        const boss = state.boss;
        state.score += 1000;
        state.phase = 'WAVE';
        state.boss = null;
        state.nextBossScore += 3000; // 后续BOSS间隔也增加
        state.difficultyLevel += 1; 
        state.screenShake = 30;
        
        for(let k=0; k<60; k++) state.particles.push({
            x: boss.x, y: boss.y, vx: (Math.random()-0.5)*25, vy: (Math.random()-0.5)*25,
            life: 80, color: '#ef4444', size: 6
        });
        
        // Boss 必掉多个强力道具
        state.buffs.push({ id: Date.now(), x: boss.x - 40, y: boss.y, width: 30, height: 30, vx: -1, vy: 2, buffType: 'WEAPON_FLAME' });
        state.buffs.push({ id: Date.now()+1, x: boss.x + 40, y: boss.y, width: 30, height: 30, vx: 1, vy: 2, buffType: 'SHIELD' });
        state.buffs.push({ id: Date.now()+2, x: boss.x, y: boss.y, width: 30, height: 30, vx: 0, vy: 2, buffType: 'HEAL' });
    };

    const handleEnemyDeath = (state: any, index: number) => {
        const e = state.enemies[index];
        const pts = e.scoreValue || 10;
        state.score += pts;
        onScore(pts);
        
        // 掉落逻辑
        let dropChance = e.enemyType === 'TANK' ? 0.6 : 0.15;

        // 修改点：BOSS战前夕 (最后800分) 掉率大幅提升，作为补给阶段
        if (state.nextBossScore - state.score < 800 && state.nextBossScore - state.score > 0) {
            dropChance = 0.8; // 补给阶段几乎必掉
        }

        if (Math.random() < dropChance) {
            const r = Math.random();
            let type: BuffType = 'HEAL';
            if (r < 0.3) type = 'WEAPON_SPREAD';
            else if (r < 0.5) type = 'WEAPON_LASER';
            else if (r < 0.7) type = 'WEAPON_FLAME'; // 火焰比较稀有
            else if (r < 0.85) type = 'SHIELD';
            
            state.buffs.push({ id: Date.now(), x: e.x, y: e.y, width: 30, height: 30, vx: 0, vy: 2, buffType: type });
        }

        for(let k=0; k<15; k++) state.particles.push({
            x: e.x, y: e.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, 
            life: 30, color: e.color || '#ef4444', size: 3
        });
    };

    const takeDamage = () => {
        const state = gameState.current;
        const p = state.player;
        
        // 掉落当前武器作为Buff (如果不是默认武器或有等级)
        if (p.weaponType !== 'NORMAL' || p.weaponLevel > 1) {
            let dropType: BuffType = 'WEAPON_SPREAD';
            if (p.weaponType === 'LASER') dropType = 'WEAPON_LASER';
            else if (p.weaponType === 'FLAME') dropType = 'WEAPON_FLAME';
            else if (p.weaponLevel > 1) dropType = 'WEAPON_SPREAD';

            // 掉落在玩家当前位置，稍微往上弹一点
            state.buffs.push({ 
                id: Date.now(), x: p.x, y: p.y - 50, 
                width: 30, height: 30, 
                vx: (Math.random()-0.5) * 4, vy: -2, // 向上弹
                buffType: dropType,
                isDropped: true
            });
        }

        p.hp--;
        p.invincibleTimer = 180; // 修改为3秒 (60fps * 3 = 180帧)
        p.hitFlashTimer = 15;
        p.weaponType = 'NORMAL';
        p.weaponLevel = 1; // 惩罚：重置回初始状态，但道具已掉落可捡回
        
        playSound('wrong');
        state.screenShake = 25;
        state.redFlash = 1.0;
        state.particles.push({ x: p.x, y: p.y - 40, vx: 0, vy: -1.5, life: 50, color: '#ef4444', size: 0, text: '-1 HP' });
    };

    const applyBuff = (type: BuffType) => {
        const p = gameState.current.player;
        if (type === 'HEAL') {
            p.hp = Math.min(5, p.hp! + 1);
        } else if (type === 'SHIELD') {
            p.shieldTimer = 400;
        } else {
            // 武器逻辑：相同类型升级，不同类型切换
            let targetType: WeaponType = 'NORMAL';
            if (type === 'WEAPON_LASER') targetType = 'LASER';
            else if (type === 'WEAPON_FLAME') targetType = 'FLAME';
            else if (type === 'WEAPON_SPREAD') targetType = 'NORMAL';

            if (p.weaponType === targetType) {
                // 如果是SPREAD类型（NORMAL且Level>1），需要特殊处理
                if (targetType === 'NORMAL' && p.weaponLevel === 1 && type === 'WEAPON_SPREAD') {
                    p.weaponLevel = 2; // 第一次吃散弹变Lv2
                } else {
                    p.weaponLevel = Math.min(3, p.weaponLevel + 1);
                }
            } else {
                p.weaponType = targetType;
                p.weaponLevel = targetType === 'NORMAL' && type === 'WEAPON_SPREAD' ? 2 : 1;
            }
        }
    };

    // --- 绘制辅助函数 ---

    const drawBuff = (ctx: CanvasRenderingContext2D, buff: Entity) => {
        ctx.save(); ctx.translate(buff.x, buff.y);
        ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
        
        // 掉落的Buff加个光圈区别
        if (buff.isDropped) {
            ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI*2); ctx.stroke();
        }

        ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI*2);
        
        let color = '#fff';
        let icon = '?';
        if (buff.buffType === 'HEAL') { icon = '❤️'; color = '#fee2e2'; }
        if (buff.buffType === 'SHIELD') { icon = '🛡️'; color = '#dbeafe'; }
        if (buff.buffType === 'WEAPON_SPREAD') { icon = 'M'; color = '#fef9c3'; }
        if (buff.buffType === 'WEAPON_LASER') { icon = 'L'; color = '#cffafe'; }
        if (buff.buffType === 'WEAPON_FLAME') { icon = 'F'; color = '#ffedd5'; }

        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000'; ctx.font = 'bold 20px sans-serif'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(icon, 0, 2);
        ctx.restore();
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D, p: Entity & any, frame: number) => {
        ctx.save(); ctx.translate(p.x, p.y);
        
        if (p.shieldTimer > 0) {
            ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.6 + Math.sin(frame * 0.2)*0.4})`;
            ctx.lineWidth = 4; ctx.stroke();
            ctx.fillStyle = `rgba(59, 130, 246, 0.1)`; ctx.fill();
        } 
        
        if (p.invincibleTimer > 0 && Math.floor(frame / 4) % 2 === 0) ctx.globalAlpha = 0.4;

        let mainColor = '#e2e8f0'; let wingColor = '#94a3b8';
        if (p.weaponType === 'LASER') { mainColor = '#cffafe'; wingColor = '#06b6d4'; }
        if (p.weaponType === 'FLAME') { mainColor = '#ffedd5'; wingColor = '#f97316'; }
        if (p.hitFlashTimer > 0) { mainColor = '#ef4444'; wingColor = '#b91c1c'; }

        ctx.fillStyle = mainColor;
        ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(12, 12); ctx.lineTo(0, 18); ctx.lineTo(-12, 12); ctx.fill();

        ctx.fillStyle = wingColor;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(30, 18); ctx.lineTo(10, 24); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, 18); ctx.lineTo(-10, 24); ctx.fill();

        // 武器等级标识
        if (p.weaponLevel >= 2) {
             ctx.fillStyle = '#facc15';
             ctx.beginPath(); ctx.arc(-15, 0, 3, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(15, 0, 3, 0, Math.PI*2); ctx.fill();
        }
        if (p.weaponLevel >= 3) {
             ctx.fillStyle = '#facc15';
             ctx.beginPath(); ctx.arc(0, -10, 4, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
    };

    const drawEnemy = (ctx: CanvasRenderingContext2D, e: Entity) => {
        ctx.save(); ctx.translate(e.x, e.y);
        
        // 受击闪白
        if (e.hitFlash && e.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = e.color || '#ef4444';
        }

        if (e.enemyType === 'SPEED') {
            ctx.beginPath(); ctx.moveTo(0, e.height/2); ctx.lineTo(e.width/2, -e.height/2); ctx.lineTo(-e.width/2, -e.height/2); ctx.fill();
        } else if (e.enemyType === 'TANK') {
            // 坦克显示血量条
            ctx.fillRect(-e.width/2, -e.height/2, e.width, e.height);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(-e.width/2, -e.height/2, e.width, e.height);
            
            // 血条
            const pct = (e.hp || 0) / (e.maxHp || 1);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(-e.width/2, -e.height/2 - 10, e.width * pct, 5);
        } else {
            ctx.beginPath(); ctx.moveTo(0, e.height/2); ctx.lineTo(e.width/2, -e.height/2); ctx.lineTo(0, -e.height/4); ctx.lineTo(-e.width/2, -e.height/2); ctx.fill();
        }
        ctx.restore();
    };

    const drawBoss = (ctx: CanvasRenderingContext2D, boss: Entity) => {
        ctx.save(); ctx.translate(boss.x, boss.y);
        ctx.fillStyle = boss.hitFlash && boss.hitFlash > 0 ? '#ffffff' : '#4c1d95';
        
        ctx.beginPath(); ctx.moveTo(0, boss.height/2); ctx.lineTo(boss.width/2, -boss.height/4);
        ctx.lineTo(boss.width/3, -boss.height/2); ctx.lineTo(-boss.width/3, -boss.height/2);
        ctx.lineTo(-boss.width/2, -boss.height/4); ctx.closePath(); ctx.fill();
        
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
        ctx.restore();
    };

    const drawHUD = (ctx: CanvasRenderingContext2D, w: number, h: number, state: any) => {
        // --- 玩家生命值仪表盘 (全新重构) ---
        const hp = state.player.hp || 0;
        const maxHp = state.player.maxHp || 5;

        // 1. 底板 (坐标下移到80，避开Header)
        const panelW = 200;
        const panelH = 70;
        const startY = 80; // Adjusted from 10 to 80

        ctx.fillStyle = '#1e293b'; // 深蓝灰背景
        ctx.beginPath(); ctx.roundRect(10, startY, panelW, panelH, 12); ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 3; ctx.stroke(); // 边框

        // 2. 文字标签
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`PLAYER HP  ${hp}/${maxHp}`, 25, startY + 10);

        // 3. 心形图标 (大而清晰)
        for(let i=0; i<maxHp; i++) {
            const hx = 35 + i * 32;
            const hy = startY + 45;
            
            ctx.font = '28px sans-serif'; 
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            
            if (i < hp) {
                // 实心红心 + 白色描边
                ctx.fillStyle = '#ef4444';
                ctx.fillText('❤️', hx, hy);
            } else {
                // 空心/灰色心
                ctx.fillStyle = '#334155';
                ctx.fillText('🖤', hx, hy);
            }
        }

        // --- Boss 血条 (顶部居中，稍微下移一点避免太贴边) ---
        if (state.phase === 'BOSS_FIGHT' && state.boss) {
            const boss = state.boss;
            const barW = w * 0.6;
            const barH = 20;
            const barX = (w - barW) / 2;
            const barY = 90; // 下移以避免和头部冲突，如果头部是浮动的
            
            // 背景
            ctx.fillStyle = '#000';
            ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
            
            // 血条本体
            const pct = Math.max(0, (boss.hp || 0) / (boss.maxHp || 1));
            const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            grad.addColorStop(0, '#ef4444'); grad.addColorStop(1, '#7f1d1d');
            
            ctx.fillStyle = grad;
            ctx.fillRect(barX, barY, barW * pct, barH);
            
            // 边框和文字
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barW, barH);
            
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
            ctx.fillText(`BOSS`, w/2, barY + barH/2);
            ctx.shadowBlur = 0;
        }

        // --- 武器状态提示 (右上角，下移) ---
        const weaponName = state.player.weaponType === 'NORMAL' && state.player.weaponLevel > 1 ? 'SCATTER' : state.player.weaponType;
        const levelText = state.player.weaponLevel > 1 ? `LV.${state.player.weaponLevel}` : '';
        
        if (weaponName !== 'NORMAL' || levelText) {
             ctx.fillStyle = '#1e293b'; 
             ctx.beginPath(); ctx.roundRect(w - 140, startY, 130, 30, 8); ctx.fill();
             ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px sans-serif';
             ctx.textAlign = 'center';
             ctx.fillText(`${weaponName} ${levelText}`, w - 75, startY + 15);
        }
    };

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    return (
        <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
            className="block touch-none cursor-crosshair" 
        />
    );
};
