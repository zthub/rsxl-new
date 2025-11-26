
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { playSound } from '../../utils/gameUtils';

// Maze Cell
interface Cell {
    x: number; y: number;
    walls: boolean[]; // [Top, Right, Bottom, Left]
    visited: boolean;
}

export const MazeGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    const [level, setLevel] = useState(1);
    const [cols, setCols] = useState(8); // Initial size
    const [rows, setRows] = useState(8);
    
    const mazeRef = useRef<Cell[]>([]);
    const playerRef = useRef({ c: 0, r: 0 }); 
    const goalRef = useRef({ c: 0, r: 0 });

    // Virtual Joystick State
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef<{x:number, y:number} | null>(null);
    const dragCurrentRef = useRef<{x:number, y:number} | null>(null);
    const idleTimerRef = useRef(0);

    // Initialize Maze with Braiding (Interference Lines)
    const generateMaze = useCallback(() => {
        const newMaze: Cell[] = [];
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                newMaze.push({ x: c, y: r, walls: [true, true, true, true], visited: false });
            }
        }

        const stack: Cell[] = [];
        const start = newMaze[0];
        start.visited = true;
        stack.push(start);

        const getIndex = (c: number, r: number) => {
            if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
            return c + r * cols;
        };

        // 1. Perfect Maze Generation (Recursive Backtracker)
        while(stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            
            const top = newMaze[getIndex(current.x, current.y - 1)];
            const right = newMaze[getIndex(current.x + 1, current.y)];
            const bottom = newMaze[getIndex(current.x, current.y + 1)];
            const left = newMaze[getIndex(current.x - 1, current.y)];

            if (top && !top.visited) neighbors.push({ cell: top, dir: 0 }); 
            if (right && !right.visited) neighbors.push({ cell: right, dir: 1 }); 
            if (bottom && !bottom.visited) neighbors.push({ cell: bottom, dir: 2 }); 
            if (left && !left.visited) neighbors.push({ cell: left, dir: 3 }); 

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                current.walls[next.dir] = false;
                const opposite = (next.dir + 2) % 4;
                next.cell.walls[opposite] = false;
                next.cell.visited = true;
                stack.push(next.cell);
            } else {
                stack.pop();
            }
        }

        // 2. Braiding: Remove some internal walls to create loops (Interference lines)
        // Difficulty Control: Braiding increases with level.
        // Level 1: 0% (No loops, simple tree)
        // Level 2: 5%
        // ...
        // Cap at 25%
        const braidProb = Math.min(0.25, Math.max(0, (level - 1) * 0.05));

        for (let i = 0; i < newMaze.length; i++) {
            // Skip edges to avoid opening map boundaries
            const cell = newMaze[i];
            if (cell.x === 0 || cell.x === cols - 1 || cell.y === 0 || cell.y === rows - 1) continue;

            if (Math.random() < braidProb) {
                const dir = Math.floor(Math.random() * 4);
                if (cell.walls[dir]) {
                    let neighborIdx = -1;
                    if (dir === 0) neighborIdx = getIndex(cell.x, cell.y - 1);
                    if (dir === 1) neighborIdx = getIndex(cell.x + 1, cell.y);
                    if (dir === 2) neighborIdx = getIndex(cell.x, cell.y + 1);
                    if (dir === 3) neighborIdx = getIndex(cell.x - 1, cell.y);

                    if (neighborIdx !== -1) {
                        cell.walls[dir] = false;
                        const neighbor = newMaze[neighborIdx];
                        const opposite = (dir + 2) % 4;
                        neighbor.walls[opposite] = false;
                    }
                }
            }
        }

        mazeRef.current = newMaze;
        playerRef.current = { c: 0, r: 0 };
        goalRef.current = { c: cols - 1, r: rows - 1 };
        
    }, [cols, rows, level]);

    useEffect(() => {
        if (isPlaying) generateMaze();
    }, [isPlaying, generateMaze]);

    // Movement Logic
    const movePlayer = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): boolean => {
        const { c, r } = playerRef.current;
        const idx = c + r * cols;
        const cell = mazeRef.current[idx];
        if (!cell) return false;

        let moved = false;
        if (dir === 'UP' && !cell.walls[0]) { playerRef.current.r--; moved = true; }
        if (dir === 'RIGHT' && !cell.walls[1]) { playerRef.current.c++; moved = true; }
        if (dir === 'DOWN' && !cell.walls[2]) { playerRef.current.r++; moved = true; }
        if (dir === 'LEFT' && !cell.walls[3]) { playerRef.current.c--; moved = true; }

        if (moved) {
            idleTimerRef.current = 0;
            if (playerRef.current.c === goalRef.current.c && playerRef.current.r === goalRef.current.r) {
                playSound('correct');
                onScore(100 * level);
                setTimeout(() => {
                    setLevel(l => l + 1);
                    // Slower growth: +1 instead of +2 per level
                    setCols(prev => Math.min(25, prev + 1));
                    setRows(prev => Math.min(25, prev + 1));
                }, 500);
            }
        }
        return moved;
    };

    // Handle Virtual Joystick
    const handlePointerDown = (e: React.PointerEvent) => {
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        dragCurrentRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDraggingRef.current) {
            dragCurrentRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handlePointerUp = () => {
        isDraggingRef.current = false;
        dragStartRef.current = null;
        dragCurrentRef.current = null;
    };

    // Keyboard
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!isPlaying) return;
            if (e.key === 'ArrowUp') movePlayer('UP');
            if (e.key === 'ArrowDown') movePlayer('DOWN');
            if (e.key === 'ArrowLeft') movePlayer('LEFT');
            if (e.key === 'ArrowRight') movePlayer('RIGHT');
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isPlaying, cols, rows]); 

    // Render & Loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dynamic Cell Size
        const padding = 20;
        const topOffset = 80; 
        const availW = width - padding * 2;
        const availH = height - topOffset - padding;
        const cellSize = Math.min(availW / cols, availH / rows);

        // Process Virtual Joystick Movement
        if (isDraggingRef.current && dragStartRef.current && dragCurrentRef.current) {
            const dx = dragCurrentRef.current.x - dragStartRef.current.x;
            const dy = dragCurrentRef.current.y - dragStartRef.current.y;
            const dist = Math.hypot(dx, dy);
            
            // Threshold matches visual cell size for 1:1 feel, clamped for usability
            const threshold = Math.max(30, cellSize * 0.8); 

            if (dist > threshold) {
                let moved = false;
                if (Math.abs(dx) > Math.abs(dy)) {
                    moved = movePlayer(dx > 0 ? 'RIGHT' : 'LEFT');
                } else {
                    moved = movePlayer(dy > 0 ? 'DOWN' : 'UP');
                }
                
                if (moved) {
                    // Reset anchor to current position for continuous 1:1 dragging
                    dragStartRef.current = { ...dragCurrentRef.current };
                }
            }
        } else {
            idleTimerRef.current++; 
        }

        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(0, 0, width, height);
        
        const startX = (width - cellSize * cols) / 2;
        const startY = topOffset + (availH - cellSize * rows) / 2;

        ctx.lineCap = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#334155';

        // Draw Maze
        mazeRef.current.forEach(cell => {
            const cx = startX + cell.x * cellSize;
            const cy = startY + cell.y * cellSize;

            ctx.beginPath();
            if (cell.walls[0]) { ctx.moveTo(cx, cy); ctx.lineTo(cx + cellSize, cy); } 
            if (cell.walls[1]) { ctx.moveTo(cx + cellSize, cy); ctx.lineTo(cx + cellSize, cy + cellSize); }
            if (cell.walls[2]) { ctx.moveTo(cx + cellSize, cy + cellSize); ctx.lineTo(cx, cy + cellSize); }
            if (cell.walls[3]) { ctx.moveTo(cx, cy + cellSize); ctx.lineTo(cx, cy); }
            ctx.stroke();
        });

        // Goal
        const gx = startX + goalRef.current.c * cellSize + cellSize/2;
        const gy = startY + goalRef.current.r * cellSize + cellSize/2;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath(); ctx.arc(gx, gy, cellSize * 0.3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `${cellSize*0.4}px sans-serif`; 
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('🏁', gx, gy + 2);

        // Player
        const px = startX + playerRef.current.c * cellSize + cellSize/2;
        const py = startY + playerRef.current.r * cellSize + cellSize/2;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(px, py, cellSize * 0.3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(px - cellSize*0.1, py - cellSize*0.05, cellSize*0.08, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + cellSize*0.1, py - cellSize*0.05, cellSize*0.08, 0, Math.PI*2); ctx.fill();

        // Joystick Visualization
        if (isDraggingRef.current && dragStartRef.current && dragCurrentRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const sx = dragStartRef.current.x - rect.left;
            const sy = dragStartRef.current.y - rect.top;
            const cx = dragCurrentRef.current.x - rect.left;
            const cy = dragCurrentRef.current.y - rect.top;
            
            ctx.fillStyle = 'rgba(37, 99, 235, 0.2)'; 
            ctx.beginPath(); ctx.arc(sx, sy, 40, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)'; ctx.lineWidth = 2; ctx.stroke();

            ctx.fillStyle = '#1d4ed8'; 
            ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2); ctx.fill();
            
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx, cy); ctx.stroke();
        } else if (idleTimerRef.current > 180 && level === 1) {
            const cx = width / 2;
            const cy = height - 100;
            const pulse = Math.sin(Date.now() / 200) * 5;
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
            ctx.beginPath(); ctx.arc(cx, cy, 50 + pulse, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
            ctx.textAlign='center'; ctx.fillText("按住拖动", cx, cy);
            ctx.globalAlpha = 1.0;
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, cols, rows, level]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    return (
        <div className="relative w-full h-full">
            <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="block touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />
        </div>
    );
};
