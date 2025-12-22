
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound } from '../../utils/gameUtils';
import { HelpCircle } from 'lucide-react';

// 游戏素材池
const ANIMALS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦆', '🦉', '🐙'];

type GamePhase = 'MEMORIZE' | 'HIDING_ANIMATION' | 'GUESS' | 'REVEAL';

export const WhosHidingGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    // 游戏状态
    const [phase, setPhase] = useState<GamePhase>('MEMORIZE');
    const [currentPair, setCurrentPair] = useState<string[]>([]);
    const [hiddenIndex, setHiddenIndex] = useState<number>(0); // 0 or 1 (左或右)
    const [options, setOptions] = useState<string[]>([]);
    const [message, setMessage] = useState<string>('请记住它们！');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [curtainHeight, setCurtainHeight] = useState(0);

    // Canvas 引用
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    const initializedRef = useRef(false); // Track if game has been initialized
    
    // 初始化回合
    const startRound = useCallback(() => {
        // 随机选2个不同的动物
        const shuffled = [...ANIMALS].sort(() => 0.5 - Math.random());
        const pair = [shuffled[0], shuffled[1]];
        setCurrentPair(pair);
        
        // 随机选一个要藏起来的 (0或1)
        const targetIdx = Math.floor(Math.random() * 2);
        setHiddenIndex(targetIdx);
        
        // 生成选项：正确答案 + 2个干扰项 (干扰项不能是当前显示的另一个动物，也不能是正确答案)
        const targetAnimal = pair[targetIdx];
        const otherAnimal = pair[targetIdx === 0 ? 1 : 0];
        
        // 从剩余动物中选2个干扰项
        const distractors = shuffled.slice(2, 4);
        const choicePool = [targetAnimal, ...distractors].sort(() => 0.5 - Math.random());
        
        setOptions(choicePool);
        
        // 重置状态
        setPhase('MEMORIZE');
        setCurtainHeight(0);
        setMessage('请记住它们！');
        setSelectedOption(null);

        // 1.5秒后进入遮挡阶段
        setTimeout(() => {
            if (isPlaying) setPhase('HIDING_ANIMATION');
        }, 1500);

    }, [isPlaying]);

    // 初始化游戏 - only on first start, not on resume
    useEffect(() => {
        if (isPlaying && !initializedRef.current) {
            startRound();
            initializedRef.current = true;
        }
    }, [isPlaying, startRound]);

    // 处理猜测
    const handleGuess = (animal: string) => {
        if (phase !== 'GUESS') return;
        
        setSelectedOption(animal);
        const correctAnimal = currentPair[hiddenIndex];

        if (animal === correctAnimal) {
            playSound('correct');
            setMessage('答对了！');
            onScore(100);
            setPhase('REVEAL');
            setTimeout(startRound, 2000);
        } else {
            playSound('wrong');
            onScore(-10);
            setMessage('再试一次！');
            // 选错了不立即结束，可以再选，或者稍作延迟
            setTimeout(() => {
                setSelectedOption(null);
                setMessage('谁藏起来了？');
            }, 500);
        }
    };

    // 动画循环 (负责背景和窗帘动画)
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        
        // 1. 渲染视觉刺激背景
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);
        
        // 计算布局
        const windowSize = Math.min(width * 0.35, height * 0.35); // 窗户大小
        const gap = width * 0.1;
        const totalW = windowSize * 2 + gap;
        const startX = (width - totalW) / 2;
        const startY = height * 0.15;

        // 绘制两个窗户背景 (白色，高亮)
        const drawWindow = (index: number, content: string) => {
            const wx = startX + index * (windowSize + gap);
            const wy = startY;
            
            // 窗框
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(wx, wy, windowSize, windowSize, 20);
            ctx.fill();
            
            // 边框
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#3b82f6'; // 蓝色窗框
            ctx.stroke();

            // 动物内容
            ctx.font = `${windowSize * 0.6}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            
            // 如果不是完全遮挡状态，或者是揭示阶段，或者是未被选中的那个窗户，则显示动物
            const isTargetWindow = index === hiddenIndex;
            const shouldHide = isTargetWindow && (phase === 'GUESS' || phase === 'HIDING_ANIMATION');
            
            // 总是先绘制动物，帘子盖在上面
            ctx.fillText(content, wx + windowSize/2, wy + windowSize/2 + windowSize * 0.05);

            // 绘制帘子/遮挡物
            if (isTargetWindow) {
                let h = 0;
                if (phase === 'HIDING_ANIMATION') {
                    // 动画阶段：帘子下落
                    setCurtainHeight(prev => {
                        const next = Math.min(windowSize, prev + windowSize * 0.05);
                        if (next >= windowSize && phase === 'HIDING_ANIMATION') {
                            // 动画结束，切换状态（这里不能直接setState，否则会导致循环渲染问题，通常在外部控制或通过Ref）
                            // 为了简化，我们在animate里只做绘制，状态切换用useEffect辅助或容忍一帧延迟
                            return next;
                        }
                        return next;
                    });
                    h = curtainHeight;
                } else if (phase === 'GUESS') {
                    h = windowSize;
                } else if (phase === 'REVEAL') {
                    // 揭示阶段：帘子升起
                     h = 0; // 瞬间升起或者动画
                }

                if (h > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(wx, wy, windowSize, h, 20); // 简单的裁剪可能有问题，直接覆盖
                    ctx.clip(); // 裁剪区域设为窗户大小，防止帘子超出圆角

                    // 绘制百叶窗或帘子
                    ctx.fillStyle = '#fca5a5'; // 红色窗帘
                    ctx.fillRect(wx, wy, windowSize, h);
                    
                    // 帘子纹理
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    for(let lineY = wy; lineY < wy + h; lineY += 20) {
                        ctx.beginPath(); ctx.moveTo(wx, lineY); ctx.lineTo(wx + windowSize, lineY); ctx.stroke();
                    }

                    // 问号
                    if (h > windowSize * 0.8) {
                        ctx.fillStyle = '#fff';
                        ctx.font = `bold ${windowSize * 0.4}px sans-serif`;
                        ctx.fillText('?', wx + windowSize/2, wy + windowSize/2);
                    }
                    ctx.restore();
                }
            }
        };

        if (currentPair.length === 2) {
            drawWindow(0, currentPair[0]);
            drawWindow(1, currentPair[1]);
        }
        
        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, currentPair, hiddenIndex, phase, curtainHeight]);

    // 处理动画状态转换的副作用
    useEffect(() => {
        if (phase === 'HIDING_ANIMATION') {
            const timer = setTimeout(() => {
                setPhase('GUESS');
                setMessage('谁藏起来了？');
            }, 600); // 动画持续时间
            return () => clearTimeout(timer);
        }
    }, [phase]);

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
        <div className="relative w-full h-full overflow-hidden">
            {/* 1. Canvas 层 (背景 + 窗户动画) */}
            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* 2. 交互 UI 层 */}
            <div className="absolute inset-0 flex flex-col justify-end pb-12 items-center pointer-events-none">
                
                {/* 提示文字 */}
                <div className="mb-8 bg-white/90 px-8 py-3 rounded-full shadow-lg backdrop-blur-sm transform transition-all duration-300">
                    <h3 className={`text-2xl font-bold ${phase === 'REVEAL' ? 'text-green-600' : 'text-slate-700'}`}>
                        {message}
                    </h3>
                </div>

                {/* 选项按钮区 (仅在 GUESS 阶段显示) */}
                <div className={`
                    flex gap-4 md:gap-8 transition-all duration-500 pointer-events-auto
                    ${phase === 'GUESS' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
                `}>
                    {options.map((animal, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleGuess(animal)}
                            disabled={phase !== 'GUESS'}
                            className={`
                                w-20 h-20 md:w-28 md:h-28 rounded-2xl text-4xl md:text-6xl shadow-xl border-4 transition-all transform hover:-translate-y-2 active:scale-95 flex items-center justify-center
                                ${selectedOption === animal 
                                    ? (animal === currentPair[hiddenIndex] ? 'bg-green-100 border-green-500 scale-110' : 'bg-red-100 border-red-500 animate-shake')
                                    : 'bg-white border-white hover:border-blue-300'
                                }
                            `}
                        >
                            {animal}
                        </button>
                    ))}
                </div>
            </div>
            
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};
