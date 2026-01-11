import React from 'react';

// --- 3D 辅助组件：带唯一 ID 的渐变 ---
const GradientDef = ({ id, colors }: { id: string, colors: string[] }) => (
    <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
    </defs>
);

const RowItemIcon = ({ count, children }: { count: number, children: (i: number) => React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`w-full h-1/4 flex items-center justify-center ${i >= count ? 'opacity-10' : ''}`}>
                {children(i)}
            </div>
        ))}
    </div>
);

// --- 1. 蔬菜系列 ---
export const Carrot3D = ({ leaves = 1, uid = "" }: { leaves?: number, uid?: string }) => {
    const gradId = `carrotGrad-${uid}`;
    const leafId = `leafGrad-${uid}`;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
            <GradientDef id={gradId} colors={["#FB923C", "#9A3412"]} />
            <GradientDef id={leafId} colors={["#4ADE80", "#166534"]} />
            <g transform="translate(50, 35)">
                {Array.from({ length: Math.max(1, leaves) }).map((_, i) => (
                    <path
                        key={i}
                        d="M0 0 Q10 -20 0 -35 Q-10 -20 0 0"
                        fill={leaves === 0 ? "none" : `url(#${leafId})`}
                        stroke="#166534" strokeWidth={leaves === 0 ? "2" : "1"}
                        transform={`rotate(${(i - (Math.max(1, leaves) - 1) / 2) * 45})`}
                    />
                ))}
            </g>
            <path d="M50 35 Q75 35 60 90 Q50 100 40 90 Q25 35 50 35" fill={`url(#${gradId})`} />
        </svg>
    );
};

export const Radish3D = ({ leaves = 1, uid = "" }: { leaves?: number, uid?: string }) => {
    const gradId = `radishGrad-${uid}`;
    const leafId = `leafGrad-${uid}`;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
            <GradientDef id={gradId} colors={["#F8FAFC", "#94A3B8"]} />
            <GradientDef id={leafId} colors={["#A3E635", "#3F6212"]} />
            <g transform="translate(50, 35)">
                {Array.from({ length: Math.max(1, leaves) }).map((_, i) => (
                    <path
                        key={i}
                        d="M0 0 Q12 -25 0 -40 Q-12 -25 0 0"
                        fill={leaves === 0 ? "none" : `url(#${leafId})`}
                        stroke="#3F6212" strokeWidth={leaves === 0 ? "2" : "1"}
                        transform={`rotate(${(i - (Math.max(1, leaves) - 1) / 2) * 45})`}
                    />
                ))}
            </g>
            <path d="M50 35 Q70 35 70 75 Q70 95 50 95 Q30 95 30 75 Q30 35 50 35" fill={`url(#${gradId})`} />
        </svg>
    );
};

export const Eggplant3D = ({ leaves = 1, uid = "" }: { leaves?: number, uid?: string }) => {
    const gradId = `eggGrad-${uid}`;
    const leafId = `leafGrad-${uid}`;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
            <GradientDef id={gradId} colors={["#A855F7", "#581C87"]} />
            <GradientDef id={leafId} colors={["#4ADE80", "#166534"]} />
            <g transform="translate(50, 35)">
                {Array.from({ length: Math.max(1, leaves) }).map((_, i) => (
                    <path
                        key={i}
                        d="M0 0 Q10 -25 0 -45 Q-10 -25 0 0"
                        fill={leaves === 0 ? "none" : `url(#${leafId})`}
                        stroke="#064E3B" strokeWidth={leaves === 0 ? "3" : "1.5"}
                        transform={`rotate(${(i - (Math.max(1, leaves) - 1) / 2) * 45})`}
                    />
                ))}
            </g>
            <path d="M50 30 Q85 30 85 65 Q85 95 50 95 Q15 95 15 65 Q15 30 50 30" fill={`url(#${gradId})`} />
        </svg>
    );
};

// --- 2. 网球与球拍系列 ---
export const TennisBall3D = ({ uid = "" }: { uid?: string }) => {
    const gradId = `ballGrad-${uid}`;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <GradientDef id={gradId} colors={["#D9F99D", "#65A30D"]} />
            <circle cx="50" cy="50" r="40" fill={`url(#${gradId})`} />
            <path d="M20 50 Q50 20 80 50 M20 60 Q50 90 80 60" fill="none" stroke="white" strokeWidth="3" opacity="0.5" />
        </svg>
    );
};

export const TennisRacket3D = ({ color = "#60A5FA", ballCount = 0, uid = "" }: { color?: string, ballCount?: number, uid?: string }) => {
    const gradId = `frameGrad-${uid}-${color.replace('#', '')}`;
    // 修复颜色奇怪的问题：根据主色调选择合适的阴影色，避免红/黄配深蓝产生脏色
    const darkColor = color.toUpperCase() === '#EF4444' ? '#991B1B' :
        (color.toUpperCase() === '#FACC15' ? '#A16207' : '#1E40AF');
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <GradientDef id={gradId} colors={[color, darkColor]} />
            <rect x="46" y="65" width="8" height="30" rx="2" fill="#334155" />
            <ellipse cx="50" cy="38" rx="28" ry="32" fill="none" stroke={`url(#${gradId})`} strokeWidth="7" />
            <g opacity="0.2" stroke="#94A3B8" strokeWidth="1">
                {Array.from({ length: 7 }).map((_, i) => (
                    <React.Fragment key={i}>
                        <line x1={25} y1={20 + i * 6} x2={75} y2={20 + i * 6} />
                        <line x1={30 + i * 7} y1={10} x2={30 + i * 7} y2={65} />
                    </React.Fragment>
                ))}
            </g>
            {ballCount > 0 && Array.from({ length: ballCount }).map((_, i) => (
                <g key={i} transform={`translate(${65 + (i % 2) * 15}, ${55 + (Math.floor(i / 2)) * 15}) scale(0.25)`}>
                    <TennisBall3D uid={`${uid}-ball-${i}`} />
                </g>
            ))}
        </svg>
    );
};

// --- 3. 运动服系列 ---
export const SportShirt3D = ({ color = "#F87171", stripeCount = 1, uid = "" }: { color?: string, stripeCount?: number, uid?: string }) => {
    const gradId = `shirtGrad-${uid}-${color.replace('#', '')}`;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <GradientDef id={gradId} colors={[color, "#991B1B"]} />
            <path d="M20 20 L35 15 L50 20 L65 15 L80 20 L80 80 L20 80 Z" fill={`url(#${gradId})`} />
            <path d="M20 20 L5 35 L15 45 L20 40 Z" fill={`url(#${gradId})`} />
            <path d="M80 20 L95 35 L85 45 L80 40 Z" fill={`url(#${gradId})`} />
            {stripeCount > 0 && Array.from({ length: stripeCount }).map((_, i) => (
                <rect key={i} x="30" y={35 + i * 15} width="40" height="8" fill="white" opacity="0.8" rx="4" />
            ))}
        </svg>
    );
};

// --- 提示图标 ---
export const LeafHintIcon = ({ count }: { count: number }) => (
    <div className={`flex items-center justify-center h-full w-full gap-0.5 ${count === 1 ? '' : 'px-1'}`}>
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex-1 flex items-center justify-center h-full transition-opacity ${i >= count ? 'opacity-0' : 'opacity-100'}`}>
                <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] drop-shadow-sm overflow-visible">
                    <path d="M50 85 Q80 50 50 15 Q20 50 50 85 Z" fill="#22C55E" stroke="#166534" strokeWidth="4" />
                </svg>
            </div>
        ))}
    </div>
);

export const BallHintIcon = ({ count }: { count: number }) => (
    <RowItemIcon count={count}>
        {(i) => <div className="w-5 h-5 rounded-full bg-lime-400 border-2 border-white shadow-sm" />}
    </RowItemIcon>
);

export const StepHintIcon = ({ count }: { count: number }) => (
    <RowItemIcon count={count}>
        {(i) => <div className="w-5 h-1.5 rounded-full bg-sky-400 border border-white shadow-sm" />}
    </RowItemIcon>
);

// --- 碰碰车 (根据用户反馈图片还原：半圆卡通造型) ---
export const BumperCar3D = ({ color = "#EF4444", uid = "" }: { color?: string, uid?: string }) => {
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* 还原为图片中的半圆/梯形卡通造型 */}
            <path d="M10 80 L10 60 Q10 30 50 30 Q90 30 90 60 L90 80 Z" fill={color} />
            {/* 中间的矩形装饰/窗户 */}
            <rect x="42" y="45" width="16" height="12" rx="2" fill="white" opacity="0.8" />
        </svg>
    );
};
