
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { MERGE_FRUITS, playSound } from '../../utils/gameUtils';

interface Fruit {
    id: number; x: number; y: number; level: number; radius: number;
    vx: number; vy: number; isStatic: boolean;
}

interface Decoration {
    id: number;
    x: number;
    y: number;
    icon: string;
    rotation: number;
    scale: number;
    state: 'FLOATING' | 'DOCKED';
    targetX?: number;
    targetY?: number;
    speechBubble?: { text: string; timer: number };
}

const CHARMS = [
    { icon: '🧸', label: '我是小熊' },
    { icon: '🐰', label: '我是小兔' },
    { icon: '🐱', label: '喵喵喵' },
    { icon: '🐶', label: '汪汪汪' },
    { icon: '🦄', label: '我是独角兽' },
    { icon: '🐸', label: '孤寡孤寡' },
    { icon: '🐥', label: '叽叽叽' },
    { icon: '🐼', label: '我是熊猫' },
    { icon: '🍄', label: '采蘑菇' },
    { icon: '🌸', label: '春天来了' },
    { icon: '⭐', label: '一闪一闪' },
    { icon: '🍭', label: '好甜呀' }
];

export const WatermelonGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    
    const fruitsRef = useRef<Fruit[]>([]);
    const decorationsRef = useRef<Decoration[]>([]);
    const currentFruitRef = useRef<Fruit | null>(null);
    const isDroppingRef = useRef(false);
    
    // ID of the watermelon waiting to be clicked (Game pauses spawning when this is set)
    const waitingForClickIdRef = useRef<number | null>(null);
    
    // 初始化标记 Ref
    const initializedRef = useRef(false);

    // 生成下一个水果
    const spawnNextFruit = useCallback(() => {
        const minDimension = Math.min(width, height); 
        
        let maxUnlockLevel = 3; 
        const maxLevelOnBoard = fruitsRef.current.reduce((max, f) => Math.max(max, f.level), 0);

        if (maxLevelOnBoard >= 4) maxUnlockLevel = 4;
        if (maxLevelOnBoard >= 6) maxUnlockLevel = 5;

        const r = Math.random();
        let level = 0;

        if (maxUnlockLevel === 3) {
            if (r < 0.35) level = 0;      
            else if (r < 0.65) level = 1; 
            else if (r < 0.85) level = 2; 
            else level = 3;               
        } else if (maxUnlockLevel === 4) {
            if (r < 0.30) level = 0;      
            else if (r < 0.55) level = 1; 
            else if (r < 0.75) level = 2; 
            else if (r < 0.88) level = 3; 
            else level = 4;               
        } else {
            if (r < 0.25) level = 0;
            else if (r < 0.45) level = 1;
            else if (r < 0.65) level = 2;
            else if (r < 0.80) level = 3;
            else if (r < 0.90) level = 4; 
            else level = 5;               
        }

        const fruitInfo = MERGE_FRUITS[level];
        const radius = minDimension * fruitInfo.radiusRatio;
        
        // Lower spawn Y to 110 to avoid header overlap
        currentFruitRef.current = {
            id: Date.now(), x: width / 2, y: 110, level, radius,
            vx: 0, vy: 0, isStatic: true
        };
        isDroppingRef.current = false;
    }, [width, height]);

    // 初始化游戏
    useEffect(() => {
        if(isPlaying && !initializedRef.current) {
            initializedRef.current = true;
            fruitsRef.current = [];
            decorationsRef.current = [];
            waitingForClickIdRef.current = null;
            isDroppingRef.current = false;
            spawnNextFruit();
        }
    }, [isPlaying, spawnNextFruit]);

    // 处理交互（点击/触摸）
    const handleInteraction = (clientX: number, clientY: number) => {
        if (!isPlaying) return;

        // 1. 检查是否点击了已有的装饰挂件 (互动语音)
        for (const dec of decorationsRef.current) {
            const size = dec.scale * 50; 
            if (Math.hypot(clientX - dec.x, clientY - dec.y) < size) {
                const charmInfo = CHARMS.find(c => c.icon === dec.icon);
                if (charmInfo) {
                    dec.speechBubble = { text: charmInfo.label, timer: 120 };
                    dec.scale *= 1.2;
                    setTimeout(() => { dec.scale /= 1.2; }, 200);
                    playSound('shoot');
                }
                return; 
            }
        }

        // 2. 检查是否处于“点击大西瓜”模式
        if (waitingForClickIdRef.current !== null) {
            const targetId = waitingForClickIdRef.current;
            const targetFruit = fruitsRef.current.find(f => f.id === targetId);
            
            if (targetFruit) {
                const dist = Math.hypot(clientX - targetFruit.x, clientY - targetFruit.y);
                if (dist < targetFruit.radius * 1.2) { 
                    const usedIcons = new Set(decorationsRef.current.map(d => d.icon));
                    const availableCharms = CHARMS.filter(c => !usedIcons.has(c.icon));
                    const finalPool = availableCharms.length > 0 ? availableCharms : CHARMS;
                    const charm = finalPool[Math.floor(Math.random() * finalPool.length)];
                    
                    decorationsRef.current.push({
                        id: Date.now(),
                        x: targetFruit.x,
                        y: targetFruit.y,
                        icon: charm.icon,
                        rotation: (Math.random() - 0.5) * 0.5,
                        scale: targetFruit.radius / 20, 
                        state: 'FLOATING',
                        speechBubble: { text: "哇!", timer: 60 }
                    });
                    
                    // 移除西瓜
                    fruitsRef.current = fruitsRef.current.filter(f => f.id !== targetId);
                    waitingForClickIdRef.current = null;
                    
                    playSound('correct');
                    onScore(500); 
                    
                    // 恢复生成（如果当前没有待命水果）
                    if (!currentFruitRef.current && !isDroppingRef.current) {
                        setTimeout(spawnNextFruit, 500);
                    }
                }
            }
            return; 
        }

        // 3. 正常下落逻辑
        if (!currentFruitRef.current || isDroppingRef.current) return;
        
        // Lower drop zone trigger to > 140px
        if (clientY > 140) { 
            isDroppingRef.current = true;
            const fruit = currentFruitRef.current;
            fruit.x = Math.max(fruit.radius, Math.min(width - fruit.radius, clientX));
            fruit.isStatic = false; 
            fruitsRef.current.push(fruit);
            currentFruitRef.current = null;
            playSound('shoot'); 
            setTimeout(spawnNextFruit, 600); 
        }
    };

    // 动画循环
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        const bottomY = height - 20; 

        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);
        
        // 2. 更新装饰挂件位置
        decorationsRef.current.forEach(dec => {
            if (dec.state === 'FLOATING') {
                // 智能停靠逻辑：只停靠左右，且寻找空位
                if (dec.targetX === undefined) {
                    // 随机选择左侧或右侧
                    const isLeft = Math.random() > 0.5;
                    const padding = 40;
                    
                    dec.targetX = isLeft ? padding + Math.random() * 10 : width - padding - Math.random() * 10;
                    
                    // 寻找不重叠的 Y 坐标
                    // 避开顶部 Header区域 (0-150) 和 底部区域
                    let bestY = 160 + Math.random() * (height - 320); 
                    let maxMinDist = -1; // 寻找"距离最近邻居最远"的位置
                    
                    // 尝试 5 次随机位置，选最好的一个
                    for(let attempt=0; attempt<5; attempt++) {
                        const candidateY = 160 + Math.random() * (height - 320);
                        let minDistToNeighbor = 9999;
                        
                        // 检查同侧的挂件
                        for (const other of decorationsRef.current) {
                            if (other === dec || other.targetX === undefined) continue;
                            const otherIsLeft = other.targetX < width / 2;
                            if (otherIsLeft === isLeft) {
                                const dist = Math.abs(candidateY - (other.targetY || other.y));
                                if (dist < minDistToNeighbor) minDistToNeighbor = dist;
                            }
                        }
                        
                        // 如果是第一个，直接用
                        if (minDistToNeighbor === 9999) {
                            bestY = candidateY;
                            break;
                        }

                        if (minDistToNeighbor > maxMinDist) {
                            maxMinDist = minDistToNeighbor;
                            bestY = candidateY;
                        }
                    }
                    dec.targetY = bestY;
                }
                
                // 移动 - 较快速度
                const dx = (dec.targetX! - dec.x) * 0.15;
                const dy = (dec.targetY! - dec.y) * 0.15;
                dec.x += dx;
                dec.y += dy;
                
                if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                    dec.state = 'DOCKED';
                }
            } else {
                // DOCKED: 轻轻漂浮
                dec.y += Math.sin(frameCountRef.current * 0.05) * 0.2;
            }
            
            ctx.save();
            ctx.translate(dec.x, dec.y);
            ctx.rotate(dec.rotation + Math.sin(frameCountRef.current * 0.03) * 0.1);
            ctx.font = `${dec.scale * 25}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(255,255,255,0.8)';
            ctx.fillText(dec.icon, 0, 0);
            ctx.restore();
            
            if (dec.speechBubble) {
                dec.speechBubble.timer--;
                if (dec.speechBubble.timer > 0) {
                    ctx.save();
                    // 气泡方向根据位置调整
                    const isLeft = dec.x < width/2;
                    const offsetX = isLeft ? 40 : -40;
                    ctx.translate(dec.x + offsetX, dec.y - 20);
                    
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;
                    
                    const text = dec.speechBubble.text;
                    const textW = ctx.measureText(text).width + 20;
                    ctx.beginPath();
                    ctx.roundRect(-textW/2, -15, textW, 30, 10);
                    ctx.fill(); ctx.stroke();
                    
                    ctx.fillStyle = 'black';
                    ctx.font = '12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                } else {
                    dec.speechBubble = undefined;
                }
            }
        });

        ctx.beginPath(); ctx.moveTo(0, bottomY); ctx.lineTo(width, bottomY);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 5; ctx.stroke();

        // 3. 物理引擎
        const gravity = 0.85;  
        const damping = 0.2;   
        const friction = 0.95; 

        for (let i = 0; i < fruitsRef.current.length; i++) {
            const f = fruitsRef.current[i];
            
            if (f.id === waitingForClickIdRef.current) {
                f.vx *= 0.9;
                f.vy *= 0.9; 
                f.vx += (width/2 - f.x) * 0.01;
                f.vy += (height/2 - f.y) * 0.01;
            } else {
                f.vy += gravity;
            }
            
            f.vx *= friction;
            f.x += f.vx; 
            f.y += f.vy;

            if (f.x - f.radius < 0) { 
                f.x = f.radius; 
                f.vx = Math.abs(f.vx) * damping;
            } else if (f.x + f.radius > width) { 
                f.x = width - f.radius; 
                f.vx = -Math.abs(f.vx) * damping;
            }

            if (f.y + f.radius > bottomY) { 
                f.y = bottomY - f.radius; 
                f.vy = -Math.abs(f.vy) * damping; 
                if(Math.abs(f.vy) < gravity * 2) f.vy = 0;
                f.vx *= 0.8;
            }
        }

        // 4. 水果碰撞与合成逻辑
        const indicesToRemove = new Set<number>();
        const newFruits: Fruit[] = [];

        for (let i = 0; i < fruitsRef.current.length; i++) {
            if (indicesToRemove.has(i)) continue;
            
            for (let j = i + 1; j < fruitsRef.current.length; j++) {
                if (indicesToRemove.has(j)) continue;

                const f1 = fruitsRef.current[i]; 
                const f2 = fruitsRef.current[j];
                
                if (f1.id === waitingForClickIdRef.current || f2.id === waitingForClickIdRef.current) continue;

                const dx = f2.x - f1.x; 
                const dy = f2.y - f1.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                const minDist = f1.radius + f2.radius;

                if (dist < minDist) {
                    if (f1.level === f2.level && f1.level < MERGE_FRUITS.length - 1) {
                        indicesToRemove.add(i);
                        indicesToRemove.add(j);

                        const newLevel = f1.level + 1;
                        const newRadius = Math.min(width, height) * MERGE_FRUITS[newLevel].radiusRatio;
                        const midX = (f1.x + f2.x) / 2;
                        const midY = (f1.y + f2.y) / 2;
                        const newId = Date.now() + Math.random();

                        const newFruit: Fruit = {
                            id: newId, 
                            x: midX, y: midY, 
                            level: newLevel, radius: newRadius,
                            vx: 0, vy: 0, 
                            isStatic: false
                        };
                        
                        newFruits.push(newFruit);
                        onScore(10 * (newLevel + 1));
                        playSound('correct');

                        if (newLevel === MERGE_FRUITS.length - 1) {
                            waitingForClickIdRef.current = newId;
                        }
                        break; 
                    } else {
                        const angle = Math.atan2(dy, dx);
                        const force = 0.5; 
                        const overlap = minDist - dist;
                        
                        const pushX = Math.cos(angle) * overlap * force;
                        const pushY = Math.sin(angle) * overlap * force;
                        
                        f1.vx -= pushX; f1.vy -= pushY;
                        f2.vx += pushX; f2.vy += pushY;
                        
                        f1.vx *= 0.65; f1.vy *= 0.65;
                        f2.vx *= 0.65; f2.vy *= 0.65;
                    }
                }
            }
        }

        if (indicesToRemove.size > 0 || newFruits.length > 0) {
            fruitsRef.current = fruitsRef.current.filter((_, idx) => !indicesToRemove.has(idx));
            fruitsRef.current.push(...newFruits);
        }
        
        // 5. 绘制所有水果
        const drawFruit = (f: Fruit) => {
            const info = MERGE_FRUITS[f.level];
            const isTarget = f.id === waitingForClickIdRef.current;

            ctx.save();
            
            if (isTarget) {
                const pulse = Math.sin(frameCountRef.current * 0.1) * 10 + 20;
                ctx.shadowBlur = pulse;
                ctx.shadowColor = '#fff';
                ctx.lineWidth = 4;
                
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius + 10, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(frameCountRef.current * 0.05))})`;
                ctx.stroke();
            } else {
                ctx.lineWidth = 2;
            }

            ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.fillStyle = info.color; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.stroke();
            
            ctx.font = `${f.radius}px serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff'; 
            ctx.fillText(info.label, f.x, f.y + f.radius * 0.1);
            
            if (isTarget) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText("点击变身!", f.x, f.y - f.radius - 15);
            }

            ctx.restore();
        };

        fruitsRef.current.forEach(drawFruit);

        if (currentFruitRef.current && !isDroppingRef.current) {
            if (waitingForClickIdRef.current === null) {
                drawFruit(currentFruitRef.current);
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 4; ctx.shadowColor = 'black';
                ctx.fillText("请点击发光的大西瓜!", width/2, 100);
                ctx.shadowBlur = 0;
            }
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, onScore]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    return (
        <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            onPointerDown={(e) => {
                const rect = canvasRef.current?.getBoundingClientRect();
                if(rect) handleInteraction(e.clientX - rect.left, e.clientY - rect.top);
            }}
            className="block touch-none cursor-pointer" 
        />
    );
};
