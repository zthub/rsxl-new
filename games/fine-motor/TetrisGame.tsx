
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = ['#000000', '#EF4444', '#F59E0B', '#FCD34D', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

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

export const TetrisGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    // Game Logic Refs
    const gridRef = useRef<number[][]>([]);
    const pieceRef = useRef({ shape: [] as number[][], x: 0, y: 0, colorIdx: 0 });
    const dropCounterRef = useRef(0);
    const dropIntervalRef = useRef(50); // Frames
    const initializedRef = useRef(false); // Track if game has been initialized
    
    // UI State for score? Parent handles it.
    
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
        const typeIdx = Math.floor(Math.random() * 7) + 1;
        const shape = SHAPES[typeIdx];
        pieceRef.current = {
            shape,
            x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
            y: 0,
            colorIdx: typeIdx
        };
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
            spawnPiece();
            initializedRef.current = true;
        }
    }, [isPlaying]);

    // Input
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
        
        const boardW = COLS * BLOCK_SIZE;
        const boardH = ROWS * BLOCK_SIZE;
        const offX = (width - boardW) / 2;
        const offY = (height - boardH) / 2;

        // Draw Board Bg
        ctx.fillStyle = '#111827';
        ctx.fillRect(offX, offY, boardW, boardH);
        
        const drawBlock = (c: number, r: number, colorIdx: number) => {
            if (colorIdx === 0) return;
            ctx.fillStyle = COLORS[colorIdx];
            ctx.fillRect(offX + c * BLOCK_SIZE, offY + r * BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(offX + c * BLOCK_SIZE, offY + r * BLOCK_SIZE, BLOCK_SIZE-1, 4);
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

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    return (
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} width={width} height={height} className="block" />
            
            {/* Touch Controls Overlay - Hidden on Desktop (lg+) to support tablets */}
            <div className="absolute bottom-8 left-0 w-full flex flex-col items-center gap-4 pb-safe pointer-events-none lg:hidden">
                {/* Top Row: Up (Rotate) */}
                <button 
                    onPointerDown={(e) => { e.preventDefault(); rotate(1); }}
                    className="pointer-events-auto w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center active:bg-white/40 border border-white/30 transition-transform active:scale-95"
                >
                    <ArrowUp className="text-white w-8 h-8" />
                </button>

                {/* Bottom Row: Left, Down, Right */}
                <div className="flex gap-6">
                    <button 
                        onPointerDown={(e) => { e.preventDefault(); move(-1); }}
                        className="pointer-events-auto w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center active:bg-white/40 border border-white/30 transition-transform active:scale-95"
                    >
                        <ArrowLeft className="text-white w-8 h-8" />
                    </button>
                    <button 
                        onPointerDown={(e) => { e.preventDefault(); drop(); }}
                        className="pointer-events-auto w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center active:bg-white/40 border border-white/30 transition-transform active:scale-95"
                    >
                        <ArrowDown className="text-white w-8 h-8" />
                    </button>
                    <button 
                        onPointerDown={(e) => { e.preventDefault(); move(1); }}
                        className="pointer-events-auto w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center active:bg-white/40 border border-white/30 transition-transform active:scale-95"
                    >
                        <ArrowRight className="text-white w-8 h-8" />
                    </button>
                </div>
            </div>
        </div>
    );
};
