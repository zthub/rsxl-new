
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
    
    // 检测设备方向和屏幕尺寸
    const isLandscape = width > height;
    const isTabletOrLarger = width >= 768;
    const isLandscapeTablet = isLandscape && isTabletOrLarger;
    
    // 网格配置常量
    const GRID_COLUMNS = 10; // 固定10列
    const GRID_ROWS = 20; // 固定20行
    
    const [currentPiece, setCurrentPiece] = useState<TetrisPiece | null>(null);
    const [placedPieces, setPlacedPieces] = useState<TetrisPiece[]>([]);
    const [score, setScore] = useState(0);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const initializedRef = useRef(false);
    
    // 获取canvas实际显示尺寸
    const getCanvasDisplaySize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return { width: 0, height: 0 };
        
        // 使用父容器尺寸获取实际可用空间
        const parent = canvas.parentElement;
        if (parent) {
            return { 
                width: parent.offsetWidth, 
                height: parent.offsetHeight 
            };
        }
        
        // 回退到传入的尺寸
        return { width: width, height: height };
    }, [width, height]);
    
    // 自适应方块大小计算，基于canvas实际显示尺寸和固定网格列数
    const calculateBlockSize = useCallback(() => {
        const { width: displayWidth, height: displayHeight } = canvasSize.width > 0 ? canvasSize : getCanvasDisplaySize();
        
        if (displayWidth === 0) {
            return Math.max(30, Math.min(width, height) * 0.08);
        }
        
        let blockSize;
        
        // 为平板横屏模式单独设置方块大小计算逻辑
        if (isLandscapeTablet) {
            // 在平板横屏模式下，基于宽度计算方块大小以确保10列完整显示
            // 但在计算时考虑高度限制，避免方块过大
            const widthBasedBlockSize = Math.floor(displayWidth / GRID_COLUMNS);
            const heightBasedBlockSize = Math.floor(displayHeight / GRID_ROWS);
            
            // 使用两者中的较小值，确保方块既适合宽度也适合高度
            blockSize = Math.min(widthBasedBlockSize, heightBasedBlockSize);
        } else {
            // 基于宽度计算方块大小，确保10列能完全显示
            // 这是确保10列显示的核心逻辑：将可用宽度平均分配给10列
            const blockSizeFromWidth = Math.floor(displayWidth / GRID_COLUMNS);
            
            // 同时考虑高度，计算基于高度的方块大小
            // 为了防止顶部方块变形，确保方块大小适合整个游戏区域
            const blockSizeFromHeight = Math.floor(displayHeight / GRID_ROWS);
            
            // 使用两者中的较小值，以确保方块在所有方向上都不会超出边界
            // 这 helps prevent the "lines" issue at the top by maintaining proper aspect ratio
            blockSize = Math.min(blockSizeFromWidth, blockSizeFromHeight);
        }
        
        // 确保方块大小合理，不会过大或过小
        return Math.max(15, Math.min(50, blockSize));
    }, [canvasSize, getCanvasDisplaySize, width, height, GRID_COLUMNS, GRID_ROWS, isLandscapeTablet]);
    
    // 动态计算边框宽度
    const calculateBorderWidth = useCallback(() => {
        const { width: displayWidth } = canvasSize.width > 0 ? canvasSize : getCanvasDisplaySize();
        
        if (displayWidth === 0) {
            return 2; // 默认边框宽度
        }
        
        // 基于方块大小动态计算边框，与方块大小成比例
        const blockSize = calculateBlockSize();
        return Math.max(1, Math.min(3, Math.floor(blockSize * 0.05)));
    }, [canvasSize, getCanvasDisplaySize, GRID_COLUMNS, calculateBlockSize]);
    
    // 生成新的方块
    const spawnNewPiece = useCallback(() => {
        const shapeIdx = Math.floor(Math.random() * SHAPES.length);
        const shape = SHAPES[shapeIdx];
        const animalType = Math.floor(Math.random() * 7);
        
        // 使用canvas实际尺寸进行生成位置计算
        const spawnWidth = canvasSize.width > 0 ? canvasSize.width : width;
        const spawnHeight = canvasSize.height > 0 ? canvasSize.height : height;
        
        // 使用与渲染一致的尺寸计算来确保位置准确
        const blockSize = calculateBlockSize();
        
        // 基于网格的位置计算，确保在10列范围内
        const shapeWidth = shape[0].length;
        const shapeHeight = shape.length;
        
        // 计算最大可用列数和行数（严格使用固定的GRID_COLUMNS和GRID_ROWS）
        const maxColumns = GRID_COLUMNS - shapeWidth;
        const maxRows = GRID_ROWS - shapeHeight;
        
        // 随机选择网格位置
        const gridX = Math.floor(Math.random() * (maxColumns + 1));
        const gridY = Math.max(0, Math.min(3, maxRows)); // 限制在顶部几行生成
        
        // 转换为像素位置
        const spawnX = gridX * blockSize;
        const spawnY = gridY * blockSize;
        
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
    }, [width, height, canvasSize, calculateBlockSize, GRID_COLUMNS]);
    
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
        
        // 检查是否点击在方块上 - 使用与渲染一致的尺寸计算
        const blockSize = calculateBlockSize();
        const borderWidth = calculateBorderWidth();
        const shape = currentPiece.shape;
        const pieceX = currentPiece.x;
        const pieceY = currentPiece.y;
        
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    const blockX = pieceX + c * blockSize;
                    const blockY = pieceY + r * blockSize;
                    
                    // 使用与渲染一致的尺寸计算，确保点击检测准确
                    const blockWidth = blockSize - borderWidth;
                    const blockHeight = blockSize - borderWidth;
                    
                    if (x >= blockX && x <= blockX + blockWidth &&
                        y >= blockY && y <= blockY + blockHeight) {
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
    }, [currentPiece, calculateBlockSize, calculateBorderWidth]);
    
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!currentPiece || !currentPiece.isDragging) return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 使用与渲染一致的尺寸计算
        const blockSize = calculateBlockSize();
        const shape = currentPiece.shape;
        
        const shapeWidth = shape[0].length;
        const shapeHeight = shape.length;
        
        // 使用canvas实际尺寸进行边界限制
        const boundaryWidth = canvasSize.width > 0 ? canvasSize.width : width;
        const boundaryHeight = canvasSize.height > 0 ? canvasSize.height : height;
        
        // 严格基于固定的10列网格进行边界限制
        const maxAvailableColumns = GRID_COLUMNS - shapeWidth;
        const maxGridX = Math.max(0, maxAvailableColumns);
        
        // 计算拖拽后的网格位置
        const targetGridX = Math.round((x - currentPiece.dragOffsetX) / blockSize);
        const targetGridY = Math.round((y - currentPiece.dragOffsetY) / blockSize);
        
        // 约束网格位置在有效范围内
        const constrainedGridX = Math.max(0, Math.min(maxGridX, targetGridX));
        const constrainedGridY = Math.max(0, Math.min(Math.floor(boundaryHeight / blockSize) - shapeHeight, targetGridY));
        
        // 转换为像素位置
        const newX = constrainedGridX * blockSize;
        const newY = constrainedGridY * blockSize;
        
        setCurrentPiece({
            ...currentPiece,
            x: newX,
            y: newY
        });
        
        e.preventDefault();
        e.stopPropagation();
    }, [currentPiece, width, height, calculateBlockSize, canvasSize, GRID_COLUMNS]);
    
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
        
        // 使用canvas实际尺寸进行渲染
        const renderWidth = canvasSize.width > 0 ? canvasSize.width : width;
        const renderHeight = canvasSize.height > 0 ? canvasSize.height : height;
        
        // 1. 渲染视觉刺激背景
        renderCommonBackground(ctx, renderWidth, renderHeight, frameCountRef.current, visualAcuity);
        
        // 动态计算方块大小和边框宽度
        const blockSize = calculateBlockSize();
        const borderWidth = calculateBorderWidth();
        
        // 调试信息：输出当前的尺寸计算结果
        if (frameCountRef.current % 60 === 0) { // 每秒输出一次
            console.log('Tetris Game Debug Info:', {
                canvasWidth: renderWidth,
                canvasHeight: renderHeight,
                gridColumns: GRID_COLUMNS,
                blockSize: blockSize,
                totalWidthRequired: blockSize * GRID_COLUMNS,
                columnsFit: (blockSize * GRID_COLUMNS) <= renderWidth,
                displayWidth: canvas.offsetWidth,
                displayHeight: canvas.offsetHeight
            });
        }
        
        // 2. 绘制已放置的方块
        placedPieces.forEach(piece => {
            const shape = piece.shape;
            
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c] !== 0) {
                        const x = piece.x + c * blockSize;
                        const y = piece.y + r * blockSize;
                        
                        // 绘制方块背景
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.fillRect(x, y, blockSize - borderWidth, blockSize - borderWidth);
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.lineWidth = borderWidth;
                        ctx.strokeRect(x, y, blockSize - borderWidth, blockSize - borderWidth);
                        
                        // 绘制动物图案
                        drawAnimal(ctx, x + blockSize / 2, y + blockSize / 2, blockSize * 0.8, piece.animalType);
                    }
                }
            }
        });
        
        // 3. 绘制当前方块
        if (currentPiece) {
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
                        ctx.fillRect(x, y, blockSize - borderWidth, blockSize - borderWidth);
                        ctx.shadowBlur = 0;
                        
                        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
                        ctx.lineWidth = borderWidth + 1; // 当前方块边框稍粗
                        ctx.strokeRect(x, y, blockSize - borderWidth, blockSize - borderWidth);
                        
                        // 绘制动物图案
                        drawAnimal(ctx, x + blockSize / 2, y + blockSize / 2, blockSize * 0.8, currentPiece.animalType);
                    }
                }
            }
            
            ctx.restore();
        }
        
        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, currentPiece, placedPieces, calculateBlockSize, calculateBorderWidth, canvasSize]);
    
    // 设置Canvas高DPI支持，确保方块不变形
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return { width: 0, height: 0 };
        
        const dpr = window.devicePixelRatio || 1;
        
        // 获取canvas的实际显示尺寸 - 强制使用父容器的尺寸
        const parent = canvas.parentElement;
        const parentWidth = parent ? parent.offsetWidth : width;
        const parentHeight = parent ? parent.offsetHeight : height;
        
        let displayWidth, displayHeight;
        
        // 为平板横屏模式单独设置样式，确保10列方块完整显示
        if (isLandscapeTablet) {
            // 在平板横屏模式下，强制使用固定宽高比以确保10列完整显示
            // 基于宽度计算方块大小，确保每列至少有适当像素
            const blockSize = Math.max(30, Math.floor(parentWidth / GRID_COLUMNS));
            
            // 计算显示宽度为精确的10列方块宽度
            displayWidth = blockSize * GRID_COLUMNS;
            
            // 计算基于网格的显示高度
            displayHeight = blockSize * GRID_ROWS;
            
            // 确保计算的高度不超过父容器高度
            if (displayHeight > parentHeight) {
                // 如果计算高度超过父容器，则基于高度重新计算
                const heightBasedBlockSize = Math.floor(parentHeight / GRID_ROWS);
                const heightBasedWidth = heightBasedBlockSize * GRID_COLUMNS;
                
                displayWidth = Math.min(displayWidth, heightBasedWidth);
                displayHeight = heightBasedBlockSize * GRID_ROWS;
            }
        } else {
            // 非横屏模式使用原来的逻辑
            // 计算最小宽度：确保能容纳10列方块（每列至少20像素）
            const minWidth = GRID_COLUMNS * 20;
            
            // 优先确保10列能完全显示，即使这意味着需要使用全部可用宽度
            displayWidth = Math.max(parentWidth, minWidth);
            
            // 高度使用父容器的全部高度，不再限制宽高比
            displayHeight = parentHeight;
        }
        
        // 更新canvas尺寸状态
        if (displayWidth > 0 && displayHeight > 0) {
            setCanvasSize({ width: displayWidth, height: displayHeight });
        }
        
        // 设置canvas的物理尺寸为显示尺寸乘以DPI
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        // 设置CSS尺寸为实际显示尺寸
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        }
        
        // 返回新的canvas尺寸
        return { width: displayWidth, height: displayHeight };
    }, [width, height, GRID_COLUMNS, GRID_ROWS, isLandscapeTablet]);
    
    // 窗口尺寸变化时调整所有方块位置
    const handleResize = useCallback(() => {
        // 在setupCanvas之前获取当前的方块大小
        const oldBlockSize = calculateBlockSize();
        const oldCanvasSize = canvasSize;
        
        // 设置新的canvas尺寸并获取结果
        const newCanvasSize = setupCanvas();
        
        // 重新计算方块大小
        const newBlockSize = calculateBlockSize();
        
        // 如果方块大小没有变化且canvas尺寸也没有变化，不需要调整位置
        if (oldBlockSize === newBlockSize && 
            oldCanvasSize.width === newCanvasSize.width && 
            oldCanvasSize.height === newCanvasSize.height) {
            return;
        }
        
        // 调整已放置的方块位置 - 保持相对网格位置不变
        setPlacedPieces(prevPieces => {
            return prevPieces.map(piece => {
                const shapeWidth = piece.shape[0].length;
                const shapeHeight = piece.shape.length;
                
                // 计算当前位置对应的网格位置（使用精确的网格位置计算来避免 rounding errors）
                const gridX = Math.round(piece.x / oldBlockSize);
                const gridY = Math.round(piece.y / oldBlockSize);
                
                // 使用新的方块大小重新计算像素位置
                let newX = gridX * newBlockSize;
                let newY = gridY * newBlockSize;
                
                // 使用新的canvas尺寸和方块大小计算最大可用空间
                const maxX = newCanvasSize.width - shapeWidth * newBlockSize;
                const maxY = newCanvasSize.height - shapeHeight * newBlockSize;
                
                // 确保位置不会超出边界
                newX = Math.max(0, Math.min(maxX, newX));
                newY = Math.max(0, Math.min(maxY, newY));
                
                return {
                    ...piece,
                    x: newX,
                    y: newY
                };
            });
        });
        
        // 调整当前方块位置
        if (currentPiece) {
            const shapeWidth = currentPiece.shape[0].length;
            const shapeHeight = currentPiece.shape.length;
            
            // 计算当前位置对应的网格位置（使用Math.round for more accurate grid position）
            const gridX = Math.round(currentPiece.x / oldBlockSize);
            const gridY = Math.round(currentPiece.y / oldBlockSize);
            
            // 使用新的方块大小重新计算像素位置
            let newX = gridX * newBlockSize;
            let newY = gridY * newBlockSize;
            
            // 使用新的canvas尺寸和方块大小计算最大可用空间
            const maxX = newCanvasSize.width - shapeWidth * newBlockSize;
            const maxY = newCanvasSize.height - shapeHeight * newBlockSize;
            
            // 确保位置不会超出边界
            newX = Math.max(0, Math.min(maxX, newX));
            newY = Math.max(0, Math.min(maxY, newY));
            
            setCurrentPiece(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    x: newX,
                    y: newY
                };
            });
        }
    }, [setupCanvas, calculateBlockSize, currentPiece, placedPieces, canvasSize, GRID_COLUMNS]);
    
    useEffect(() => {
        // 延迟执行以确保DOM已完全渲染
        const timer = setTimeout(() => {
            setupCanvas();
        }, 100);
        
        // 监听窗口大小变化，重新设置canvas并调整方块位置
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [setupCanvas, handleResize, width, height]);
    

    
    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);
    
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
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

