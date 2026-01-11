import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { PlacementSubGame } from './components/PlacementSubGame';
import { DeductionSubGame } from './components/DeductionSubGame';

type GameMode = 'placement' | 'deduction';

export const LogicReasoningGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore, difficulty: initialDifficulty = 'Easy' }) => {
    const [mode, setMode] = useState<GameMode>('placement');
    const [difficulty, setDifficulty] = useState<string>(initialDifficulty);

    // Canvas / Background Status
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    // Background Animation Loop
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        ctx.clearRect(0, 0, width, height);

        // Use the same stimulation background as other games in this category
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity]);

    // Setup Canvas with DPI support
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

    const handleLevelComplete = (score: number) => {
        onScore(score);
    };

    return (
        <div className="relative w-full h-full overflow-hidden select-none flex flex-col items-center justify-center">
            {/* Background Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none z-0"
            />

            {/* Game UI Layer - Centered Container */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-h-screen lg:max-h-[85vh]">

                {/* Header / Mode Switcher - Fixed at top of relative container or floating */}
                <div className="mb-2 lg:mb-8 flex items-center gap-2 lg:gap-4 bg-white/40 backdrop-blur-xl p-1 lg:p-2 rounded-3xl shadow-2xl border border-white/40 animate-in slide-in-from-top-4 duration-500 scale-[0.8] lg:scale-100 mt-1 lg:mt-0">
                    <div className="flex p-0.5 lg:p-1 bg-slate-400/20 rounded-2xl">
                        <button
                            onClick={() => setMode('placement')}
                            className={`px-4 lg:px-6 py-1.5 lg:py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all duration-300 ${mode === 'placement' ? 'bg-orange-500 text-white shadow-lg scale-105' : 'text-slate-700 hover:bg-white/40'
                                }`}
                        >
                            柜子摆放
                        </button>
                        <button
                            onClick={() => setMode('deduction')}
                            className={`px-4 lg:px-6 py-1.5 lg:py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all duration-300 ${mode === 'deduction' ? 'bg-blue-500 text-white shadow-lg scale-105' : 'text-slate-700 hover:bg-white/40'
                                }`}
                        >
                            语音推理
                        </button>
                    </div>

                    <div className="h-5 lg:h-6 w-[1px] bg-slate-400/30 mx-1"></div>

                    <div className="flex gap-1.5 lg:gap-2">
                        {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-extrabold transition-all duration-300 ${difficulty === d
                                    ? 'bg-brand-blue text-white shadow-md scale-105'
                                    : 'bg-white/40 text-slate-700 hover:bg-white/60'
                                    }`}
                            >
                                {d === 'Easy' ? '简单' : d === 'Medium' ? '中级' : '高级'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sub Game Container - Centered */}
                <div className="flex-1 w-full flex items-center justify-center overflow-visible relative">
                    {mode === 'placement' ? (
                        <PlacementSubGame
                            key={`placement-${difficulty}`}
                            difficulty={difficulty}
                            onComplete={handleLevelComplete}
                        />
                    ) : (
                        <DeductionSubGame
                            key={`deduction-${difficulty}`}
                            difficulty={difficulty}
                            onComplete={handleLevelComplete}
                        />
                    )}
                </div>
            </div>

            <style>{`
                @keyframes zoom-in-50 {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-in {
                    animation-duration: 400ms;
                    animation-fill-mode: both;
                    animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .zoom-in-50 {
                    animation-name: zoom-in-50;
                }
            `}</style>
        </div>
    );
};
