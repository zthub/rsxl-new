import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '../../../utils/gameUtils';
import { BumperCar3D } from './PlacementAssets';

interface Animal { id: string; name: string; icon: string; clue: string; targetId: string; }
interface Prop { id: string; label: string; color: string; shape: string; }

const ANIMALS = { sheep: '🐑', monkey: '🐒', rabbit: '🐰', panda: '🐼' };
const COLORS = [
    { n: '蓝色', c: '#3B82F6' },
    { n: '黄色', c: '#FACC15' },
    { n: '红色', c: '#EF4444' },
    { n: '绿色', c: '#4ADE80' }
];

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export const DeductionSubGame: React.FC<{ difficulty: string; onComplete: (s: number) => void }> = ({ difficulty, onComplete }) => {
    const [level, setLevel] = useState<{ animals: Animal[]; props: Prop[] } | null>(null);
    const [assigned, setAssigned] = useState<Record<string, string>>({});
    const [active, setActive] = useState<{ id: string; text: string } | null>(null);
    const [dragging, setDragging] = useState<Animal | null>(null);
    const [win, setWin] = useState(false);
    const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
    const dragStartPos = useRef({ x: 0, y: 0 });
    const audioUnlocked = useRef(false);

    // V15 - 细节优化与交互修复
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

    const speak = useCallback((t: string) => {
        if (!('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();

            // 兜底解锁
            if (!audioUnlocked.current) {
                const u0 = new SpeechSynthesisUtterance('');
                u0.volume = 0;
                window.speechSynthesis.speak(u0);
                audioUnlocked.current = true;
            }

            const u = new SpeechSynthesisUtterance(t);
            u.lang = 'zh-CN';
            u.rate = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const zhVoice = voices.find(v => v.lang.includes('zh') || v.name.includes('Chinese'));
            if (zhVoice) u.voice = zhVoice;

            window.speechSynthesis.speak(u);
        } catch (e) {
            console.warn('Speech error:', e);
        }
    }, []);

    const generate = useCallback(() => {
        const count = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 4;
        const subColors = shuffleArray(COLORS).slice(0, count);
        const props: Prop[] = subColors.map((c, i) => ({ id: `p${i}`, label: `${c.n}`, color: c.c, shape: 'bumper-car' }));
        const anims = Object.entries(ANIMALS).map(([k, v]) => ({ id: k, icon: v }));
        const shuffledAnims = shuffleArray(anims).slice(0, count);
        const targetPids = shuffleArray(props.map(p => p.id));

        // 生成线索池
        let cluePool: string[] = [];
        const targets = targetPids.map(pid => props.find(pr => pr.id === pid)!);

        if (difficulty === 'Easy') {
            // 简单：A1 给出 1 个关键线索，A2 补位“我忘了”
            if (Math.random() > 0.5) {
                cluePool = [`我喜欢${targets[0].label}`, "我忘了"];
            } else {
                // 如果 A1 要坐 T0，它说我不喜欢 T1，逻辑成立
                cluePool = [`我不喜欢${targets[1].label}`, "我忘了"];
            }
        } else if (difficulty === 'Medium') {
            // 中级：3 个动物 A1->T0, A2->T1, A3->T2
            // A1 说喜欢 T0；A2 说不喜欢 T2（那他只能选剩下的 T1）；A3 说忘了
            cluePool = [
                `我喜欢${targets[0].label}`,
                `我不喜欢${targets[2].label}`,
                "我忘了"
            ];
        } else {
            // 高级：4 个动物 A1->T0, A2->T1, A3->T2, A4->T3
            if (Math.random() > 0.5) {
                // 模版 1 (排除法)：A1:喜欢T0, A2:不喜欢T3, A3:不喜欢T1和T3, A4:我忘了
                cluePool = [
                    `我喜欢${targets[0].label}`,
                    `我不喜欢${targets[3].label}`,
                    `我不喜欢${targets[1].label}和${targets[3].label}`,
                    "我忘了"
                ];
            } else {
                // 模版 2 (肯定/否定组合)：A1:喜欢T0, A2:喜欢T1, A3:不喜欢T3, A4:我忘了
                cluePool = [
                    `我喜欢${targets[0].label}`,
                    `我喜欢${targets[1].label}`,
                    `我不喜欢${targets[3].label}`,
                    "我忘了"
                ];
            }
        }

        // 分配线索给动物（注意：targetPids[i] 对应的线索是 cluePool[i]）
        const tempAnimals: Animal[] = shuffledAnims.map((a, i) => ({
            id: a.id,
            name: '',
            icon: a.icon,
            targetId: targetPids[i],
            clue: cluePool[i] + '。'
        }));

        // 最终呈现给用户的动物列表再次随机，打乱“谁是那个说忘了的”
        setLevel({ animals: shuffleArray(tempAnimals), props: shuffleArray(props) });
        setAssigned({}); setActive(null); setDragging(null); setWin(false);
    }, [difficulty]);


    useEffect(() => { generate(); }, [generate]);

    const onPropDrop = (pid: string) => {
        if (!dragging || !level) return;
        if (dragging.targetId === pid) {
            playSound('correct');
            const newAssigned = { ...assigned, [pid]: dragging.icon };
            setAssigned(newAssigned);
            if (Object.keys(newAssigned).length === level.animals.length) { setWin(true); setTimeout(() => { onComplete(100); generate(); }, 1500); }
        } else {
            playSound('wrong');
            speak("不对哦");
        }
        setDragging(null); setTouchPos({ x: 0, y: 0 });
    };

    const handlePointerEnd = (e: React.PointerEvent) => {
        if (!dragging) return;

        // 计算移动位移，判断是点击还是拖拽 (使用 Ref 记录的初始位置进行比对)
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);

        // 如果位移小于 20px，视为“点击”而不是“拖拽”
        if (dx < 20 && dy < 20) {
            setActive({ id: dragging.id, text: dragging.clue });
            speak(dragging.clue);
            setDragging(null); setTouchPos({ x: 0, y: 0 });
            return;
        }

        // 1. 优先尝试 elementFromPoint (原逻辑)
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const propEl = target?.closest('[data-prop-target]');
        if (propEl) {
            onPropDrop(propEl.getAttribute('data-prop-id') || '');
            return;
        }

        // 2. 坐标碰撞检测兜底 (针对某些浏览器识别不准的问题)
        const targets = document.querySelectorAll('[data-prop-target]');
        for (let i = 0; i < targets.length; i++) {
            const rect = targets[i].getBoundingClientRect();
            // 增加 15px 的边缘容错
            if (e.clientX >= rect.left - 15 && e.clientX <= rect.right + 15 &&
                e.clientY >= rect.top - 15 && e.clientY <= rect.bottom + 15) {
                onPropDrop(targets[i].getAttribute('data-prop-id') || '');
                return;
            }
        }

        setDragging(null); setTouchPos({ x: 0, y: 0 });
    };

    if (!level) return null;

    return (
        <div className="w-full h-full flex flex-col items-center justify-between p-2 lg:p-6 overflow-hidden select-none pointer-events-auto">
            {/* Block 2: Animals and Targets Area */}
            <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 lg:gap-10 p-2 min-h-0">
                <div className="flex flex-wrap justify-center gap-2 lg:gap-8">
                    {level.props.map(p => (
                        <div key={p.id} data-prop-target data-prop-id={p.id} onClick={() => dragging && onPropDrop(p.id)} className={`relative w-[20vmin] h-[25vmin] max-w-48 max-h-60 flex flex-col items-center justify-end p-2 lg:p-4 rounded-[20%] border-2 lg:border-4 shadow-lg transition-all ${assigned[p.id] ? 'border-green-400 bg-white/70 scale-95 shadow-inner' : 'border-white/50 bg-white/20 border-dashed'}`}>
                            {assigned[p.id] ? <div className="text-[12vmin] lg:text-9xl mb-4 animate-in zoom-in-50">{assigned[p.id]}</div> : <div className="absolute top-4 text-white/20 text-4xl lg:text-6xl font-black">?</div>}
                            <div className="w-full h-[50%] flex items-center justify-center">
                                <BumperCar3D color={p.color} uid={p.id} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="w-auto max-w-[95vw] bg-white/20 backdrop-blur-3xl rounded-[32px] lg:rounded-[48px] p-2 lg:p-6 border border-white/20 shadow-xl overflow-visible flex flex-wrap justify-center items-center gap-4 lg:gap-8 mx-auto">
                    {level.animals.map(a => {
                        const done = Object.values(assigned).includes(a.icon);
                        return (
                            <div key={a.id} className="relative group">
                                <div
                                    onPointerDown={(e) => {
                                        if (!done) {
                                            const pos = { x: e.clientX, y: e.clientY };
                                            setDragging(a);
                                            setTouchPos(pos);
                                            dragStartPos.current = pos; // 记录绝对起始位置
                                            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                                        }
                                    }}
                                    onPointerMove={(e) => {
                                        if (dragging?.id === a.id) {
                                            setTouchPos({ x: e.clientX, y: e.clientY });
                                        }
                                    }}
                                    onPointerUp={(e) => {
                                        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                                        handlePointerEnd(e);
                                    }}
                                    onDragStart={(e) => e.preventDefault()}
                                    className={`text-[11vmin] lg:text-9xl transition-all duration-300 drop-shadow-2xl touch-none select-none ${done ? 'opacity-0 scale-0 pointer-events-none' : 'hover:scale-110 cursor-pointer active:scale-95'} ${dragging?.id === a.id ? 'opacity-40 scale-90' : ''}`}>
                                    {a.icon}
                                </div>
                                {active?.id === a.id && (
                                    <div className="absolute -top-12 lg:-top-24 left-1/2 -translate-x-1/2 bg-white px-3 lg:px-8 py-1 lg:py-4 rounded-xl lg:rounded-[20px] shadow-2xl border-2 border-orange-400 text-[10px] lg:text-xl font-black text-slate-800 whitespace-nowrap animate-in slide-in-from-bottom-2 z-[90]">
                                        {active.text}
                                        <div className="absolute -bottom-1 lg:-bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 lg:w-4 lg:h-4 bg-white border-b-2 border-r-2 border-orange-400 rotate-45"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Block 3: Ghost Copy & Win States remain outside as floating layers or absolute children */}
            {dragging && touchPos.x > 0 && (Math.abs(touchPos.x - dragStartPos.current.x) > 15 || Math.abs(touchPos.y - dragStartPos.current.y) > 15) && (
                <div className="fixed pointer-events-none z-[9999] opacity-90 -translate-x-1/2 -translate-y-[100%]" style={{ left: touchPos.x, top: touchPos.y, fontSize: '15vmin' }}>
                    <div className="drop-shadow-2xl animate-in zoom-in-75">{dragging.icon}</div>
                </div>
            )}

            {win && (
                <div className="fixed inset-0 bg-green-500/10 backdrop-blur-lg flex items-center justify-center z-[100] animate-in fade-in">
                    <div className="bg-white p-6 lg:p-10 rounded-3xl lg:rounded-[56px] shadow-2xl text-center">
                        <div className="text-4xl lg:text-7xl mb-2 lg:mb-6">🏆</div>
                        <h2 className="text-xl lg:text-3xl font-black text-slate-800">全部猜对啦！</h2>
                    </div>
                </div>
            )}

            {/* Debug Version Tag */}
            {/* Debug Version Tag */}
            <div className="absolute bottom-1 right-1 text-[8px] text-white/10 select-none">v22</div>
        </div>
    );
};
