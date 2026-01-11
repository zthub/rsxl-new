import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/gameUtils';
import { Carrot3D, Radish3D, Corn3D, TennisRacket3D, SportShirt3D, LeafHintIcon, BallHintIcon, StepHintIcon } from './PlacementAssets';

interface Item {
    id: string;
    type: string;
    property: string;
    icon: (uid: string) => React.ReactNode;
}

interface PlacementLevel {
    rows: number;
    cols: number;
    rowHints: { label: string; property: string; icon: React.ReactNode }[];
    colHints: { label: string; type: string; icon: (uid: string) => React.ReactNode }[];
    availableItems: Item[];
}

interface PlacementSubGameProps {
    difficulty: string;
    onComplete: (score: number) => void;
}

export const PlacementSubGame: React.FC<PlacementSubGameProps> = ({ difficulty, onComplete }) => {
    const [level, setLevel] = useState<PlacementLevel | null>(null);
    const [gridState, setGridState] = useState<(Item | null)[][]>([]);
    const [trayItems, setTrayItems] = useState<Item[]>([]);
    const [draggingItem, setDraggingItem] = useState<Item | null>(null);
    const [celebrating, setCelebrating] = useState(false);
    const [scale, setScale] = useState(1);

    // 监听高度变化以自适应缩放 (适配横屏)
    useEffect(() => {
        const handleResize = () => {
            const h = window.innerHeight;
            // 如果高度小于 600px，开始按比例缩放
            if (h < 600) {
                setScale(Math.max(0.5, h / 720)); // 最低缩放到 0.5
            } else {
                setScale(1);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const generateLevel = useCallback(() => {
        const themes = ['vegetable', 'tennis', 'shirt'];
        const selectedTheme = themes[Math.floor(Math.random() * themes.length)];

        const isEasy = difficulty === 'Easy';
        const isMedium = difficulty === 'Medium';

        const rows = isEasy ? 2 : 3;
        const cols = (isEasy || isMedium) ? 2 : 3; // Hard is 3x3

        const items: Item[] = [];
        const rowHints: any[] = [];
        const colHints: any[] = [];

        if (selectedTheme === 'vegetable') {
            const types = ['carrot', 'radish', 'corn'];
            const activeTypes = types.slice(0, cols);
            activeTypes.forEach((t, i) => colHints.push({
                type: t,
                icon: (uid: string) => (
                    <div className="w-12 h-12">
                        {t === 'carrot' ? <Carrot3D leaves={0} uid={uid} /> : t === 'radish' ? <Radish3D leaves={0} uid={uid} /> : <Corn3D kernels={0} uid={uid} />}
                    </div>
                )
            }));
            for (let r = 0; r < rows; r++) {
                rowHints.push({
                    property: `prop-${r + 1}`,
                    icon: <div className="w-12 h-12"><LeafHintIcon count={r + 1} /></div>
                });
                for (let c = 0; c < cols; c++) {
                    items.push({
                        id: `v-${r}-${c}`,
                        type: activeTypes[c],
                        property: `prop-${r + 1}`,
                        icon: (uid: string) => (
                            activeTypes[c] === 'carrot' ? <Carrot3D leaves={r + 1} uid={uid} /> :
                                activeTypes[c] === 'radish' ? <Radish3D leaves={r + 1} uid={uid} /> :
                                    <Corn3D kernels={r + 1} uid={uid} />
                        )
                    });
                }
            }
        } else if (selectedTheme === 'tennis') {
            const colors = ['#60A5FA', '#F87171', '#22C55E']; // 蓝，红，绿
            const activeColors = colors.slice(0, cols);
            activeColors.forEach((c, i) => colHints.push({
                type: c,
                icon: (uid: string) => (
                    <div className="w-12 h-12">
                        <TennisRacket3D color={c} ballCount={0} uid={uid} />
                    </div>
                )
            }));
            for (let r = 0; r < rows; r++) {
                rowHints.push({
                    property: `prop-${r + 1}`,
                    icon: <div className="w-12 h-12"><BallHintIcon count={r + 1} /></div>
                });
                for (let c = 0; c < cols; c++) {
                    items.push({
                        id: `t-${r}-${c}`,
                        type: activeColors[c],
                        property: `prop-${r + 1}`,
                        icon: (uid: string) => <TennisRacket3D color={activeColors[c]} ballCount={r + 1} uid={uid} />
                    });
                }
            }
        } else {
            const colors = ['#FBBF24', '#A78BFA', '#2DD4BF']; // 黄，紫，青
            const activeColors = colors.slice(0, cols);
            activeColors.forEach((c, i) => colHints.push({
                type: c,
                icon: (uid: string) => (
                    <div className="w-12 h-12">
                        <SportShirt3D color={c} stripeCount={0} uid={uid} />
                    </div>
                )
            }));
            for (let r = 0; r < rows; r++) {
                rowHints.push({
                    property: `prop-${r + 1}`,
                    icon: <div className="w-12 h-12"><StepHintIcon count={r + 1} color="#94A3B8" /></div>
                });
                for (let c = 0; c < cols; c++) {
                    items.push({
                        id: `s-${r}-${c}`,
                        type: activeColors[c],
                        property: `prop-${r + 1}`,
                        icon: (uid: string) => <SportShirt3D color={activeColors[c]} stripeCount={r + 1} uid={uid} />
                    });
                }
            }
        }

        setLevel({ rows, cols, rowHints, colHints, availableItems: items });
        setGridState(Array(rows).fill(null).map(() => Array(cols).fill(null)));
        setTrayItems([...items].sort(() => Math.random() - 0.5));
        setCelebrating(false);
    }, [difficulty]);

    useEffect(() => {
        generateLevel();
    }, [generateLevel]);

    const handleDrop = (r: number, c: number) => {
        if (!draggingItem || !level) return;
        if (draggingItem.type === level.colHints[c].type && draggingItem.property === level.rowHints[r].property) {
            playSound('correct');
            const newGrid = [...gridState];
            newGrid[r][c] = draggingItem;
            setGridState(newGrid);
            setTrayItems(prev => prev.filter(i => i.id !== draggingItem.id));
            if (trayItems.length === 1) {
                setCelebrating(true);
                setTimeout(() => { onComplete(100); generateLevel(); }, 1500);
            }
        } else {
            playSound('wrong');
        }
        setDraggingItem(null);
    };

    if (!level) return null;

    // 动态计算尺寸以适配横屏 (不使用 Tailwind 前缀在 style 中)
    const isLarge = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const cellSize = level.cols > 2 ? (isLarge ? 'w-24 h-24' : 'w-20 h-20') : (level.rows > 2 ? (isLarge ? 'w-32 h-32' : 'w-24 h-24') : (isLarge ? 'w-40 h-40' : 'w-32 h-32'));
    const iconSize = level.cols > 2 ? (isLarge ? 'w-16 h-16' : 'w-12 h-12') : (level.rows > 2 ? (isLarge ? 'w-24 h-24' : 'w-16 h-16') : (isLarge ? 'w-28 h-28' : 'w-24 h-24'));

    const hintColWidth = isLarge ? 80 : 60;
    const gridItemWidth = level.cols > 2 ? (isLarge ? 110 : 90) : (level.rows > 2 ? (isLarge ? 130 : 110) : (isLarge ? 160 : 140));
    const gapSize = level.cols > 2 ? (isLarge ? 12 : 8) : (isLarge ? 20 : 12);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full pointer-events-auto py-1 lg:py-2">
            <div
                className="bg-white/60 backdrop-blur-2xl rounded-[32px] lg:rounded-[48px] p-4 lg:p-6 shadow-2xl border border-white/80 relative animate-in zoom-in-95 duration-500 max-w-full origin-center"
                style={{ transform: `scale(${scale})` }}
            >
                {celebrating && (
                    <div className="absolute inset-0 bg-green-400/10 rounded-[32px] lg:rounded-[48px] flex items-center justify-center z-50 pointer-events-none">
                        <div className="text-4xl lg:text-5xl font-black text-green-600 drop-shadow-2xl animate-bounce">太棒了!</div>
                    </div>
                )}

                <div className="grid items-center justify-center" style={{
                    gridTemplateColumns: `${hintColWidth}px repeat(${level.cols}, ${gridItemWidth}px)`,
                    gap: `${gapSize}px`
                }}>
                    <div className="h-10 lg:h-12"></div>
                    {level.colHints.map((hint, i) => (
                        <div key={i} className="flex items-center justify-center bg-white/80 rounded-xl lg:rounded-2xl shadow-sm border border-orange-100 p-1 transform -rotate-1 hover:rotate-0 transition-transform h-12 lg:h-14">
                            {hint.icon(`col-${i}`)}
                        </div>
                    ))}

                    {level.rowHints.map((rowHint, r) => (
                        <React.Fragment key={r}>
                            <div className="flex items-center justify-center bg-white/80 rounded-xl lg:rounded-2xl shadow-sm border border-green-100 p-1 transform rotate-1 hover:rotate-0 transition-transform h-20 lg:h-24">
                                {rowHint.icon}
                            </div>
                            {Array(level.cols).fill(null).map((_, c) => (
                                <div
                                    key={c}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(r, c)}
                                    onClick={() => draggingItem && handleDrop(r, c)}
                                    className={`
                                        ${cellSize} rounded-[24px] lg:rounded-[28px] border-4 border-dashed flex items-center justify-center transition-all duration-300
                                        ${gridState[r][c] ? 'bg-white border-orange-200 shadow-md' : 'bg-white/30 border-white/60 hover:bg-white/50 hover:scale-105'}
                                    `}
                                >
                                    {gridState[r][c] && (
                                        <div className={`${iconSize} animate-in zoom-in-75 duration-300 drop-shadow-lg`}>
                                            {gridState[r][c]?.icon(`placed-${r}-${c}`)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Tray Area - Better spacing and layout */}
            <div
                className="mt-2 lg:mt-6 bg-white/50 backdrop-blur-xl rounded-[24px] lg:rounded-[40px] p-2 lg:p-4 flex flex-wrap justify-center gap-2 lg:gap-3 shadow-2xl border border-white/40 max-w-[95%] lg:max-w-[90%] mx-auto origin-center"
                style={{ transform: `scale(${scale * 0.9})` }}
            >
                {trayItems.map((item) => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDraggingItem(item)}
                        onClick={() => setDraggingItem(item)}
                        className={`
                            ${level.cols > 2 ? 'w-14 h-14 p-1' : 'w-16 h-16 p-2'} lg:w-20 lg:h-20 bg-white rounded-2xl lg:rounded-3xl cursor-grab active:cursor-grabbing shadow-lg hover:scale-110 active:scale-95 transition-all duration-300
                            ${draggingItem?.id === item.id ? 'ring-4 lg:ring-6 ring-brand-blue/30 scale-105 opacity-60' : ''}
                        `}
                    >
                        {item.icon(`tray-${item.id}`)}
                    </div>
                ))}
            </div>

            <div className={`mt-2 lg:mt-6 text-white font-black tracking-widest drop-shadow-lg py-1.5 px-6 lg:py-2 lg:px-8 bg-gradient-to-r from-brand-blue/60 to-purple-500/60 rounded-full backdrop-blur-md animate-pulse scale-75 lg:scale-90 ${scale < 0.8 ? 'hidden' : ''}`}>
                🌟 将下面的物品放到对应的格子里吧 🌟
            </div>
        </div>
    );
};
