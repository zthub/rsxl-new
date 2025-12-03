
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
    const draggingFruitIdRef = useRef<number | null>(null);
    const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
    const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const initializedRef = useRef(false); // Track if game has been initialized
    const lastOrientationRef = useRef<'landscape' | 'portrait' | null>(null); // Track orientation changes

    // 使用 ref 存储最新的 width 和 height，避免 useCallback 依赖问题
    const dimensionsRef = useRef({ width, height });
    useEffect(() => {
        dimensionsRef.current = { width, height };
    }, [width, height]);

    const initLevel = useCallback(() => {
        const { width: w, height: h } = dimensionsRef.current;
        
        // 防止在尺寸无效时初始化
        if (w <= 0 || h <= 0) {
            console.warn('Invalid dimensions for FindFruitGame');
            return;
        }
        
        const minDimension = Math.min(w, h);
        const fixedRadius = minDimension * 0.055; 

        const allIndices = Array.from({ length: FRUIT_TYPES.length }, (_, i) => i);
        const targets: number[] = [];
        const tempPool = [...allIndices];
        
        for(let i=0; i<4; i++) {
            if (tempPool.length === 0) break; // 防止数组为空
            const randIdx = Math.floor(Math.random() * tempPool.length);
            targets.push(tempPool[randIdx]);
            tempPool.splice(randIdx, 1);
        }
        
        targetFruitsRef.current = targets;
        foundTargetsRef.current = [false, false, false, false];

        const distractorPool: number[] = [...targets];
        targets.forEach(tIdx => {
            const typeDef = FRUIT_TYPES[tIdx];
            if (typeDef && typeDef.pairId !== undefined) {
                distractorPool.push(typeDef.pairId);
            }
        });

        // 安全地填充 distractorPool，避免无限循环
        const desiredTotalCount = Math.min(18 + Math.floor(Math.random() * 5), FRUIT_TYPES.length * 2);
        let fillAttempts = 0;
        const maxFillAttempts = 1000; // 限制填充尝试次数
        
        while(distractorPool.length < desiredTotalCount && fillAttempts < maxFillAttempts) {
            const randomType = Math.floor(Math.random() * FRUIT_TYPES.length);
            if (!distractorPool.includes(randomType)) {
                distractorPool.push(randomType);
            }
            fillAttempts++;
        }

        const uniqueTypesToScatter = Array.from(new Set(distractorPool));
        scatteredFruitsRef.current = [];
        
        // 动态计算顶部和底部边距，适配横屏和竖屏
        // 横屏时高度较小，需要减少边距
        const isLandscape = w > h;
        const topMargin = isLandscape ? Math.max(80, h * 0.12) : Math.max(100, h * 0.15); // 横屏时减少顶部边距
        const bottomBarHeight = isLandscape ? Math.max(100, h * 0.12) : Math.max(120, h * 0.15); // 横屏时减少底部栏高度
        const bottomMargin = bottomBarHeight + (isLandscape ? 10 : 20); // 横屏时减少间距
        const availableHeight = h - topMargin - bottomMargin;
        // 修复横屏布局：使用左右边距，确保水果在屏幕中央分布
        const leftMargin = fixedRadius;
        const rightMargin = fixedRadius;
        const availableWidth = w - leftMargin - rightMargin;
        
        // 确保有足够的空间放置水果
        if (availableHeight < fixedRadius * 4 || availableWidth < fixedRadius * 4) {
            console.warn('Not enough space for fruits', { availableHeight, availableWidth, fixedRadius, w, h, isLandscape });
            return;
        }

        // 使用网格布局作为备选方案，避免随机放置卡死
        // 确保网格间距足够，避免水果重叠
        const minSpacing = fixedRadius * 2.5;
        // 横屏时优先使用宽度，竖屏时优先使用高度
        const gridCols = Math.max(4, Math.floor(availableWidth / minSpacing)); // 至少4列
        const gridRows = Math.max(3, Math.floor(availableHeight / minSpacing)); // 至少3行
        const maxGridPositions = gridCols * gridRows;
        
        // 如果水果数量超过网格容量，减少水果数量
        const maxFruits = Math.min(uniqueTypesToScatter.length, maxGridPositions);
        const fruitsToPlace = uniqueTypesToScatter.slice(0, maxFruits);

        // 生成网格位置列表 - 修复横屏布局问题
        const gridPositions: Array<{x: number, y: number}> = [];
        const cellWidth = availableWidth / gridCols;
        const cellHeight = availableHeight / gridRows;
        
        // 计算起始位置，确保在整个可用区域内居中分布
        // 修复：使用 leftMargin 而不是 fixedRadius，确保横屏时正确计算
        const startX = leftMargin + cellWidth / 2;
        const startY = topMargin + cellHeight / 2;
        
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                // 计算网格位置，确保均匀分布
                const gridX = startX + col * cellWidth;
                const gridY = startY + row * cellHeight;
                
                // 确保不超出边界 - 使用 leftMargin 和 rightMargin 保持一致
                const safeX = Math.max(leftMargin + fixedRadius, Math.min(w - rightMargin - fixedRadius, gridX));
                const safeY = Math.max(topMargin + fixedRadius, Math.min(h - bottomMargin - fixedRadius, gridY));
                
                gridPositions.push({ x: safeX, y: safeY });
            }
        }
        
        // 随机打乱网格位置
        for (let i = gridPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gridPositions[i], gridPositions[j]] = [gridPositions[j], gridPositions[i]];
        }

        // 使用混合策略：先尝试随机放置，失败后使用网格
        for(let i = 0; i < fruitsToPlace.length; i++) {
            const level = fruitsToPlace[i];
            let validPos = false; 
            let attempts = 0;
            const maxAttempts = 50; // 减少随机尝试次数
            let x = 0, y = 0;
            
            // 先尝试随机放置
            while(!validPos && attempts < maxAttempts) {
                // 修复横屏布局：使用 leftMargin 确保正确计算
                x = Math.random() * availableWidth + leftMargin;
                y = Math.random() * availableHeight + topMargin;
                validPos = true;
                
                // 检查是否与已有水果重叠
                for(const existing of scatteredFruitsRef.current) {
                    if (Math.hypot(x - existing.x, y - existing.y) < fixedRadius * 2.2) {
                        validPos = false; 
                        break;
                    }
                }
                
                // 检查是否超出可用区域 - 修复横屏布局
                if (y + fixedRadius > h - bottomMargin || y - fixedRadius < topMargin ||
                    x + fixedRadius > w - rightMargin || x - fixedRadius < leftMargin) {
                    validPos = false;
                }
                
                attempts++;
            }
            
            // 如果随机放置失败，使用网格位置
            if (!validPos && i < gridPositions.length) {
                const gridPos = gridPositions[i];
                x = gridPos.x;
                y = gridPos.y;
                
                // 检查网格位置是否与已有水果重叠
                validPos = true;
                for(const existing of scatteredFruitsRef.current) {
                    if (Math.hypot(x - existing.x, y - existing.y) < fixedRadius * 2.2) {
                        validPos = false;
                        break;
                    }
                }
            }
            
            // 如果找到有效位置，添加水果
            if(validPos) {
                scatteredFruitsRef.current.push({
                    id: Date.now() + Math.random() + i, x: x, y: y, level, radius: fixedRadius, 
                    rotation: Math.random() * Math.PI * 2,
                });
            }
            // 如果找不到位置，跳过该水果（不卡死）
        }
    }, []); // 移除依赖，使用 ref 获取最新值

    // Init - 在首次启动或横竖屏切换时重新初始化
    useEffect(() => {
        if (!isPlaying || width <= 0 || height <= 0) return;
        
        const currentOrientation = width > height ? 'landscape' : 'portrait';
        const orientationChanged = lastOrientationRef.current !== null && 
                                   lastOrientationRef.current !== currentOrientation;
        
        // 首次初始化或横竖屏切换时重新初始化
        if (!initializedRef.current || orientationChanged) {
            initLevel();
            initializedRef.current = true;
            lastOrientationRef.current = currentOrientation;
        }
    }, [isPlaying, initLevel, width, height]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isPlaying) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        // 直接使用逻辑坐标（CSS像素），因为Canvas已经通过scale处理了DPI
        const logicalX = e.clientX - rect.left;
        const logicalY = e.clientY - rect.top;

        let clickedFruitIndex = -1;
        for(let i = scatteredFruitsRef.current.length - 1; i >= 0; i--) {
            const f = scatteredFruitsRef.current[i];
            // 使用逻辑坐标进行比较
            if(Math.hypot(f.x - logicalX, f.y - logicalY) < f.radius + 10) {
                clickedFruitIndex = i; break;
            }
        }

        if (clickedFruitIndex !== -1) {
            const clickedFruit = scatteredFruitsRef.current[clickedFruitIndex];
            draggingFruitIdRef.current = clickedFruit.id;
            dragOffsetRef.current = { dx: logicalX - clickedFruit.x, dy: logicalY - clickedFruit.y };
            dragStartPosRef.current = { x: clickedFruit.x, y: clickedFruit.y };
            // 将被拖动的水果放到数组末尾，保证绘制时在最上层
            scatteredFruitsRef.current.splice(clickedFruitIndex, 1);
            scatteredFruitsRef.current.push(clickedFruit);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPlaying || draggingFruitIdRef.current === null) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const logicalX = e.clientX - rect.left;
        const logicalY = e.clientY - rect.top;

        const fruit = scatteredFruitsRef.current.find(f => f.id === draggingFruitIdRef.current);
        if (!fruit) return;

        const { dx, dy } = dragOffsetRef.current;

        // 允许拖动进入底部待选区域，只做简单的屏幕边界限制
        let newX = logicalX - dx;
        let newY = logicalY - dy;

        const minY = fruit.radius + 10;
        const maxY = height - fruit.radius - 10;
        if (newY < minY) newY = minY;
        if (newY > maxY) newY = maxY;

        fruit.x = newX;
        fruit.y = newY;
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isPlaying || draggingFruitIdRef.current === null) {
            draggingFruitIdRef.current = null;
            return;
        }

        const fruitIndex = scatteredFruitsRef.current.findIndex(f => f.id === draggingFruitIdRef.current);
        if (fruitIndex === -1) {
            draggingFruitIdRef.current = null;
            return;
        }

        const fruit = scatteredFruitsRef.current[fruitIndex];

        // 计算底部目标栏的位置和每个盒子的区域，复用动画中的布局逻辑
        const boxSize = Math.min(60, Math.min(width, height) * 0.08); 
        const gap = Math.max(10, boxSize * 0.25);
        const totalWidth = 4 * boxSize + 3 * gap + 40;
        const barHeight = boxSize + 20;
        const barX = Math.max(10, (width - totalWidth) / 2);
        const barY = height - barHeight - 10;

        let matchedTargetIdx = -1;
        for (let idx = 0; idx < targetFruitsRef.current.length; idx++) {
            const bx = barX + 20 + idx * (boxSize + gap);
            const by = barY + 10;
            if (fruit.x >= bx && fruit.x <= bx + boxSize &&
                fruit.y >= by && fruit.y <= by + boxSize) {
                matchedTargetIdx = idx;
                break;
            }
        }

        if (matchedTargetIdx !== -1) {
            const targetLevel = targetFruitsRef.current[matchedTargetIdx];
            if (fruit.level === targetLevel && !foundTargetsRef.current[matchedTargetIdx]) {
                // 正确拖到对应水果上
                foundTargetsRef.current[matchedTargetIdx] = true;
                scatteredFruitsRef.current.splice(fruitIndex, 1);
                playSound('correct');
                onScore(100);

                if (foundTargetsRef.current.every(Boolean)) {
                    // 重置初始化标记，允许下一关初始化
                    initializedRef.current = false;
                    setTimeout(() => {
                        if (isPlaying && width > 0 && height > 0) {
                            initLevel();
                            initializedRef.current = true;
                        }
                    }, 500);
                }
            } else {
                // 拖到了目标槽，但水果不匹配
                playSound('wrong');
                onScore(-10);
                // 还原到拖动前的位置
                fruit.x = dragStartPosRef.current.x;
                fruit.y = dragStartPosRef.current.y;
            }
        } else {
            // 没有拖到任何目标槽，直接还原
            fruit.x = dragStartPosRef.current.x;
            fruit.y = dragStartPosRef.current.y;
        }

        draggingFruitIdRef.current = null;
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
        
        const draggingId = draggingFruitIdRef.current;
        // 先绘制未被拖动的水果
        scatteredFruitsRef.current.forEach(f => {
            if (f.id !== draggingId) {
                drawSpecificFruit(f.x, f.y, f.radius, f.level, f.rotation);
            }
        });

        // Bottom Bar - 响应式调整，适配横屏
        const boxSize = Math.min(60, Math.min(width, height) * 0.08); 
        const gap = Math.max(10, boxSize * 0.25);
        const totalWidth = 4 * boxSize + 3 * gap + 40;
        const barHeight = boxSize + 20;
        const barX = Math.max(10, (width - totalWidth) / 2);
        const barY = height - barHeight - 10; // 减少底部边距，避免在横屏时占用太多空间

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

        // 最后单独绘制正在被拖动的水果，使其位于底部待选栏之上
        if (draggingId !== null) {
            const draggingFruit = scatteredFruitsRef.current.find(f => f.id === draggingId);
            if (draggingFruit) {
                drawSpecificFruit(draggingFruit.x, draggingFruit.y, draggingFruit.radius, draggingFruit.level, draggingFruit.rotation);
            }
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity]);

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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="block touch-none"
        />
    );
};

