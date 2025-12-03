
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound } from '../../utils/gameUtils';
import { ShoppingCart, ArrowRight } from 'lucide-react';

// --- 类型定义 ---
type GamePhase = 'PLAYING' | 'SHOP' | 'GAME_OVER';
type ItemType = 'GOLD_SMALL' | 'GOLD_BIG' | 'ROCK' | 'DIAMOND' | 'GIFT' | 'TNT' | 'RAT';

interface MineItem {
    id: number;
    x: number;
    y: number;
    type: ItemType;
    radius: number;
    value: number; // 正数为奖励，负数为惩罚
    weight: number; // 影响拉取速度
    label: string;
    
    // 动态属性 (老鼠)
    vx?: number;
    ratState?: 'MOVING' | 'WAITING';
    waitTimer?: number;
}

interface Particle {
    x: number; y: number; vx: number; vy: number; life: number; color: string; text?: string;
}

// 商店物品
const SHOP_ITEMS = [
    { id: 'dynamite', name: '炸弹遥控', price: 200, icon: '🧨', desc: '拉取中点击炸毁物品' },
    { id: 'strength', name: '大力药水', price: 300, icon: '💪', desc: '下关拉取速度+60%' },
    { id: 'clock',    name: '闹钟',    price: 150, icon: '⏰', desc: '下关时间+15秒' },
];

export const GoldMinerGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const lastTimeRef = useRef<number>(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    // 标记初始化状态，防止暂停恢复时重置
    const initializedRef = useRef(false);
    // 记录上一次使用的画布尺寸，用于在尺寸变化（尤其是手机横竖屏切换）时重新布局物品
    const lastSizeRef = useRef<{ width: number; height: number }>({ width, height });
    // 标记是否已经触发自动结算，避免重复触发
    const autoSettledRef = useRef(false);

    // 游戏逻辑状态 (Ref，不触发重渲染)
    const gameRef = useRef({
        minerState: 'IDLE' as 'IDLE' | 'SHOOTING' | 'PULLING' | 'RETRACTING_EMPTY',
        angle: 0,
        angleSpeed: 0.015,
        angleDirection: 1,
        
        originX: width / 2,
        originY: 150,
        
        hookX: width / 2,
        hookY: 150,
        hookLength: 60,
        
        items: [] as MineItem[],
        caughtItem: null as MineItem | null,
        particles: [] as Particle[],
        
        screenShake: 0,
        buffStrengthActive: false, // 逻辑标记
    });

    // UI 状态 (触发重渲染)
    const [phase, setPhase] = useState<GamePhase>('PLAYING');
    const [level, setLevel] = useState(1);
    const [money, setMoney] = useState(0);
    const [targetMoney, setTargetMoney] = useState(200);
    const [timeLeft, setTimeLeft] = useState(60);
    const [inventory, setInventory] = useState({ dynamite: 1, strength: 0, clock: 0 });
    
    // 新增：用于 UI 显示当前激活的 Buff
    const [activeBuffs, setActiveBuffs] = useState({ strength: false });

    // 初始化关卡物品
    const initLevelItems = useCallback((levelNum: number) => {
        const items: MineItem[] = [];
        // 动态计算 originY，适配横屏和竖屏
        const isLandscape = width > height;
        const originY = isLandscape ? Math.max(100, height * 0.15) : 150;
        gameRef.current.originY = originY;
        gameRef.current.originX = width / 2;
        const w = width;
        const h = height;

        // 难度配置
        const rockCount = 3 + Math.floor(levelNum * 0.5); 
        const goldCount = Math.max(2, 6 - Math.floor(levelNum * 0.2)); 
        const tntCount = Math.min(4, 1 + Math.floor(levelNum / 2)); 
        const ratCount = Math.min(5, 1 + Math.floor((levelNum + 1) / 2)); 

        const createItem = (type: ItemType): MineItem => {
            let itemW = 1.0; let r = 20; let val = 0; let lbl = '';
            
            switch(type) {
                case 'GOLD_SMALL': r=15; itemW=2.0; val=50;  lbl='🌟'; break; 
                case 'GOLD_BIG':   r=30; itemW=6.0; val=150; lbl='💰'; break; 
                case 'ROCK':       r=26; itemW=8.0; val=20;  lbl='';   break; 
                case 'DIAMOND':    r=12; itemW=1.0; val=300; lbl='💎'; break;
                case 'GIFT':       r=22; itemW=2.5; val=0;   lbl='🎁'; break;
                case 'TNT':        r=24; itemW=1.0; val=-200; lbl='💣'; break; 
                case 'RAT':        r=24; itemW=3.0; val=-300; lbl='🐀'; break; 
            }

            // 随机位置 (避开顶部和底部，适配横屏)
            let x = 0, y = 0, valid = false, attempts = 0;
            const minY = originY + 80;
            const maxY = h - 100; // 底部留出空间
            const availableHeight = Math.max(100, maxY - minY); // 确保有足够空间
            
            while(!valid && attempts < 50) {
                x = Math.random() * (w - 100) + 50;
                y = minY + Math.random() * availableHeight;
                // 确保不超出边界
                if (y < minY || y > maxY) {
                    attempts++;
                    continue;
                }
                const overlap = items.some(it => Math.hypot(it.x - x, it.y - y) < it.radius + r + 20);
                if (!overlap) valid = true;
                attempts++;
            }

            const item: MineItem = { 
                id: Math.random(), x, y, type, radius: r, value: val, weight: itemW, label: lbl 
            };

            if (type === 'RAT') {
                const dir = Math.random() > 0.5 ? 1 : -1;
                item.vx = (1.5 + Math.random()) * dir;
                item.ratState = 'MOVING';
                item.waitTimer = 0;
            }
            return item;
        };

        for(let i=0; i<goldCount; i++) items.push(createItem(i%3===0 ? 'GOLD_BIG' : 'GOLD_SMALL'));
        for(let i=0; i<rockCount; i++) items.push(createItem('ROCK'));
        if (Math.random() > 0.6) items.push(createItem('DIAMOND'));
        items.push(createItem('GIFT'));
        for(let i=0; i<tntCount; i++) items.push(createItem('TNT'));
        for(let i=0; i<ratCount; i++) items.push(createItem('RAT'));

        gameRef.current.items = items;
        gameRef.current.minerState = 'IDLE';
        gameRef.current.hookLength = 60;
        gameRef.current.angle = 0;
        
    }, [width, height]);

    // 当尺寸变化时，更新 originX/originY，确保位置正确
    useEffect(() => {
        if (width > 0 && height > 0) {
            const isLandscape = width > height;
            gameRef.current.originY = isLandscape ? Math.max(100, height * 0.15) : 150;
            gameRef.current.originX = width / 2;
        }
    }, [width, height]);

    // 开始游戏 (仅首次运行) - 确保 width/height 有效时才初始化
    useEffect(() => {
        if (isPlaying && !initializedRef.current && width > 0 && height > 0) {
            initializedRef.current = true;
            setMoney(0);
            setLevel(1);
            setTargetMoney(150);
            setInventory({ dynamite: 1, strength: 0, clock: 0 });
            gameRef.current.buffStrengthActive = false;
            setActiveBuffs({ strength: false });
            // 延迟初始化，确保尺寸已正确设置（多次延迟确保布局完全稳定）
            // 第一次延迟：等待基本布局
            setTimeout(() => {
                // 第二次延迟：确保尺寸完全稳定
                setTimeout(() => {
                    // 重新获取最新的 width/height，确保使用正确的尺寸
                    const currentWidth = width;
                    const currentHeight = height;
                    if (currentWidth > 0 && currentHeight > 0) {
                        // 确保 originX/originY 在初始化前已正确设置
                        const isLandscape = currentWidth > currentHeight;
                        gameRef.current.originY = isLandscape ? Math.max(100, currentHeight * 0.15) : 150;
                        gameRef.current.originX = currentWidth / 2;
                        startLevel(1, 150, 0);
                    }
                }, 300); // 第二次延迟 300ms
            }, 200); // 第一次延迟 200ms，总共 500ms
        }
    }, [isPlaying, width, height]); // 添加 width/height 依赖，确保尺寸正确
    
    // 当画布尺寸在游戏过程中发生变化（例如手机横竖屏切换或进入/退出全屏）时，
    // 重新根据当前关卡和最新尺寸布局地下物品，避免都堆在左下角或被遮挡
    useEffect(() => {
        if (!initializedRef.current || width <= 0 || height <= 0) {
            lastSizeRef.current = { width, height };
            return;
        }

        const prev = lastSizeRef.current;
        const sizeChanged = prev.width !== width || prev.height !== height;

        if (sizeChanged) {
            lastSizeRef.current = { width, height };
            // 只在进行中的关卡里重新布局，保留当前金钱、时间等状态不变
            if (phase === 'PLAYING') {
                initLevelItems(level);
            }
            return;
        }

        lastSizeRef.current = { width, height };
    }, [width, height, phase, level, initLevelItems]);
    
    // 关键修复：监听外部 isPlaying 变化
    // 如果外部从暂停恢复为 isPlaying=true，且当前并没有结束，则确保 phase 状态正确
    useEffect(() => {
        if (isPlaying && phase === 'GAME_OVER' && initializedRef.current) {
            // 如果是在 GamePlayer 的“继续游戏”逻辑中（保留状态继续），
            // 这里我们无法区分是“再来一局”还是“继续”。
            // 但如果是“继续”，通常不应该卡在 GAME_OVER。
            // 简单的恢复逻辑：如果时间耗尽导致 GAME_OVER，给予少量时间让玩家反应或操作
            // 但更合理的逻辑是，点击GamePlayer的“继续”只是恢复了 isPlaying，
            // 游戏内部如果已经 GAME_OVER，应该由玩家点击“下一关”或重新开始。
            // 针对用户反馈“无法点击”，可能是 isPlaying 恢复了但内部锁死。
            // 这里我们不做强行重置，而是依赖 phase 状态正确响应。
        }
    }, [isPlaying, phase]);

    const startLevel = (lvl: number, target: number, timeBonus: number) => {
        setPhase('PLAYING');
        setTimeLeft(60 + timeBonus);
        autoSettledRef.current = false; // 重置自动结算标记
        // 确保 width/height 有效时才初始化
        if (width > 0 && height > 0) {
            initLevelItems(lvl);
        }
    };

    // 倒计时
    useEffect(() => {
        if (phase !== 'PLAYING' || !isPlaying) return; // 暂停时不倒计时
        const t = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(t);
                    if (money >= targetMoney) {
                        setPhase('SHOP');
                        playSound('correct');
                    } else {
                        setPhase('GAME_OVER');
                        playSound('wrong');
                        onGameOver();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [phase, money, targetMoney, onGameOver, isPlaying]);

    // 使用雷管
    const useDynamite = () => {
        const state = gameRef.current;
        if (state.minerState === 'PULLING' && state.caughtItem && inventory.dynamite > 0) {
            if (state.caughtItem.type === 'TNT' || state.caughtItem.type === 'RAT') return;

            createExplosion(state.hookX, state.hookY, '#fff');
            state.caughtItem = null;
            state.minerState = 'RETRACTING_EMPTY'; 
            setInventory(prev => ({ ...prev, dynamite: prev.dynamite - 1 }));
            playSound('shoot');
        }
    };

    const createExplosion = (x: number, y: number, color: string) => {
        const state = gameRef.current;
        state.screenShake = 15;
        for(let i=0; i<25; i++) {
            state.particles.push({
                x, y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15,
                life: 45, color: color
            });
        }
    };

    // 购买
    const buyItem = (id: string, price: number) => {
        if (money >= price) {
            setMoney(m => m - price);
            setInventory(prev => ({ ...prev, [id]: (prev as any)[id] + 1 }));
            playSound('correct');
        } else {
            playSound('wrong');
        }
    };

    // 点击发射
    const handleTrigger = () => {
        if (phase !== 'PLAYING' || !isPlaying) return;
        if (gameRef.current.minerState === 'IDLE') {
            gameRef.current.minerState = 'SHOOTING';
            playSound('shoot');
        }
    };

    // 动画循环
    const animate = useCallback((currentTime: number = performance.now()) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        const state = gameRef.current;
        // 确保使用最新的 originX/originY，如果未初始化则使用当前尺寸计算
        let originX = state.originX;
        let originY = state.originY;
        if (!originX || originX <= 0 || !originY || originY <= 0) {
            // 如果未初始化，使用当前尺寸计算
            const isLandscape = width > height;
            originY = isLandscape ? Math.max(100, height * 0.15) : 150;
            originX = width / 2;
            state.originX = originX;
            state.originY = originY;
        }

        // 计算时间缩放 (基于 delta time，以 60fps 为基准)
        const targetFPS = 60;
        const targetFrameTime = 1000 / targetFPS; // ~16.67ms
        const lastTime = lastTimeRef.current;
        // 计算 delta time，如果是第一次调用或时间差过大（可能是暂停后恢复）则使用目标帧时间
        let deltaTime: number;
        if (!lastTime || lastTime <= 0) {
            deltaTime = targetFrameTime; // 第一次调用
        } else {
            const rawDelta = currentTime - lastTime;
            // 如果时间差过大（超过100ms，可能是暂停后恢复或标签页切换），使用目标帧时间
            deltaTime = rawDelta > 100 ? targetFrameTime : Math.min(rawDelta, 33.33);
        }
        lastTimeRef.current = currentTime;
        // 限制 timeScale 在合理范围内，避免速度过快或过慢
        const timeScale = Math.min(Math.max(deltaTime / targetFrameTime, 0.5), 2.0); // 限制在 0.5x 到 2.0x 之间

        // 0. 更新动态物品 (老鼠) - 使用时间缩放
        state.items.forEach(item => {
            if (item.type === 'RAT' && item.vx) {
                if (item.ratState === 'MOVING') {
                    item.x += item.vx * timeScale;
                    
                    const boundary = 100; 
                    if ((item.vx > 0 && item.x > width + boundary) || (item.vx < 0 && item.x < -boundary)) {
                        item.ratState = 'WAITING';
                        item.waitTimer = 60 + Math.random() * 120; 
                    }
                } else if (item.ratState === 'WAITING') {
                    if (item.waitTimer && item.waitTimer > 0) {
                        item.waitTimer -= timeScale; // 使用时间缩放
                    } else {
                        item.ratState = 'MOVING';
                        item.vx *= -1; 
                        item.y = originY + 80 + Math.random() * (height - originY - 130);
                    }
                }
            }
        });

        ctx.save();
        if (state.screenShake > 0) {
            const dx = (Math.random() - 0.5) * state.screenShake;
            const dy = (Math.random() - 0.5) * state.screenShake;
            ctx.translate(dx, dy);
            state.screenShake *= 0.9;
            if (state.screenShake < 0.5) state.screenShake = 0;
        }

        // 1. 渲染背景
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        // 2. 矿工逻辑 - 使用时间缩放
        const baseRetractSpeed = 2.5; // 进一步调慢回绳速度：从 3.5 降到 2.5
        const shootSpeed = 9;
        const strengthMult = state.buffStrengthActive ? 1.6 : 1.0;

        if (state.minerState === 'IDLE') {
            // 检查是否只剩下不能拉取的物品（TNT 和 RAT）
            const pullableItems = state.items.filter(item => 
                item.type !== 'TNT' && item.type !== 'RAT'
            );
            
            // 如果只剩下 TNT 和 RAT，自动结算游戏（只触发一次）
            if (pullableItems.length === 0 && state.items.length > 0 && phase === 'PLAYING' && !autoSettledRef.current) {
                autoSettledRef.current = true; // 标记已触发，避免重复
                // 延迟一下，让玩家看到当前状态
                setTimeout(() => {
                    if (money >= targetMoney) {
                        setPhase('SHOP');
                        playSound('correct');
                    } else {
                        setPhase('GAME_OVER');
                        playSound('wrong');
                        onGameOver();
                    }
                }, 500);
            }
            
            const maxAngle = Math.PI / 2.2;
            state.angle += state.angleSpeed * state.angleDirection * timeScale;
            if (state.angle > maxAngle || state.angle < -maxAngle) state.angleDirection *= -1;
            
            state.hookX = originX + Math.sin(state.angle) * 60;
            state.hookY = originY + Math.cos(state.angle) * 60;
        
        } else if (state.minerState === 'SHOOTING') {
            state.hookLength += shootSpeed * strengthMult * timeScale;
            state.hookX = originX + Math.sin(state.angle) * state.hookLength;
            state.hookY = originY + Math.cos(state.angle) * state.hookLength;

            if (state.hookX < 0 || state.hookX > width || state.hookY > height) {
                state.minerState = 'RETRACTING_EMPTY';
                playSound('wrong');
            }

            for (let i = 0; i < state.items.length; i++) {
                const item = state.items[i];
                if (item.type === 'RAT' && item.ratState === 'WAITING') continue;

                if (Math.hypot(state.hookX - item.x, state.hookY - item.y) < item.radius + 15) {
                    state.items.splice(i, 1);
                    
                    if (item.type === 'TNT' || item.type === 'RAT') {
                        createExplosion(item.x, item.y, '#ef4444');
                        playSound('wrong');
                        setMoney(m => m + item.value); 
                        state.particles.push({ 
                            x: originX, y: originY + 50, vx:0, vy:-1, life: 60, 
                            color: '#ef4444', text: `${item.value}` 
                        });
                        state.minerState = 'RETRACTING_EMPTY'; 
                    } else {
                        state.caughtItem = item;
                        state.minerState = 'PULLING';
                        playSound('shoot');
                    }
                    break;
                }
            }

        } else if (state.minerState === 'RETRACTING_EMPTY') {
            state.hookLength -= shootSpeed * 1.5 * timeScale;
            if (state.hookLength <= 60) {
                state.hookLength = 60;
                state.minerState = 'IDLE';
            }
            state.hookX = originX + Math.sin(state.angle) * state.hookLength;
            state.hookY = originY + Math.cos(state.angle) * state.hookLength;

        } else if (state.minerState === 'PULLING') {
            let speed = baseRetractSpeed * strengthMult;
            if (state.caughtItem) {
                const w = state.buffStrengthActive ? Math.max(1, state.caughtItem.weight * 0.4) : state.caughtItem.weight;
                speed = (baseRetractSpeed * 1.5) / w; // 进一步调慢：从 2.0 降到 1.5 
            }
            
            state.hookLength -= speed * timeScale;
            if (state.caughtItem) {
                state.caughtItem.x = originX + Math.sin(state.angle) * state.hookLength;
                state.caughtItem.y = originY + Math.cos(state.angle) * state.hookLength;
            }

            if (state.hookLength <= 60) {
                state.hookLength = 60;
                state.minerState = 'IDLE';
                if (state.caughtItem) {
                    let val = state.caughtItem.value;
                    let txt = `+$${val}`;
                    if (state.caughtItem.type === 'GIFT') {
                        val = Math.random() > 0.7 ? 250 : 50; 
                        txt = `+$${val}`;
                    }
                    setMoney(m => m + val);
                    state.particles.push({ x: originX, y: originY+40, vx: 0, vy: -1.5, life: 60, color: '#fbbf24', text: txt });
                    playSound('correct');
                    state.caughtItem = null;
                }
            } else {
                state.hookX = originX + Math.sin(state.angle) * state.hookLength;
                state.hookY = originY + Math.cos(state.angle) * state.hookLength;
            }
        }

        // 3. 绘制
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(state.hookX, state.hookY); ctx.stroke();

        ctx.save();
        ctx.translate(state.hookX, state.hookY);
        ctx.rotate(-state.angle);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(6, -5); ctx.lineTo(0, 10); ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(-8, 0, 8, 0, Math.PI, false); ctx.stroke();
        ctx.beginPath(); ctx.arc(8, 0, 8, 0, Math.PI, false); ctx.stroke();
        ctx.restore();

        ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.textBaseline='middle';
        ctx.fillText(state.caughtItem ? '😖' : '😃', originX, originY - 30);

        const drawItem = (item: MineItem) => {
            if (item.type === 'RAT' && item.ratState === 'WAITING') return;

            ctx.save(); ctx.translate(item.x, item.y);
            ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3;

            if (item.type === 'ROCK') {
                ctx.fillStyle = '#64748b'; 
                ctx.beginPath();
                ctx.moveTo(-item.radius, 0);
                ctx.lineTo(-item.radius*0.7, -item.radius*0.8);
                ctx.lineTo(item.radius*0.6, -item.radius*0.9);
                ctx.lineTo(item.radius, 0);
                ctx.lineTo(item.radius*0.5, item.radius*0.8);
                ctx.lineTo(-item.radius*0.6, item.radius*0.7);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(5, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(8, 10); ctx.stroke();
            } else if (item.type === 'RAT') {
                if ((item.vx || 0) < 0) ctx.scale(-1, 1);
                ctx.font = `${item.radius * 1.5}px serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.shadowColor='transparent';
                ctx.fillText(item.label, 0, 0);
                ctx.font = `${item.radius * 0.8}px serif`;
                ctx.fillText('💣', -5, -item.radius * 0.6);
            } else if (item.type === 'TNT') {
                ctx.font = `${item.radius * 2.0}px serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.shadowColor='transparent';
                ctx.fillText('💣', 0, 0);
            } else {
                ctx.font = `${item.radius * 2.0}px serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.shadowColor='transparent';
                ctx.fillText(item.label, 0, 0);
            }

            if (item.weight > 6 && item.type !== 'TNT' && item.type !== 'RAT') {
                 ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.scale(1,1); 
                 ctx.fillText('重', 0, -item.radius - 5);
            }
            ctx.restore();
        };

        state.items.forEach(drawItem);
        if (state.caughtItem) drawItem(state.caughtItem);

        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.x += p.vx * timeScale; p.y += p.vy * timeScale; p.life -= timeScale;
            ctx.globalAlpha = p.life / 60;
            if (p.text) {
                ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = p.color;
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeText(p.text, p.x, p.y);
                ctx.fillText(p.text, p.x, p.y);
            } else {
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            if (p.life <= 0) state.particles.splice(i, 1);
        }

        ctx.restore(); 
        requestRef.current = requestAnimationFrame(animate);

    }, [width, height, visualAcuity, phase, money, targetMoney, onGameOver]);

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
            // 重置时间引用，避免暂停后恢复时时间差过大导致速度异常
            lastTimeRef.current = 0;
            requestRef.current = requestAnimationFrame(animate);
        } else {
            // 暂停时重置时间引用
            lastTimeRef.current = 0;
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);


    return (
        <div className="relative w-full h-full select-none overflow-hidden font-sans">
            <canvas 
                ref={canvasRef} 
                onPointerDown={handleTrigger}
                className="absolute inset-0 block touch-none cursor-pointer" 
            />

            {/* HUD */}
            <div className="absolute top-20 left-0 w-full px-4 pointer-events-none flex justify-center gap-2 md:gap-4 z-10 flex-wrap">
                <div className="bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700 text-center min-w-[70px]">
                    <div className="text-[10px] text-slate-400">目标</div>
                    <div className="text-lg font-bold text-green-400">${targetMoney}</div>
                </div>
                <div className="bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700 text-center min-w-[70px]">
                    <div className="text-[10px] text-slate-400">金钱</div>
                    <div className="text-lg font-bold text-yellow-400">${money}</div>
                </div>
                <div className="bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700 text-center min-w-[70px]">
                    <div className="text-[10px] text-slate-400">时间</div>
                    <div className={`text-lg font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
                </div>
                <div className="bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700 text-center min-w-[70px]">
                    <div className="text-[10px] text-slate-400">关卡</div>
                    <div className="text-lg font-bold text-white">{level}</div>
                </div>
                
                {activeBuffs.strength && (
                    <div className="bg-yellow-600/90 px-3 py-1 rounded-xl border border-yellow-400 text-center min-w-[50px] animate-pulse">
                         <div className="text-[10px] text-white">力量</div>
                         <div className="text-lg font-bold text-white">💪</div>
                    </div>
                )}
            </div>

            {/* 道具按钮 */}
            {phase === 'PLAYING' && (
                <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-white bg-black/50 px-2 rounded-full">{inventory.dynamite}</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); useDynamite(); }}
                        className={`w-16 h-16 rounded-full border-4 shadow-xl flex items-center justify-center text-3xl transition-transform active:scale-95 ${
                            inventory.dynamite > 0 ? 'bg-red-500 border-red-300 hover:bg-red-600' : 'bg-gray-600 border-gray-500 opacity-50'
                        }`}
                    >
                        🧨
                    </button>
                </div>
            )}

            {/* 商店 (过关) 界面 */}
            {phase === 'SHOP' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 border-4 border-yellow-400 shadow-2xl">
                        <h2 className="text-2xl font-bold text-center text-slate-800 mb-4">关卡完成!</h2>
                        
                        <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center mb-6">
                            <span className="font-bold text-slate-600">当前金钱:</span>
                            <span className="text-2xl font-bold text-yellow-600">${money}</span>
                        </div>

                        <div className="space-y-3 mb-6">
                            {SHOP_ITEMS.map(item => (
                                <div key={item.id} className="flex items-center justify-between border p-2 rounded-lg bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl w-10 h-10 bg-slate-50 flex items-center justify-center rounded">{item.icon}</div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-800">{item.name}</div>
                                            <div className="text-[10px] text-slate-400">{item.desc}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => buyItem(item.id, item.price)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                                            money >= item.price ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-200 text-slate-400'
                                        }`}
                                    >
                                        ${item.price} <ShoppingCart className="inline w-3 h-3 ml-1" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 justify-center mb-4 text-xs text-slate-500 flex-wrap">
                             <div className="flex items-center gap-1">
                                 <span>库存:</span>
                                 <span className="font-bold text-slate-700">🧨 {inventory.dynamite}</span>
                             </div>
                             {inventory.strength > 0 && <span className="text-yellow-600 font-bold bg-yellow-50 px-2 rounded">已购: 大力药水 💪</span>}
                             {inventory.clock > 0 && <span className="text-blue-600 font-bold bg-blue-50 px-2 rounded">已购: 闹钟 ⏰</span>}
                        </div>

                        <button 
                            onClick={() => {
                                const hasStrength = inventory.strength > 0;
                                gameRef.current.buffStrengthActive = hasStrength;
                                setActiveBuffs({ strength: hasStrength }); 

                                const timeBonus = inventory.clock > 0 ? 15 : 0;
                                setInventory(prev => ({
                                    ...prev, 
                                    strength: Math.max(0, prev.strength - 1),
                                    clock: Math.max(0, prev.clock - 1)
                                }));

                                const nextLvl = level + 1;
                                const nextTarget = Math.floor(targetMoney * 1.5);
                                setLevel(nextLvl);
                                setTargetMoney(nextTarget);
                                startLevel(nextLvl, nextTarget, timeBonus);
                            }}
                            className="w-full py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                        >
                            下一关 <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
