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

    const audioUnlocked = useRef(false);

    useEffect(() => {
        const unlock = () => {
            if (audioUnlocked.current) return;
            try {
                if (!('speechSynthesis' in window)) return;
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance('');
                u.volume = 0;
                window.speechSynthesis.speak(u);
                audioUnlocked.current = true;
                window.removeEventListener('touchstart', unlock);
                window.removeEventListener('mousedown', unlock);
            } catch (e) { }
        };
        window.addEventListener('touchstart', unlock, { passive: true });
        window.addEventListener('mousedown', unlock);
        return () => {
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('mousedown', unlock);
        };
    }, []);

    return (
        <div className="relative w-full h-[100dvh] overflow-hidden select-none flex flex-col items-center justify-start bg-slate-100">
            {/* Background Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none z-0"
            />

            {/* Block 1: Floating Header Menu - Compact, no background bar */}
            <div className="flex-shrink-0 flex flex-wrap items-center justify-center gap-2 lg:gap-4 mt-2 lg:mt-4 z-20 scrollbar-hide">
                <div className="flex bg-white/40 backdrop-blur-xl rounded-2xl p-1 shadow-xl border border-white/40">
                    <button
                        onClick={() => setMode('placement')}
                        className={`px-3 lg:px-6 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${mode === 'placement' ? 'bg-orange-500 text-white shadow-lg scale-105' : 'text-slate-700 hover:bg-white/40'}`}
                    >
                        柜子摆放
                    </button>
                    <button
                        onClick={() => setMode('deduction')}
                        className={`px-3 lg:px-6 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${mode === 'deduction' ? 'bg-blue-500 text-white shadow-lg scale-105' : 'text-slate-700 hover:bg-white/40'}`}
                    >
                        语音推理
                    </button>
                </div>

                <div className="flex bg-white/40 backdrop-blur-xl rounded-2xl p-1 shadow-xl border border-white/40 gap-1">
                    {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                        <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={`px-3 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-black transition-all ${difficulty === d ? 'bg-brand-blue text-white shadow-md scale-105' : 'text-slate-600 hover:bg-white/40'}`}
                        >
                            {d === 'Easy' ? '简单' : d === 'Medium' ? '中级' : '高级'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Block 2 & 3: Sub Game Area (Fluid) */}
            <div id="sub-game-container" className="flex-1 w-full relative overflow-y-auto overflow-x-hidden flex flex-col items-center">
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

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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
                body {
                    overscroll-behavior: none;
                    touch-action: pan-x pan-y;
                }
            `}</style>
            {/* Version Tag */}
            <div className="absolute bottom-1 right-1 text-[8px] text-slate-400 select-none pointer-events-none">v22</div>
        </div>
    );
};
