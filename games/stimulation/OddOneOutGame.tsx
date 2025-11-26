
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { playSound, ODD_ONE_PAIRS } from '../../utils/gameUtils';
import { renderCommonBackground } from '../../utils/visualRendering';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

export const OddOneOutGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, difficulty: initialDifficulty = 'Easy' }) => {
    // 游戏逻辑状态
    const [internalDifficulty, setInternalDifficulty] = useState<Difficulty>(initialDifficulty as Difficulty);
    const [levelData, setLevelData] = useState<{items: string[], targetIndex: number, cols: number} | null>(null);
    const [shakingIndex, setShakingIndex] = useState<number | null>(null);
    const [celebrating, setCelebrating] = useState(false);

    // Canvas / 背景状态
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    // --- 背景动画循环 ---
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        // 关键修复：如果 canvas 不存在，则直接返回，但不中断循环逻辑（虽然这里直接返回了，但通过 ref 检查确保组件挂载）
        // 如果这里直接返回会导致循环中断，但只要组件渲染了 canvas，ref 就不为空。
        if (!canvas) return; 
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        
        ctx.clearRect(0, 0, width, height);
        
        // 渲染与合成大西瓜完全一致的闪烁刺激背景
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity]);

    useEffect(() => {
        // 只要开始游戏，就启动动画循环
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    // --- 游戏关卡生成逻辑 ---
    const generateLevel = useCallback(() => {
        setCelebrating(false);
        setShakingIndex(null);

        let cols = 3;
        let pairs = ODD_ONE_PAIRS.level1;
        
        if (internalDifficulty === 'Easy') {
            cols = 3; 
            pairs = ODD_ONE_PAIRS.level1; 
        } else if (internalDifficulty === 'Medium') {
            cols = 4; 
            pairs = ODD_ONE_PAIRS.level2; 
        } else {
            cols = 5; 
            pairs = ODD_ONE_PAIRS.level3; 
        }

        const totalItems = cols * cols;
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        
        const swap = Math.random() > 0.5;
        const commonChar = swap ? pair[1] : pair[0];
        const oddChar = swap ? pair[0] : pair[1];

        const targetIndex = Math.floor(Math.random() * totalItems);
        const items = new Array(totalItems).fill(commonChar);
        items[targetIndex] = oddChar;

        setLevelData({ items, targetIndex, cols });
    }, [internalDifficulty]);

    useEffect(() => {
        if (isPlaying) {
            generateLevel();
        } else {
            setLevelData(null);
        }
    }, [isPlaying, generateLevel]);

    const handleItemClick = (index: number) => {
        if (!isPlaying || celebrating || !levelData) return;

        if (index === levelData.targetIndex) {
            playSound('correct');
            setCelebrating(true);
            onScore(100);
            setTimeout(() => {
                generateLevel();
            }, 800);
        } else {
            playSound('wrong');
            setShakingIndex(index);
            onScore(-10);
            setTimeout(() => setShakingIndex(null), 500);
        }
    };

    // 计算网格大小
    const minDim = Math.min(width, height);
    const padding = 20;
    const availableSize = minDim - padding * 2 - 100; // 留出 UI 空间
    
    // 限制方块最大尺寸
    const maxCellSize = internalDifficulty === 'Easy' ? 90 : (internalDifficulty === 'Medium' ? 80 : 65);
    
    // 确保 levelData 存在时才计算，否则使用默认值
    const cols = levelData ? levelData.cols : 3;
    const calculatedSize = (availableSize / cols) - 10;
    const cellSize = Math.min(calculatedSize, maxCellSize);
    const fontSize = cellSize * 0.6;

    return (
        <div className="relative w-full h-full overflow-hidden select-none">
            {/* 1. 背景层 Canvas - 始终渲染以保证动画循环正常运行 */}
            <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="absolute inset-0 pointer-events-none z-0"
            />

            {/* 2. 游戏 UI 层 - 背景透明以显示 Canvas */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
                
                {/* 难度选择器 - 使用半透明白色背景 */}
                <div className="mb-6 flex gap-2 bg-white/30 backdrop-blur-sm p-1 rounded-full shadow-lg border border-white/20">
                    {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
                        <button
                            key={d}
                            onClick={() => setInternalDifficulty(d)}
                            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all ${
                                internalDifficulty === d 
                                ? 'bg-brand-blue text-white shadow-md transform scale-105' 
                                : 'text-slate-800 hover:bg-white/30'
                            }`}
                        >
                            {d === 'Easy' ? '简单' : d === 'Medium' ? '中等' : '困难'}
                        </button>
                    ))}
                </div>

                {/* 游戏网格 - 仅当数据存在时显示 */}
                {levelData && (
                    <div 
                        className="transition-all duration-300"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${levelData.cols}, 1fr)`,
                            gap: '12px',
                            padding: '10px',
                        }}
                    >
                        {levelData.items.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleItemClick(index)}
                                className={`
                                    flex items-center justify-center rounded-xl shadow-sm border border-white/30
                                    transition-all duration-200 
                                    ${shakingIndex === index ? 'animate-shake bg-red-400/80 ring-2 ring-red-400' : 'hover:scale-105 active:scale-95'}
                                    ${celebrating && index === levelData.targetIndex ? 'scale-125 bg-green-400/80 ring-4 ring-green-400 rotate-12 z-20 shadow-2xl' : 'bg-white/30'}
                                `}
                                style={{
                                    width: `${cellSize}px`,
                                    height: `${cellSize}px`,
                                    fontSize: `${fontSize}px`,
                                    // 使用极低的透明度 (bg-white/30) 确保背景闪烁能透过来
                                    backdropFilter: 'none', 
                                }}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-6px) rotate(-5deg); }
                    75% { transform: translateX(6px) rotate(5deg); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
};
