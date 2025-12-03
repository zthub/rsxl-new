
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound } from '../../utils/gameUtils';
import { RotateCw } from 'lucide-react';

// 俄罗斯方块形状定义
const SHAPES = [
    [[1,1,1,1]], // I
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]], // L
    [[1,1],[1,1]], // O
    [[0,1,1],[1,1,0]], // S
    [[0,1,0],[1,1,1]], // T
    [[1,1,0],[0,1,1]] // Z
];

// 动物图案绘制函数
const drawAnimal = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, animalType: number) => {
    const s = size;
    ctx.save();
    
    // 根据animalType绘制不同的动物
    switch (animalType % 7) {
        case 0: // 小熊
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - s * 0.15, y - s * 0.1, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + s * 0.15, y - s * 0.1, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
            // 鼻子
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.ellipse(x, y + s * 0.1, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 1: // 小猫
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
            ctx.fill();
            // 耳朵
            ctx.beginPath();
            ctx.moveTo(x - s * 0.2, y - s * 0.3);
            ctx.lineTo(x - s * 0.35, y - s * 0.5);
            ctx.lineTo(x - s * 0.05, y - s * 0.35);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + s * 0.2, y - s * 0.3);
            ctx.lineTo(x + s * 0.35, y - s * 0.5);
            ctx.lineTo(x + s * 0.05, y - s * 0.35);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - s * 0.12, y, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + s * 0.12, y, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 2: // 小狗
            ctx.fillStyle = '#d6d3d1';
            ctx.beginPath();
            ctx.ellipse(x, y, s * 0.4, s * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            // 耳朵
            ctx.fillStyle = '#a8a29e';
            ctx.beginPath();
            ctx.ellipse(x - s * 0.25, y - s * 0.15, s * 0.12, s * 0.2, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + s * 0.25, y - s * 0.15, s * 0.12, s * 0.2, -0.2, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - s * 0.15, y - s * 0.05, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + s * 0.15, y - s * 0.05, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 3: // 小兔
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
            ctx.fill();
            // 长耳朵
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.ellipse(x - s * 0.2, y - s * 0.4, s * 0.1, s * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + s * 0.2, y - s * 0.4, s * 0.1, s * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - s * 0.12, y, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + s * 0.12, y, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 4: // 小猪
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
            ctx.fill();
            // 鼻子
            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.ellipse(x, y + s * 0.1, s * 0.15, s * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#be185d';
            ctx.beginPath();
            ctx.arc(x - s * 0.05, y + s * 0.1, s * 0.03, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + s * 0.05, y + s * 0.1, s * 0.03, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - s * 0.15, y - s * 0.05, s * 0.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + s * 0.15, y - s * 0.05, s * 0.05, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 5: // 小鸟
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.ellipse(x, y, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            // 翅膀
            ctx.beginPath();
            ctx.ellipse(x - s * 0.2, y, s * 0.1, s * 0.2, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + s * 0.2, y, s * 0.1, s * 0.2, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - s * 0.1, y - s * 0.05, s * 0.05, 0, Math.PI * 2);
            ctx.fill();
            // 嘴巴
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(x + s * 0.15, y);
            ctx.lineTo(x + s * 0.3, y - s * 0.05);
            ctx.lineTo(x + s * 0.3, y + s * 0.05);
            ctx.fill();
            break;
        case 6: // 小鸭
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
            ctx.fill();
            // 嘴巴
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(x + s * 0.25, y);
            ctx.lineTo(x + s * 0.4, y - s * 0.05);
            ctx.lineTo(x + s * 0.4, y + s * 0.05);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - s * 0.1, y - s * 0.1, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
    
    ctx.restore();
};

interface TetrisPiece {
    shape: number[][];
    x: number;
    y: number;
    rotation: number;
    animalType: number;
    isDragging: boolean;
    dragOffsetX: number;
    dragOffsetY: number;
}

export const NewTetrisGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    
    const [currentPiece, setCurrentPiece] = useState<TetrisPiece | null>(null);
    const [placedPieces, setPlacedPieces] = useState<TetrisPiece[]>([]);
    const [score, setScore] = useState(0);
    const initializedRef = useRef(false);
    
    const BLOCK_SIZE = Math.max(30, Math.min(width, height) * 0.08); // 根据屏幕大小调整方块大小，最小30px
    
    // 生成新的方块
    const spawnNewPiece = useCallback(() => {
        const shapeIdx = Math.floor(Math.random() * SHAPES.length);
        const shape = SHAPES[shapeIdx];
        const animalType = Math.floor(Math.random() * 7);
        
        // 随机位置出现在屏幕中央区域
        const spawnX = width * 0.3 + Math.random() * width * 0.4;
        const spawnY = height * 0.3 + Math.random() * height * 0.4;
        
        setCurrentPiece({
            shape,
            x: spawnX,
            y: spawnY,
            rotation: 0,
            animalType,
            isDragging: false,
            dragOffsetX: 0,
            dragOffsetY: 0
        });
    }, [width, height]);
    
    // 旋转方块
    const rotatePiece = useCallback(() => {
        if (!currentPiece) return;
        
        const rotatedShape = currentPiece.shape[0].map((_, i) => 
            currentPiece.shape.map(row => row[i]).reverse()
        );
        
        setCurrentPiece({
            ...currentPiece,
            shape: rotatedShape,
            rotation: (currentPiece.rotation + 1) % 4
        });
        
        playSound('shoot');
    }, [currentPiece]);
    
    // 放置方块
    const placePiece = useCallback(() => {
        if (!currentPiece) return;
        
        setPlacedPieces(prev => [...prev, { ...currentPiece }]);
        setScore(prev => {
            const newScore = prev + 10;
            if (onScore) onScore(newScore);
            return newScore;
        });
        playSound('correct');
        
        // 生成新方块
        setTimeout(() => {
            spawnNewPiece();
        }, 300);
    }, [currentPiece, onScore, spawnNewPiece]);
    
    // 初始化
    useEffect(() => {
        if (isPlaying && !initializedRef.current) {
            initializedRef.current = true;
            spawnNewPiece();
        }
    }, [isPlaying, spawnNewPiece]);
    
    // 拖拽处理
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (!currentPiece) return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击在方块上
        const blockSize = BLOCK_SIZE;
        const shape = currentPiece.shape;
        const pieceX = currentPiece.x;
        const pieceY = currentPiece.y;
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    const blockX = pieceX + c * blockSize;
                    const blockY = pieceY + r * blockSize;
                    
                    if (x >= blockX && x <= blockX + blockSize &&
                        y >= blockY && y <= blockY + blockSize) {
                        setCurrentPiece({
                            ...currentPiece,
                            isDragging: true,
                            dragOffsetX: x - pieceX,
                            dragOffsetY: y - pieceY
                        });
                        try {
                            (e.target as HTMLElement).setPointerCapture(e.pointerId);
                        } catch (err) {
                            // 忽略错误
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                }
            }
        }
    }, [currentPiece, BLOCK_SIZE]);
    
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!currentPiece || !currentPiece.isDragging) return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 限制在屏幕范围内
        const blockSize = BLOCK_SIZE;
        const shape = currentPiece.shape;
        const maxWidth = shape[0].length * blockSize;
        const maxHeight = shape.length * blockSize;
        
        const newX = Math.max(0, Math.min(width - maxWidth, x - currentPiece.dragOffsetX));
        const newY = Math.max(0, Math.min(height - maxHeight, y - currentPiece.dragOffsetY));
        
        setCurrentPiece({
            ...currentPiece,
            x: newX,
            y: newY
        });
        
        e.preventDefault();
        e.stopPropagation();
    }, [currentPiece, width, height, BLOCK_SIZE]);
    
    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!currentPiece || !currentPiece.isDragging) return;
        
        // 释放指针捕获
        try {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch (err) {
            // 忽略错误
        }
        
        setCurrentPiece(prev => {
            if (!prev) return null;
            return {
                ...prev,
                isDragging: false
            };
        });
        
        // 放置方块
        placePiece();
    }, [currentPiece, placePiece]);
    
    // 渲染循环
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        frameCountRef.current++;
        
        // 1. 渲染视觉刺激背景
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);
        
        // 2. 绘制已放置的方块
        placedPieces.forEach(piece => {
            const blockSize = BLOCK_SIZE;
            const shape = piece.shape;
            
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c] !== 0) {
                        const x = piece.x + c * blockSize;
                        const y = piece.y + r * blockSize;
                        
                        // 绘制方块背景
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.fillRect(x, y, blockSize - 2, blockSize - 2);
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, blockSize - 2, blockSize - 2);
                        
                        // 绘制动物图案
                        drawAnimal(ctx, x + blockSize / 2, y + blockSize / 2, blockSize * 0.8, piece.animalType);
                    }
                }
            }
        });
        
        // 3. 绘制当前方块
        if (currentPiece) {
            const blockSize = BLOCK_SIZE;
            const shape = currentPiece.shape;
            const opacity = currentPiece.isDragging ? 0.8 : 1.0;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c] !== 0) {
                        const x = currentPiece.x + c * blockSize;
                        const y = currentPiece.y + r * blockSize;
                        
                        // 绘制方块背景（带阴影效果）
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                        ctx.shadowBlur = 8;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        ctx.fillRect(x, y, blockSize - 2, blockSize - 2);
                        ctx.shadowBlur = 0;
                        
                        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x, y, blockSize - 2, blockSize - 2);
                        
                        // 绘制动物图案
                        drawAnimal(ctx, x + blockSize / 2, y + blockSize / 2, blockSize * 0.8, currentPiece.animalType);
                    }
                }
            }
            
            ctx.restore();
        }
        
        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, currentPiece, placedPieces, BLOCK_SIZE]);
    
    // 设置Canvas高DPI支持
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        }
    }, [width, height]);
    
    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);
    
    return (
        <div className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                className="block"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />
            
            {/* 旋转按钮 - 右下角 */}
            {currentPiece && (
                <button
                    onClick={rotatePiece}
                    className="absolute bottom-8 right-8 w-16 h-16 bg-blue-500/90 backdrop-blur rounded-full flex items-center justify-center active:bg-blue-600 border-4 border-white shadow-xl transition-transform active:scale-95 pointer-events-auto z-10"
                    title="旋转方块"
                >
                    <RotateCw className="text-white w-8 h-8 stroke-2" />
                </button>
            )}
            
            {/* 分数显示 */}
            <div className="absolute top-8 left-8 bg-white/90 backdrop-blur rounded-lg px-4 py-2 shadow-lg pointer-events-none z-10">
                <div className="text-sm text-slate-600 font-semibold">分数: <span className="text-blue-600 font-bold">{score}</span></div>
            </div>
        </div>
    );
};

