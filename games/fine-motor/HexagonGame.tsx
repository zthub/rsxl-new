
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';

// Axial coordinates (q, r)
interface HexCoord { q: number; r: number; }

interface DragShape {
    id: number;
    cells: { q: number; r: number; }[]; // relative coordinates
    color: string;
    isDragging: boolean;
    currentX: number;
    currentY: number;
    originalX: number;
    originalY: number;
}

const BASE_COLORS = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6'];

export const HexagonGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    
    // Game State
    const boardRef = useRef<Map<string, string>>(new Map()); 
    const shapesRef = useRef<DragShape[]>([]);
    const draggingShapeRef = useRef<DragShape | null>(null);
    const gameOverRef = useRef(false);
    const initializedRef = useRef(false); // Track if game has been initialized

    // Level & Timer State
    const [level, setLevel] = useState(1);
    const [levelScore, setLevelScore] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180); // Internal 180s timer

    // Layout State
    const isPortrait = height > width;
    // Ensure sidebar is large enough for dragging area
    const sidebarSize = isPortrait ? height * 0.28 : Math.max(240, width * 0.25); 
    const mainSize = isPortrait ? height - sidebarSize : width - sidebarSize;
    
    // Radius 4 means 5 cells per side (keep original size)
    const BOARD_RADIUS = 4; 
    const availW = isPortrait ? width : mainSize;
    const availH = isPortrait ? mainSize : height;
    const minDim = Math.min(availW, availH);
    // Increase divisor to make hexagons smaller, shrinking overall board size
    const HEX_SIZE = Math.floor(minDim / ((BOARD_RADIUS * 2 + 1) * 2.2)); 

    // Helpers
    const getHexCorners = (x: number, y: number, size: number) => {
        const corners = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            corners.push({
                x: x + size * Math.cos(angle_rad),
                y: y + size * Math.sin(angle_rad)
            });
        }
        return corners;
    };

    const hexToPixel = (q: number, r: number, centerX: number, centerY: number, size: number) => {
        const x = size * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
        const y = size * (3./2 * r);
        return { x: centerX + x, y: centerY + y };
    };

    const pixelToHex = (x: number, y: number, centerX: number, centerY: number, size: number) => {
        const ptX = (x - centerX) / size;
        const ptY = (y - centerY) / size;
        const q = (Math.sqrt(3)/3 * ptX - 1./3 * ptY);
        const r = (2./3 * ptY);
        return hexRound(q, r);
    };

    const hexRound = (q: number, r: number) => {
        let s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);
        const q_diff = Math.abs(rq - q);
        const r_diff = Math.abs(rr - r);
        const s_diff = Math.abs(rs - s);
        if (q_diff > r_diff && q_diff > s_diff) rq = -rr - rs;
        else if (r_diff > s_diff) rr = -rq - rs;
        else rs = -rq - rr;
        return { q: rq, r: rr };
    };

    // Initialize Board
    const initBoard = useCallback(() => {
        boardRef.current.clear();
        for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
            const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
            const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
            for (let r = r1; r <= r2; r++) {
                boardRef.current.set(`${q},${r}`, ''); 
            }
        }
    }, [BOARD_RADIUS]);

    const generateShape = (id: number, x: number, y: number): DragShape => {
        const color = BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)];
        const types = [
            [{q:0,r:0}], 
            [{q:0,r:0}, {q:1,r:0}],
            [{q:0,r:0}, {q:1,r:-1}], 
            [{q:0,r:0}, {q:0,r:1}], 
            [{q:0,r:0}, {q:1,r:0}, {q:2,r:0}], 
            [{q:0,r:0}, {q:1,r:-1}, {q:2,r:-2}], 
            [{q:0,r:0}, {q:0,r:1}, {q:0,r:2}], 
            [{q:0,r:0}, {q:1,r:0}, {q:0,r:1}],
            [{q:0,r:0}, {q:1,r:0}, {q:-1,r:1}], 
            [{q:0,r:0}, {q:1,r:-1}, {q:1,r:0}], 
            [{q:0,r:0}, {q:1,r:0}, {q:2,r:0}, {q:1,r:1}], 
            [{q:0,r:0}, {q:1,r:-1}, {q:2,r:-2}, {q:1,r:0}], 
            [{q:0,r:0}, {q:1,r:0}, {q:2,r:0}, {q:2,r:1}], 
            [{q:0,r:0}, {q:0,r:1}, {q:0,r:2}, {q:1,r:2}], 
            [{q:0,r:0}, {q:1,r:0}, {q:1,r:-1}, {q:2,r:-1}], 
        ];
        const cells = types[Math.floor(Math.random() * types.length)];
        return {
            id, cells, color, isDragging: false,
            currentX: x, currentY: y, originalX: x, originalY: y
        };
    };

    const refillShapes = useCallback(() => {
        // 重新计算布局参数，确保使用最新的尺寸
        const currentIsPortrait = height > width;
        const currentSidebarSize = currentIsPortrait ? height * 0.28 : Math.max(240, width * 0.25);
        
        const slots = [];
        if (currentIsPortrait) {
            // Distribute shapes horizontally, avoiding right edge
            const spacingX = width / 4; // Use 4 divisions for better spacing
            const barY = height - currentSidebarSize * 0.6; 
            slots.push({ x: spacingX * 1, y: barY });      // Left
            slots.push({ x: spacingX * 2, y: barY });      // Center
            slots.push({ x: spacingX * 3, y: barY });      // Right (but not at edge)
        } else {
            // Distribute shapes evenly in the right sidebar area, slightly left of center
            const sidebarLeft = width - currentSidebarSize;
            const centerX = sidebarLeft + currentSidebarSize * 0.45; // Slightly left of center for better visual balance
            // Distribute vertically with more spacing: top, middle, bottom
            const topY = height * 0.25;    // Top quarter
            const midY = height * 0.5;      // Middle
            const botY = height * 0.75;     // Bottom quarter
            slots.push({ x: centerX, y: topY });
            slots.push({ x: centerX, y: midY });
            slots.push({ x: centerX, y: botY });
        }

        for(let i=0; i<3; i++) {
            const existing = shapesRef.current.find(s => s.id === i);
            if (!existing) {
                shapesRef.current.push(generateShape(i, slots[i].x, slots[i].y));
            } else if (!existing.isDragging) {
                existing.originalX = slots[i].x;
                existing.originalY = slots[i].y;
                existing.currentX = slots[i].x;
                existing.currentY = slots[i].y;
            }
        }
    }, [width, height]);

    // Init Game - only on first start, not on resume
    useEffect(() => {
        if (isPlaying && !initializedRef.current) {
            initBoard();
            shapesRef.current = [];
            // 延迟一下确保尺寸已经正确设置
            setTimeout(() => {
                refillShapes();
            }, 100);
            gameOverRef.current = false;
            setLevel(1);
            setLevelScore(0);
            setShowLevelUp(false);
            setTimeLeft(180); // Reset timer
            initializedRef.current = true;
        }
    }, [isPlaying, initBoard, refillShapes]);
    
    // 当尺寸变化时，更新碎片位置
    useEffect(() => {
        if (isPlaying && initializedRef.current && shapesRef.current.length > 0) {
            refillShapes();
        }
    }, [width, height, isPlaying, refillShapes]); 

    // Timer Logic
    useEffect(() => {
        if (!isPlaying || gameOverRef.current || showLevelUp) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onGameOver();
                    gameOverRef.current = true;
                    playSound('wrong');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isPlaying, showLevelUp, onGameOver]);

    // Logic
    const checkLines = (bonusPointsFromPlacement: number) => {
        const board = boardRef.current;
        const toRemove = new Set<string>();

        // Check all 3 axes
        for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
            const keys: string[] = [];
            const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
            const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
            let full = true;
            for (let r = r1; r <= r2; r++) {
                const key = `${q},${r}`;
                if (!board.get(key)) full = false;
                keys.push(key);
            }
            if (full && keys.length > 0) keys.forEach(k => toRemove.add(k));
        }
        for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
            const keys: string[] = [];
            const q1 = Math.max(-BOARD_RADIUS, -r - BOARD_RADIUS);
            const q2 = Math.min(BOARD_RADIUS, -r + BOARD_RADIUS);
            let full = true;
            for (let q = q1; q <= q2; q++) {
                const key = `${q},${r}`;
                if (!board.get(key)) full = false;
                keys.push(key);
            }
            if (full && keys.length > 0) keys.forEach(k => toRemove.add(k));
        }
        for (let s = -BOARD_RADIUS; s <= BOARD_RADIUS; s++) {
             const keys: string[] = [];
             const q1 = Math.max(-BOARD_RADIUS, -s - BOARD_RADIUS);
             const q2 = Math.min(BOARD_RADIUS, -s + BOARD_RADIUS);
             let full = true;
             for (let q = q1; q <= q2; q++) {
                 const r = -s - q;
                 const key = `${q},${r}`;
                 if (!board.get(key)) full = false;
                 keys.push(key);
             }
             if (full && keys.length > 0) keys.forEach(k => toRemove.add(k));
        }

        let gainedPoints = bonusPointsFromPlacement;
        
        if (toRemove.size > 0) {
            toRemove.forEach(k => board.set(k, '')); 
            playSound('correct');
            const clearPoints = toRemove.size;
            gainedPoints += clearPoints;
            onScore(clearPoints); 
        }

        setLevelScore(prev => {
            // 如果已经显示升级提示，不再增加分数
            if (showLevelUp) {
                return prev;
            }
            
            const nextScore = prev + gainedPoints;
            // 第一关90分，后面每关增加30分：第1关90，第2关120，第3关150...
            const target = 90 + (level - 1) * 30;
            
            // 确保只升级一关，防止跳级
            if (nextScore >= target) {
                setShowLevelUp(true);
                playSound('correct');
                // 使用函数式更新确保只增加1，使用当前level值
                const currentLevel = level;
                setTimeout(() => {
                    setLevel(currentLevel + 1);
                    setLevelScore(0); 
                    setShowLevelUp(false);
                    setTimeLeft(180); // Reset timer for next level
                    initBoard(); 
                    shapesRef.current = [];
                    refillShapes();
                }, 2000);
                // 返回目标分数，防止超出导致跳级
                return target;
            }
            
            return nextScore;
        });
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault(); 
        if (!isPlaying || gameOverRef.current || showLevelUp) return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let i = shapesRef.current.length - 1; i >= 0; i--) {
            const s = shapesRef.current[i];
            const currentScale = s.isDragging ? 1.0 : 0.65; 
            
            // Hit radius = 2.5x cell size for forgiving touch
            // Also check cell proximity
            const shapeRadius = HEX_SIZE * currentScale * 3.5; 
            const distToShapeCenter = Math.hypot(s.currentX - x, s.currentY - y);
            
            let hit = false;
            if (distToShapeCenter < shapeRadius) {
                hit = true;
            } else {
                hit = s.cells.some(cell => {
                    const pixelPos = hexToPixel(cell.q, cell.r, s.currentX, s.currentY, HEX_SIZE * currentScale);
                    return Math.hypot(pixelPos.x - x, pixelPos.y - y) < (HEX_SIZE * currentScale * 1.5);
                });
            }

            if (hit) {
                draggingShapeRef.current = s;
                s.isDragging = true;
                s.currentX = x;
                s.currentY = y - HEX_SIZE * 2.0; 
                shapesRef.current.splice(i, 1);
                shapesRef.current.push(s);
                return;
            }
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        e.preventDefault();
        if (!draggingShapeRef.current) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        draggingShapeRef.current.currentX = x;
        draggingShapeRef.current.currentY = y - HEX_SIZE * 2.0; 
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.preventDefault();
        const shape = draggingShapeRef.current;
        if (!shape) return;

        shape.isDragging = false;
        draggingShapeRef.current = null;

        const centerX = isPortrait ? width / 2 : (width - sidebarSize) / 2;
        // Center the board vertically (removed offset to center it properly)
        const centerY = isPortrait ? (height - sidebarSize) / 2 : height / 2;
        
        const {q, r} = pixelToHex(shape.currentX, shape.currentY, centerX, centerY, HEX_SIZE);
        
        let canPlace = true;
        const placementCoords: string[] = [];
        
        for (const c of shape.cells) {
            const targetQ = q + c.q;
            const targetR = r + c.r;
            const key = `${targetQ},${targetR}`;
            if (!boardRef.current.has(key) || boardRef.current.get(key) !== '') {
                canPlace = false; break;
            }
            placementCoords.push(key);
        }

        if (canPlace) {
            placementCoords.forEach(key => boardRef.current.set(key, shape.color));
            
            const placementPoints = shape.cells.length;
            onScore(placementPoints);
            playSound('shoot');
            
            const idx = shapesRef.current.findIndex(s => s.id === shape.id);
            if (idx !== -1) shapesRef.current.splice(idx, 1);
            
            checkLines(placementPoints);
            if (shapesRef.current.length === 0) refillShapes();
            else refillShapes(); 

        } else {
            shape.currentX = shape.originalX;
            shape.currentY = shape.originalY;
            playSound('wrong');
        }
    };

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;

        // Background
        ctx.fillStyle = '#eff6ff';
        ctx.fillRect(0, 0, width, height);
        
        const centerX = isPortrait ? width / 2 : (width - sidebarSize) / 2;
        // Center the board vertically (matching pointer logic)
        const centerY = isPortrait ? (height - sidebarSize) / 2 : height / 2;

        // Draw Board
        boardRef.current.forEach((color, key) => {
            const [q, r] = key.split(',').map(Number);
            const pos = hexToPixel(q, r, centerX, centerY, HEX_SIZE);
            const corners = getHexCorners(pos.x, pos.y, HEX_SIZE - 2);
            
            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            for(let i=1; i<6; i++) ctx.lineTo(corners[i].x, corners[i].y);
            ctx.closePath();
            
            if (color) {
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(200, 210, 230, 0.4)';
                ctx.fill();
            }
        });

        // Draw Sidebar Area
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        if (isPortrait) {
            ctx.fillRect(0, height - sidebarSize, width, sidebarSize);
            ctx.beginPath(); ctx.moveTo(0, height - sidebarSize); ctx.lineTo(width, height - sidebarSize); 
        } else {
            ctx.fillRect(width - sidebarSize, 0, sidebarSize, height);
            ctx.beginPath(); ctx.moveTo(width - sidebarSize, 0); ctx.lineTo(width - sidebarSize, height); 
        }
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; ctx.stroke();

        // Draw Shapes
        shapesRef.current.forEach(shape => {
            const originX = shape.currentX;
            const originY = shape.currentY;
            const scale = shape.isDragging ? 1.0 : 0.65; 
            
            // Preview shadow
            if (shape.isDragging) {
                 const {q, r} = pixelToHex(originX, originY, centerX, centerY, HEX_SIZE);
                 let canPlace = true;
                 const previews = [];
                 for(const c of shape.cells) {
                     const tQ = q + c.q;
                     const tR = r + c.r;
                     const key = `${tQ},${tR}`;
                     if (!boardRef.current.has(key) || boardRef.current.get(key) !== '') canPlace = false;
                     previews.push({q: tQ, r: tR});
                 }
                 if (canPlace) {
                     previews.forEach(p => {
                         const pos = hexToPixel(p.q, p.r, centerX, centerY, HEX_SIZE);
                         const corners = getHexCorners(pos.x, pos.y, HEX_SIZE - 2);
                         ctx.beginPath(); ctx.moveTo(corners[0].x, corners[0].y);
                         for(let i=1; i<6; i++) ctx.lineTo(corners[i].x, corners[i].y);
                         ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
                     });
                 }
            }

            shape.cells.forEach(c => {
                const pos = hexToPixel(c.q, c.r, 0, 0, HEX_SIZE * scale);
                const drawX = originX + pos.x;
                const drawY = originY + pos.y;
                const corners = getHexCorners(drawX, drawY, (HEX_SIZE - 2) * scale);
                
                ctx.beginPath(); ctx.moveTo(corners[0].x, corners[0].y);
                for(let i=1; i<6; i++) ctx.lineTo(corners[i].x, corners[i].y);
                ctx.closePath();
                ctx.fillStyle = shape.color; ctx.fill();
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
            });
        });

        // Draw Dashboard (Level & Time)
        const uiX = 20;
        const uiY = 80;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.roundRect(uiX, uiY, 180, 90, 10); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth=2; ctx.stroke();
        
        ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`第 ${level} 关`, uiX + 15, uiY + 25);
        
        // Time Display
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        const timeStr = `${m}:${s}`;
        ctx.fillStyle = timeLeft < 10 ? '#ef4444' : '#3b82f6';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(timeStr, uiX + 165, uiY + 25);

        // 使用与计算逻辑一致的目标分数：第一关90分，后面每关增加30分
        const target = 90 + (level - 1) * 30;
        const progress = Math.min(1, levelScore / target);
        
        ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`进度: ${levelScore} / ${target}`, uiX + 15, uiY + 50);
        
        // Progress bar
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(uiX + 15, uiY + 60, 150, 8);
        ctx.fillStyle = '#3b82f6'; ctx.fillRect(uiX + 15, uiY + 60, 150 * progress, 8);

        // Level Up Overlay
        if (showLevelUp) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText("挑战成功!", width/2, height/2 - 20);
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            ctx.fillText(`即将进入第 ${level + 1} 关...`, width/2, height/2 + 40);
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, isPortrait, sidebarSize, HEX_SIZE, level, levelScore, showLevelUp, timeLeft]);

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
            onPointerLeave={handlePointerUp}
            className="block touch-none cursor-default" 
        />
    );
};
