import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = ['#000000', '#EF4444', '#3B82F6'];

// Shapes: I, J, L, O, S, T, Z
const SHAPES = [
    [], // Empty
    [[1,1,1,1]], // I
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]], // L
    [[1,1],[1,1]], // O
    [[0,1,1],[1,1,0]], // S
    [[0,1,0],[1,1,1]], // T
    [[1,1,0],[0,1,1]] // Z
];

export const SimultaneousTetrisGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    // Game Logic Refs
    const gridRef = useRef<number[][]>([]);
    const pieceRef = useRef({ shape: [] as number[][], x: 0, y: 0, colorIdx: 1 });
    const nextPieceRef = useRef({ shape: [] as number[][], colorIdx: 1 });
    const dropCounterRef = useRef(0);
    const dropIntervalRef = useRef(50); // Frames
    const initializedRef = useRef(false); // Track if game has been initialized
    const colorToggleRef = useRef(0);

    const getNextColorIdx = useCallback(() => {
        const idx = colorToggleRef.current % 2 === 0 ? 1 : 2;
        colorToggleRef.current += 1;
        return idx;
    }, []);

    const prepareNextPiece = useCallback(() => {
        const nextTypeIdx = Math.floor(Math.random() * 7) + 1;
        nextPieceRef.current = {
            shape: SHAPES[nextTypeIdx],
            colorIdx: getNextColorIdx()
        };
    }, [getNextColorIdx]);
    
    // 横屏判断
    const isLandscape = width > height;
    
    // Init Grid
    const initGrid = () => {
        const rows = [];
        for(let r=0; r<ROWS; r++) {
            rows.push(new Array(COLS).fill(0));
        }
        gridRef.current = rows;
    };

    // New Piece
    const spawnPiece = () => {
        // Use next piece if available, otherwise generate new one
        const hasNext = nextPieceRef.current.shape.length > 0;
        const shape = hasNext ? nextPieceRef.current.shape : SHAPES[Math.floor(Math.random() * 7) + 1];
        const colorIdx = hasNext ? nextPieceRef.current.colorIdx : getNextColorIdx();
        
        pieceRef.current = {
            shape,
            x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
            y: 0,
            colorIdx
        };
        
        // Generate next piece
        prepareNextPiece();
        
        // Check collision on spawn
        if (collide(gridRef.current, pieceRef.current)) {
            onGameOver();
        }
    };

    // Collision Check
    const collide = (grid: number[][], piece: any) => {
        const { shape, x, y } = piece;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    const gx = x + c;
                    const gy = y + r;
                    if (gx < 0 || gx >= COLS || gy >= ROWS || (gy >= 0 && grid[gy][gx] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // Merge to grid
    const merge = () => {
        const { shape, x, y, colorIdx } = pieceRef.current;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    if (y + r >= 0) {
                        gridRef.current[y + r][x + c] = colorIdx;
                    }
                }
            }
        }
    };

    // Clear Lines
    const sweep = () => {
        let lines = 0;
        outer: for (let r = ROWS - 1; r >= 0; r--) {
            for (let c = 0; c < COLS; c++) {
                if (gridRef.current[r][c] === 0) continue outer;
            }
            const row = gridRef.current.splice(r, 1)[0].fill(0);
            gridRef.current.unshift(row);
            r++;
            lines++;
        }
        if (lines > 0) {
            playSound('correct');
            onScore(lines * 100 * lines);
        }
    };

    const rotate = (dir: number) => {
        const p = pieceRef.current;
        const oldShape = p.shape;
        
        // Transpose + Reverse
        const newShape = oldShape[0].map((_, i) => oldShape.map(row => row[i]).reverse());
        
        // Wall kick simple
        const originalX = p.x;
        p.shape = newShape;
        if (collide(gridRef.current, p)) {
            p.x = originalX + 1;
            if (collide(gridRef.current, p)) {
                p.x = originalX - 1;
                if (collide(gridRef.current, p)) {
                    p.x = originalX;
                    p.shape = oldShape; // Revert
                }
            }
        }
    };

    const move = (dir: number) => {
        pieceRef.current.x += dir;
        if (collide(gridRef.current, pieceRef.current)) {
            pieceRef.current.x -= dir;
        }
    };

    const drop = () => {
        pieceRef.current.y++;
        if (collide(gridRef.current, pieceRef.current)) {
            pieceRef.current.y--;
            merge();
            sweep();
            spawnPiece();
            playSound('shoot');
        }
        dropCounterRef.current = 0;
    };

    // Init - only on first start, not on resume
    useEffect(() => {
        if (isPlaying && !initializedRef.current) {
            initGrid();
            colorToggleRef.current = 0;
            prepareNextPiece();
            spawnPiece();
            initializedRef.current = true;
        }
    }, [isPlaying, prepareNextPiece]);

    // Input - 键盘控制（桌面端）
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!isPlaying) return;
            if (e.key === 'ArrowLeft') move(-1);
            else if (e.key === 'ArrowRight') move(1);
            else if (e.key === 'ArrowDown') drop();
            else if (e.key === 'ArrowUp') rotate(1);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isPlaying]);
    

    // Loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Logic
        dropCounterRef.current++;
        if (dropCounterRef.current > dropIntervalRef.current) {
            drop();
        }

        // Render
        ctx.fillStyle = '#f0fdf4'; // Soft green bg
        ctx.fillRect(0, 0, width, height);
        
        // 优化布局计算 - 手机端优先保证游戏板大小，下一个碎片预览不影响主游戏区域
        const isMobile = width <= 768;
        const headerHeight = 80;
        // 在手机上，下一个碎片预览放在游戏板上方或下方，不占用宽度
        // 在电脑上，放在右侧
        const nextPieceWidth = isMobile ? 0 : 100;
        const nextPieceHeight = isMobile ? 70 : 0;
        
        // 手机端使用更多空间，电脑端为下一个碎片预留空间
        const widthPadding = isMobile ? 0.95 : 0.85;
        const heightPadding = isMobile ? 0.85 : 0.75;
        
        const availableWidth = width * widthPadding - nextPieceWidth;
        const availableHeight = height * heightPadding - headerHeight - nextPieceHeight;
        
        // 计算游戏板大小 - 优先保证宽度，确保所有列都能显示
        const maxBoardWidthByHeight = availableHeight * (COLS / ROWS);
        const maxBoardHeightByWidth = availableWidth / (COLS / ROWS);
        
        // 选择较小的约束，但优先保证宽度
        let boardSize;
        if (isMobile) {
            // 手机端：优先保证宽度，确保所有列显示
            boardSize = Math.min(availableWidth, maxBoardWidthByHeight);
        } else {
            // 电脑端：平衡宽度和高度
            boardSize = Math.min(availableWidth, maxBoardWidthByHeight);
        }
        
        // 计算缩放比例
        const scale = boardSize / (COLS * BLOCK_SIZE);
        const boardW = COLS * BLOCK_SIZE * scale;
        const boardH = ROWS * BLOCK_SIZE * scale;
        
        // 计算位置 - 手机端下一个碎片在下方，电脑端在右侧
        const offX = isMobile ? (width - boardW) / 2 : (width - boardW - nextPieceWidth) / 2;
        const baseOffY = (height - boardH - nextPieceHeight) / 2;
        const offY = isMobile ? baseOffY + nextPieceHeight : baseOffY;

        // Draw Board Bg
        ctx.fillStyle = '#111827';
        ctx.fillRect(offX, offY, boardW, boardH);
        
        const blockSize = BLOCK_SIZE * scale;
        const drawBlock = (c: number, r: number, colorIdx: number) => {
            if (colorIdx === 0) return;
            ctx.fillStyle = COLORS[colorIdx];
            ctx.fillRect(offX + c * blockSize, offY + r * blockSize, blockSize-1, blockSize-1);
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(offX + c * blockSize, offY + r * blockSize, blockSize-1, 4);
        };

        // Grid
        gridRef.current.forEach((row, r) => {
            row.forEach((val, c) => drawBlock(c, r, val));
        });

        // Piece
        const p = pieceRef.current;
        p.shape.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val !== 0) drawBlock(p.x + c, p.y + r, p.colorIdx);
            });
        });

        // Draw Next Piece Preview
        const nextP = nextPieceRef.current;
        if (nextP.shape.length > 0) {
            const isMobile = width <= 768;
            const previewBlockSize = blockSize * 0.5; // 缩小预览块
            
            let previewX, previewY;
            if (isMobile) {
                // 手机端：放在游戏板上方，避免被底部系统键盘遮挡
                const previewAreaTop = Math.max(10, baseOffY);
                previewX = offX + (boardW / 2) - (Math.max(...nextP.shape.map(row => row.length)) * previewBlockSize / 2);
                previewY = previewAreaTop + 10;
            } else {
                // 电脑端：放在游戏板右侧
                previewX = offX + boardW + 20;
                previewY = offY + 40;
            }
            
            // Draw "下一个" label
            ctx.fillStyle = '#1e293b';
            ctx.font = `bold ${isMobile ? '12' : '14'}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('下一个', previewX + (Math.max(...nextP.shape.map(row => row.length)) * previewBlockSize / 2), previewY - 8);
            
            // Draw next piece
            const maxWidth = Math.max(...nextP.shape.map(row => row.length));
            const centerOffsetX = (maxWidth - nextP.shape[0].length) / 2;
            nextP.shape.forEach((row, r) => {
                row.forEach((val, c) => {
                    if (val !== 0) {
                        const x = previewX + (c + centerOffsetX) * previewBlockSize;
                        const y = previewY + r * previewBlockSize;
                        ctx.fillStyle = COLORS[nextP.colorIdx];
                        ctx.fillRect(x, y, previewBlockSize - 1, previewBlockSize - 1);
                        ctx.fillStyle = 'rgba(255,255,255,0.2)';
                        ctx.fillRect(x, y, previewBlockSize - 1, 2);
                    }
                });
            });
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, isLandscape]);

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
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} className="block" />
            
            {/* 方向键控制（放到右下角） */}
            <div className="absolute bottom-8 right-8 flex flex-col items-center gap-4 pb-safe pointer-events-none">
                {/* Top Row: Up (Rotate) */}
                <button 
                    onPointerDown={(e) => { e.preventDefault(); rotate(1); }}
                    className="pointer-events-auto w-16 h-16 bg-blue-500/80 backdrop-blur rounded-full flex items-center justify-center active:bg-blue-600 border-2 border-white transition-transform active:scale-95 shadow-lg"
                >
                    <ArrowUp className="text-white w-8 h-8 stroke-2" />
                </button>

                {/* Bottom Row: Left, Down, Right */}
                <div className="flex gap-6">
                    <button 
                        onPointerDown={(e) => { e.preventDefault(); move(-1); }}
                        className="pointer-events-auto w-16 h-16 bg-blue-500/80 backdrop-blur rounded-full flex items-center justify-center active:bg-blue-600 border-2 border-white transition-transform active:scale-95 shadow-lg"
                    >
                        <ArrowLeft className="text-white w-8 h-8 stroke-2" />
                    </button>
                    <button 
                        onPointerDown={(e) => { e.preventDefault(); drop(); }}
                        className="pointer-events-auto w-16 h-16 bg-blue-500/80 backdrop-blur rounded-full flex items-center justify-center active:bg-blue-600 border-2 border-white transition-transform active:scale-95 shadow-lg"
                    >
                        <ArrowDown className="text-white w-8 h-8 stroke-2" />
                    </button>
                    <button 
                        onPointerDown={(e) => { e.preventDefault(); move(1); }}
                        className="pointer-events-auto w-16 h-16 bg-blue-500/80 backdrop-blur rounded-full flex items-center justify-center active:bg-blue-600 border-2 border-white transition-transform active:scale-95 shadow-lg"
                    >
                        <ArrowRight className="text-white w-8 h-8 stroke-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};

