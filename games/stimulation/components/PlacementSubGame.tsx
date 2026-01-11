import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '../../../utils/gameUtils';
import { Carrot3D, Radish3D, Eggplant3D, TennisRacket3D, SportShirt3D, LeafHintIcon, BallHintIcon, StepHintIcon } from './PlacementAssets';

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

export const PlacementSubGame: React.FC<{ difficulty: string; onComplete: (s: number) => void }> = ({ difficulty, onComplete }) => {
    const [level, setLevel] = useState<PlacementLevel | null>(null);
    const [gridState, setGridState] = useState<(Item | null)[][]>([]);
    const [trayItems, setTrayItems] = useState<Item[]>([]);
    const [draggingItem, setDraggingItem] = useState<Item | null>(null);
    const [celebrating, setCelebrating] = useState(false);
    const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });

    const generateLevel = useCallback(() => {
        const themes = ['vegetable', 'tennis', 'shirt'];
        const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
        const isEasy = difficulty === 'Easy';
        const isMedium = difficulty === 'Medium';
        const rows = isEasy ? 2 : 3;
        const cols = (isEasy || isMedium) ? 2 : 3;

        const items: Item[] = [];
        const rowHints: any[] = [];
        const colHints: any[] = [];

        if (selectedTheme === 'vegetable') {
            const types = ['carrot', 'radish', 'eggplant'];
            const activeTypes = types.slice(0, cols);
            activeTypes.forEach((t, i) => colHints.push({
                type: t,
                icon: (uid: string) => <div className="w-[8vmin] h-[8vmin] max-w-[48px] max-h-[48px]">{t === 'carrot' ? <Carrot3D leaves={0} uid={uid} /> : t === 'radish' ? <Radish3D leaves={0} uid={uid} /> : <Eggplant3D leaves={0} uid={uid} />}</div>
            }));
            for (let r = 0; r < rows; r++) {
                rowHints.push({ property: `prop-${r + 1}`, icon: <div className="w-[8vmin] h-[8vmin] max-w-[48px] max-h-[48px]"><LeafHintIcon count={r + 1} /></div> });
                for (let c = 0; c < cols; c++) {
                    items.push({ id: `v-${r}-${c}`, type: activeTypes[c], property: `prop-${r + 1}`, icon: (uid: string) => activeTypes[c] === 'carrot' ? <Carrot3D leaves={r + 1} uid={uid} /> : activeTypes[c] === 'radish' ? <Radish3D leaves={r + 1} uid={uid} /> : <Eggplant3D leaves={r + 1} uid={uid} /> });
                }
            }
        } else if (selectedTheme === 'tennis') {
            const colors = ['#3B82F6', '#EF4444', '#FACC15']; // Blue, Red, Yellow
            const activeColors = colors.slice(0, cols);
            activeColors.forEach((c, i) => colHints.push({ type: c, icon: (uid: string) => <div className="w-[8vmin] h-[8vmin] max-w-[48px] max-h-[48px]"><TennisRacket3D color={c} ballCount={0} uid={uid} /></div> }));
            for (let r = 0; r < rows; r++) {
                rowHints.push({ property: `prop-${r + 1}`, icon: <div className="w-[8vmin] h-[8vmin] max-w-[48px] max-h-[48px]"><BallHintIcon count={r + 1} /></div> });
                for (let c = 0; c < cols; c++) {
                    items.push({ id: `t-${r}-${c}`, type: activeColors[c], property: `prop-${r + 1}`, icon: (uid: string) => <TennisRacket3D color={activeColors[c]} ballCount={r + 1} uid={uid} /> });
                }
            }
        } else {
            const colors = ['#FACC15', '#A855F7', '#06B6D4']; // Yellow, Purple, Cyan
            const activeColors = colors.slice(0, cols);
            activeColors.forEach((c, i) => colHints.push({ type: c, icon: (uid: string) => <div className="w-[8vmin] h-[8vmin] max-w-[48px] max-h-[48px]"><SportShirt3D color={c} stripeCount={0} uid={uid} /></div> }));
            for (let r = 0; r < rows; r++) {
                rowHints.push({ property: `prop-${r + 1}`, icon: <div className="w-[8vmin] h-[8vmin] max-w-[48px] max-h-[48px]"><StepHintIcon count={r + 1} /></div> });
                for (let c = 0; c < cols; c++) {
                    items.push({ id: `s-${r}-${c}`, type: activeColors[c], property: `prop-${r + 1}`, icon: (uid: string) => <SportShirt3D color={activeColors[c]} stripeCount={r + 1} uid={uid} /> });
                }
            }
        }
        setLevel({ rows, cols, rowHints, colHints, availableItems: items });
        setGridState(Array(rows).fill(null).map(() => Array(cols).fill(null)));
        setTrayItems([...items].sort(() => Math.random() - 0.5));
        setCelebrating(false);
    }, [difficulty]);

    useEffect(() => { generateLevel(); }, [generateLevel]);

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
        setDraggingItem(null); setTouchPos({ x: 0, y: 0 });
    };

    const handleTouchStart = (item: Item, e: React.TouchEvent) => {
        setDraggingItem(item);
        setTouchPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!draggingItem) return;
        if (e.cancelable) e.preventDefault();
        setTouchPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!draggingItem) return;
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = target?.closest('[data-grid-cell]');
        if (cell) {
            const r = parseInt(cell.getAttribute('data-row') || '0');
            const c = parseInt(cell.getAttribute('data-col') || '0');
            handleDrop(r, c);
        } else {
            setDraggingItem(null); setTouchPos({ x: 0, y: 0 });
        }
    };

    if (!level) return null;

    return (
        <div className="w-full h-full flex flex-col items-center justify-between p-2 lg:p-4 overflow-hidden select-none">
            {/* Block 2: Game Board */}
            <div className="flex-1 w-full flex items-center justify-center p-2 min-h-0">
                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-4 lg:p-6 shadow-xl border border-white/80 relative">
                    {celebrating && (
                        <div className="absolute inset-0 bg-green-400/20 rounded-[32px] flex items-center justify-center z-50 backdrop-blur-sm">
                            <div className="text-4xl lg:text-6xl font-black text-green-600 animate-bounce">太棒了!</div>
                        </div>
                    )}

                    <div className="grid gap-2 lg:gap-4" style={{
                        gridTemplateColumns: `auto repeat(${level.cols}, 1fr)`
                    }}>
                        <div className="w-[10vmin] max-w-16"></div>
                        {level.colHints.map((hint, i) => (
                            <div key={i} className="flex items-center justify-center bg-white/90 rounded-xl shadow-sm border border-orange-100 p-1 aspect-square h-auto">
                                {hint.icon(`col-${i}`)}
                            </div>
                        ))}

                        {level.rowHints.map((rowHint, r) => (
                            <React.Fragment key={r}>
                                <div className="flex items-center justify-center bg-white/90 rounded-xl shadow-sm border border-green-100 p-1 aspect-square w-[12vmin] max-w-24">
                                    {rowHint.icon}
                                </div>
                                {Array(level.cols).fill(null).map((_, c) => (
                                    <div
                                        key={c}
                                        data-grid-cell
                                        data-row={r}
                                        data-col={c}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDrop(r, c)}
                                        onClick={() => draggingItem && handleDrop(r, c)}
                                        className={`
                                            w-[15vmin] h-[15vmin] max-w-32 max-h-32 rounded-[20%] border-2 lg:border-4 border-dashed flex items-center justify-center transition-all duration-300
                                            ${gridState[r][c] ? 'bg-white border-orange-200 shadow-lg scale-95' : 'bg-white/40 border-white/80'}
                                        `}
                                    >
                                        {gridState[r][c] && (
                                            <div className="w-[80%] h-[80%] animate-in zoom-in-75 duration-300 drop-shadow-xl">
                                                {gridState[r][c]?.icon(`placed-${r}-${c}`)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hint Text */}
            <div className="text-white/90 font-bold tracking-wider py-1 px-4 lg:py-2 lg:px-6 bg-orange-400/80 rounded-full text-[10px] lg:text-sm my-2 flex-shrink-0">
                ✨ 依次拖动放入格内 ✨
            </div>

            {/* Block 3: Item Tray - Compact and Transparent */}
            <div className="flex-shrink-0 flex justify-center w-full px-4 mb-2 lg:mb-6">
                <div className="w-auto max-w-full bg-white/20 backdrop-blur-3xl rounded-[24px] lg:rounded-[32px] p-2 flex flex-wrap justify-center gap-2 shadow-2xl border border-white/30 min-h-0 overflow-y-auto max-h-[35vh]">
                    {trayItems.map((item) => (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={() => setDraggingItem(item)}
                            onTouchStart={(e) => handleTouchStart(item, e)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onClick={() => setDraggingItem(item)}
                            style={{ touchAction: 'none' }}
                            className={`
                                w-[11vmin] h-[11vmin] max-w-16 max-h-16 lg:w-20 lg:h-20 bg-white/80 rounded-2xl shadow-xl hover:scale-105 active:scale-90 transition-all p-1.5 lg:p-3
                                ${draggingItem?.id === item.id ? 'ring-2 lg:ring-4 ring-brand-blue scale-105 shadow-2xl z-10' : ''}
                            `}
                        >
                            {item.icon(`tray-${item.id}`)}
                        </div>
                    ))}
                </div>
            </div>

            {draggingItem && touchPos.x > 0 && (
                <div
                    className="fixed pointer-events-none z-[9999] opacity-90 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: touchPos.x, top: touchPos.y, width: '15vmin', height: '15vmin', maxWidth: '80px', maxHeight: '80px' }}
                >
                    <div className="w-full h-full bg-white rounded-2xl shadow-2xl p-2 border-2 border-brand-blue animate-in zoom-in-95">
                        {draggingItem.icon(`ghost-${draggingItem.id}`)}
                    </div>
                </div>
            )}
        </div>
    );
};
