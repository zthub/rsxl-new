import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/gameUtils';

interface Animal { id: string; name: string; icon: string; clue: string; targetId: string; }
interface Prop { id: string; label: string; color: string; shape: string; }

const ANIMALS = { sheep: '🐑', monkey: '🐒', rabbit: '🐰', panda: '🐼' };
const SHAPES = [{ t: 'square', l: '正方形' }, { t: 'triangle', l: '三角形' }, { t: 'circle', l: '圆形' }];
const COLORS = [{ n: '蓝色', c: '#60A5FA' }, { n: '黄色', c: '#FACC15' }, { n: '红色', c: '#EF4444' }, { n: '绿色', c: '#4ADE80' }];

export const DeductionSubGame: React.FC<{ difficulty: string; onComplete: (s: number) => void }> = ({ difficulty, onComplete }) => {
    const [level, setLevel] = useState<{ animals: Animal[]; props: Prop[] } | null>(null);
    const [assigned, setAssigned] = useState<Record<string, string>>({});
    const [active, setActive] = useState<{ id: string; text: string } | null>(null);
    const [dragging, setDragging] = useState<Animal | null>(null);
    const [win, setWin] = useState(false);
    const [scale, setScale] = useState(1);

    // 监听高度变化以自适应缩放
    useEffect(() => {
        const handleResize = () => {
            const h = window.innerHeight;
            if (h < 600) {
                setScale(Math.max(0.5, h / 720));
            } else {
                setScale(1);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const speak = (t: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(t);
            u.lang = 'zh-CN';
            u.pitch = 1.8;
            u.rate = 1.1;
            window.speechSynthesis.speak(u);
        }
    };

    const generate = useCallback(() => {
        const count = difficulty === 'Easy' ? 2 : (difficulty === 'Medium' ? 3 : 4);
        const selColors = [...COLORS].sort(() => 0.5 - Math.random()).slice(0, count);
        const props: Prop[] = selColors.map((c, i) => ({ id: `p${i}`, label: c.n, color: c.c, shape: SHAPES[i % SHAPES.length].t }));
        const selAnimals = Object.entries(ANIMALS).slice(0, count).sort(() => 0.5 - Math.random());

        const animals: Animal[] = selAnimals.map(([key, icon], i) => {
            const target = props[i];
            const name = (ANIMALS as any)[key];
            const animalName = key === 'sheep' ? '小羊' : key === 'monkey' ? '小猴' : key === 'rabbit' ? '小兔' : '熊猫';
            let clue = "";
            if (i === 0) clue = `我喜欢${target.label}的碰碰车`;
            else if (Math.random() < 0.3) clue = `我不喜欢${props[(i + 1) % count].label}的`;
            else if (Math.random() < 0.6) clue = `我忘了我想坐哪台，反正不是${props[(i + 1) % count].label}的`;
            else clue = `我和${selAnimals[i - 1][1]}喜欢的是不一样的`;

            return { id: key, name: animalName, icon, clue, targetId: target.id };
        });

        setLevel({ animals, props });
        setAssigned({});
        setActive(null);
        setWin(false);
    }, [difficulty]);

    useEffect(() => { generate(); }, [generate]);

    const onPropDrop = (pid: string) => {
        if (!dragging) return;
        if (dragging.targetId === pid) {
            playSound('correct');
            const next = { ...assigned, [pid]: dragging.id };
            setAssigned(next);
            if (Object.keys(next).length === level?.animals.length) {
                setWin(true);
                setTimeout(() => { onComplete(100); generate(); }, 2000);
            }
        } else {
            playSound('wrong');
            speak("不对哦，再想一想吧");
        }
        setDragging(null);
    };

    if (!level) return null;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full pointer-events-auto py-2">
            {/* Upper Area: Props (Cars) */}
            <div
                className="flex justify-center gap-4 lg:gap-10 mb-6 lg:mb-16 origin-center transition-transform"
                style={{ transform: `scale(${scale})` }}
            >
                {level.props.map(p => (
                    <div key={p.id} onDragOver={e => e.preventDefault()} onDrop={() => onPropDrop(p.id)} onClick={() => dragging && onPropDrop(p.id)}
                        className={`relative w-28 h-32 lg:w-40 lg:h-44 flex flex-col items-center justify-end p-2 lg:p-4 rounded-[32px] lg:rounded-[40px] border-4 transition-all ${assigned[p.id] ? 'border-green-400 bg-white/60 shadow-lg' : 'border-white/40 bg-white/20 hover:bg-white/40 border-dashed'}`}>
                        <div className="w-20 h-12 lg:w-28 lg:h-16 rounded-t-[32px] lg:rounded-t-[40px] relative shadow-xl" style={{ backgroundColor: p.color }}>
                            <div className="absolute top-2 lg:top-3 left-1/2 -translate-x-1/2 w-6 lg:w-8 h-4 lg:h-6 bg-white/30 rounded flex items-center justify-center">
                                {p.shape === 'circle' ? <div className="w-2 lg:w-3 h-2 lg:h-3 rounded-full bg-white" /> : p.shape === 'triangle' ? <div className="w-0 h-0 border-l-[4px] lg:border-l-[6px] border-r-[4px] lg:border-r-[6px] border-b-[6px] lg:border-b-[9px] border-white" /> : <div className="w-2 lg:w-3 h-2 lg:h-3 bg-white" />}
                            </div>
                        </div>
                        <div className="mt-2 lg:mt-4 text-[10px] lg:text-xs font-bold text-slate-600">{p.label}</div>
                        {assigned[p.id] && <div className="absolute -top-6 lg:-top-10 text-5xl lg:text-7xl animate-bounce">{(ANIMALS as any)[assigned[p.id]]}</div>}
                    </div>
                ))}
            </div>

            {/* Middle Area: Alreert/Clue bubble */}
            <div className="h-16 lg:h-24 flex items-center mt-2 lg:mt-0" style={{ transform: `scale(${scale > 0.8 ? 1 : 0.8})` }}>
                {active ? (
                    <div className="bg-white p-3 lg:p-6 rounded-2xl lg:rounded-3xl shadow-xl border-4 border-brand-blue relative animate-in zoom-in-75">
                        <div className="text-base lg:text-xl font-black">{active.text}</div>
                    </div>
                ) : <div className="text-white/60 text-sm lg:text-base font-bold animate-pulse">点击小动物听声音</div>}
            </div>

            {/* Bottom Area: Animals tray */}
            <div
                className="flex gap-4 lg:gap-8 mt-4 lg:mt-12 bg-white/30 p-4 lg:p-8 rounded-[32px] lg:rounded-[50px] origin-center"
                style={{ transform: `scale(${scale * 0.9})` }}
            >
                {level.animals.map(a => {
                    const done = Object.values(assigned).includes(a.id);
                    return (
                        <div key={a.id} draggable={!done} onDragStart={() => setDragging(a)} onClick={() => !done && (dragging ? onPropDrop(a.targetId) : (setActive({ id: a.id, text: a.clue }), speak(a.clue)))}
                            className={`text-6xl lg:text-8xl transition-all ${done ? 'opacity-10 scale-50' : 'hover:scale-110 cursor-pointer'} ${dragging?.id === a.id ? 'opacity-50' : ''}`}>
                            {a.icon}
                        </div>
                    );
                })}
            </div>

            {win && (
                <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="text-4xl lg:text-6xl font-black text-green-600 animate-bounce">太棒了!</div>
                </div>
            )}
        </div>
    );
};
