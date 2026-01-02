import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types';
import { AvocadoIcon, PearIcon } from './components/FruitPrecisionAssets';
import { Trophy, RefreshCcw, Eye, Check } from 'lucide-react';
import { playSound } from '../../utils/gameUtils';
import { renderCommonBackground } from '../../utils/visualRendering';


type FruitType = 'pear' | 'avocado';

export const FruitPrecisionGame: React.FC<GameComponentProps> = ({
    width,
    height,
    isPlaying,
    onScore,
    onGameOver,
}) => {
    const [score, setScore] = useState(0);
    const [targetCount, setTargetCount] = useState(0);
    const [targetType, setTargetType] = useState<FruitType>('pear');
    const [options, setOptions] = useState<number[]>([]);
    const [grid, setGrid] = useState<boolean[]>([]);
    const [dimensions, setDimensions] = useState({ rows: 0, cols: 40 }); // 初始列数设为40，使水果变小
    const [showVictory, setShowVictory] = useState(false);
    const [victoryMessage, setVictoryMessage] = useState('');

    const [markedIndices, setMarkedIndices] = useState<Set<number>>(new Set());

    // Canvas / Background Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    const isFirstStartRef = useRef(true);

    // Background Animation Loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        ctx.clearRect(0, 0, width, height);
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);
        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity]);

    // Handle Canvas DPI and resizing
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

    // Start/Stop Animation
    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    // 核心逻辑：动态计算网格能容纳多少行
    const calculateGrid = useCallback(() => {
        if (width <= 0 || height <= 0) return;

        // 我们希望列数固定为40，让水果足够小
        const cols = 40;
        const cellSize = width / cols;

        // 计算除去头部和交互区后的可用高度
        // Header ~50px, Options ~60px. Footer removed.
        // Increased safe margin to prevent occlusion.
        const headerHeight = 150;
        const footerHeight = 20; // Margin
        const availableHeight = height - headerHeight - footerHeight;

        // 计算剩余高度能放几行，减去一点安全余量防止溢出
        const rows = Math.floor(availableHeight / cellSize);

        if (rows > 0 && (rows !== dimensions.rows || cols !== dimensions.cols)) {
            setDimensions({ rows, cols });
        }
    }, [width, height, dimensions.rows, dimensions.cols]);

    useEffect(() => {
        calculateGrid();
    }, [calculateGrid]);

    const initLevel = useCallback(() => {
        if (dimensions.rows === 0) return;

        const total = dimensions.rows * dimensions.cols;
        const newGrid = new Array(total).fill(false);

        const currentTarget = Math.random() > 0.5 ? 'pear' : 'avocado';
        setTargetType(currentTarget);

        // 根据用户要求：不同的水果最多5个
        const count = Math.floor(Math.random() * 5) + 1; // 随机 1 到 5 个
        setTargetCount(count);

        const indices = new Set<number>();
        while (indices.size < count) {
            indices.add(Math.floor(Math.random() * total));
        }
        indices.forEach(idx => newGrid[idx] = true);

        setGrid(newGrid);
        setMarkedIndices(new Set()); // Clear marks for new level

        const opts = new Set<number>();
        opts.add(count);
        while (opts.size < 4) {
            // 生成干扰项，确保在合理范围内
            const wrong = count + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
            if (wrong >= 0 && wrong <= 10) opts.add(wrong);
        }
        setOptions(Array.from(opts).sort((a, b) => a - b));
        setShowVictory(false);
    }, [dimensions]);

    useEffect(() => {
        if (isPlaying) {
            if (isFirstStartRef.current) {
                setScore(0);
                isFirstStartRef.current = false;
            }
            initLevel();
        } else {
            isFirstStartRef.current = true;
        }
    }, [isPlaying, initLevel]);

    const handleOptionClick = (val: number) => {
        if (!isPlaying || showVictory) return;

        if (val === targetCount) {
            playSound('correct');
            setScore(s => s + 10);
            onScore(10);
            setVictoryMessage('回答正确！');
            setShowVictory(true);
            setTimeout(() => {
                initLevel();
            }, 1000);
        } else {
            playSound('wrong');
            // 不结束游戏，只是提示错误或扣分
            onScore(-5);
        }
    };

    const toggleMark = (index: number) => {
        if (!isPlaying || showVictory) return;
        setMarkedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    return (
        <div className="relative w-full h-full overflow-hidden select-none">
            {/* Background Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none z-0"
            />

            {/* Content Layer */}
            <div className="absolute inset-0 z-10 flex flex-col w-full h-full">

                {/* Victory/Message Overlay */}
                {showVictory && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
                        <div className="bg-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
                            <span className="text-xl font-bold text-green-600">{victoryMessage}</span>
                        </div>
                    </div>
                )}

                {/* Custom Header Area - Fully transparent */}
                <div className="flex flex-col items-center py-2 shrink-0">
                    <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
                        找出所有的 {targetType === 'pear' ? '雪梨' : '牛油果'}
                        {targetType === 'pear' ? <PearIcon className="w-5 h-5" /> : <AvocadoIcon className="w-5 h-5" />}
                    </h2>

                </div>

                {/* 交互选项区 - Fully transparent container, solid buttons */}
                <div className="relative z-20 flex justify-center gap-2 md:gap-4 py-2 px-4 shrink-0">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => handleOptionClick(opt)}
                            className="flex-1 max-w-[80px] h-10 bg-white rounded-lg border border-slate-200 active:scale-90 active:bg-blue-50 transition-all flex items-center justify-center group shadow-sm hover:shadow-md"
                        >
                            <span className="text-lg font-black text-slate-700 group-hover:text-blue-600">{opt}</span>
                            <span className="ml-0.5 text-xs text-slate-400 font-bold">个</span>
                        </button>
                    ))}
                </div>

                {/* 水果网格区 - Fully transparent background, Solid Fruits */}
                <div className="flex-1 relative z-10 w-full overflow-hidden bg-transparent mb-2">
                    {dimensions.rows > 0 && (
                        <div
                            className="grid w-full h-full"
                            style={{
                                gridTemplateColumns: `repeat(${dimensions.cols}, 1fr)`,
                                gridTemplateRows: `repeat(${dimensions.rows}, 1fr)`,
                            }}
                        >
                            {grid.map((isTarget, i) => {
                                const isMarked = markedIndices.has(i);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => toggleMark(i)}
                                        className={`relative flex items-center justify-center w-full h-full p-[1px] cursor-pointer transition-all ${isMarked ? '' : 'hover:scale-110'}`}
                                    >
                                        {targetType === 'pear' ? (
                                            isTarget ? <PearIcon className="w-full h-full drop-shadow-sm" /> : <AvocadoIcon className="w-full h-full" />
                                        ) : (
                                            isTarget ? <AvocadoIcon className="w-full h-full drop-shadow-sm" /> : <PearIcon className="w-full h-full" />
                                        )}
                                        {isMarked && (
                                            <>
                                                <div className="absolute inset-0 m-0.5 border-[3px] border-red-500 rounded-full pointer-events-none shadow-sm" />
                                                <div className="absolute bottom-0 right-0 pointer-events-none translate-x-[10%] translate-y-[10%]">
                                                    <Check className="w-5 h-5 text-green-600 drop-shadow-md stroke-[5]" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
