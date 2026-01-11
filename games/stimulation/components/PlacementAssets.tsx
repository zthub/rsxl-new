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

// --- 1. 行提示图标 (用于区分 1, 2, 3) ---
export const StepHintIcon = ({ count = 1, color = "#60A5FA", theme = "default" }: { count?: number, color?: string, theme?: string }) => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <defs>
            <filter id="hintShadow"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
        </defs>
        <g filter="url(#hintShadow)">
            {Array.from({ length: 3 }).map((_, i) => (
                <rect
                    key={i}
                    x="10"
                    y={12 + i * 30}
                    width="80"
                    height="20"
                    rx="10"
                    fill={i < count ? color : "#F1F5F9"}
                    stroke={i < count ? "white" : "#E2E8F0"}
                    strokeWidth="3"
                />
            ))}
        </g>
    </svg>
);

// --- 2. 蔬菜系列 ---
export const Carrot3D = ({ leaves = 1, uid = "" }: { leaves?: number, uid?: string }) => {
    const gradId = `carrotGrad-${uid}`;
    const leafId = `leafGrad-${uid}`;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <GradientDef id={gradId} colors={["#FB923C", "#9A3412"]} />
            <GradientDef id={leafId} colors={["#4ADE80", "#166534"]} />
            <g transform="translate(50, 35)">
                {Array.from({ length: leaves || 1 }).map((_, i) => (
                    <path
                        key={i}
                        d="M0 0 Q10 -20 0 -30 Q-10 -20 0 0"
                        fill={leaves === 0 ? "none" : `url(#${leafId})`}
                        stroke="#166534" strokeWidth={leaves === 0 ? "2" : "0.5"}
                        transform={`rotate(${(i - (Math.max(1, leaves) - 1) / 2) * 30})`}
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
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <GradientDef id={gradId} colors={["#F8FAFC", "#94A3B8"]} />
            <GradientDef id={leafId} colors={["#A3E635", "#3F6212"]} />
            <g transform="translate(50, 35)">
                {Array.from({ length: leaves || 1 }).map((_, i) => (
                    <path
                        key={i}
                        d="M0 0 Q12 -25 0 -35 Q-12 -25 0 0"
                        fill={leaves === 0 ? "none" : `url(#${leafId})`}
                        stroke="#3F6212" strokeWidth={leaves === 0 ? "2" : "0.5"}
                        transform={`rotate(${(i - (Math.max(1, leaves) - 1) / 2) * 30})`}
                    />
                ))}
            </g>
            <path d="M50 35 Q70 35 70 75 Q70 95 50 95 Q30 95 30 75 Q30 35 50 35" fill={`url(#${gradId})`} />
        </svg>
    );
};

export const Corn3D = ({ kernels = 1, uid = "" }: { kernels?: number, uid?: string }) => {
    const gradId = `cornGrad-${uid}`;
    const leafId = `leafGrad-${uid}`;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <GradientDef id={gradId} colors={["#FDE047", "#EAB308"]} />
            <GradientDef id={leafId} colors={["#84CC16", "#365314"]} />
            <path d="M35 85 Q50 95 65 85 L65 50 Q65 20 50 15 Q35 20 35 50 Z" fill={`url(#${gradId})`} />
            <path d="M30 90 Q40 50 45 20 M70 90 Q60 50 55 20" fill="none" stroke={`url(#${leafId})`} strokeWidth="15" strokeLinecap="round" />
            {kernels > 0 && Array.from({ length: kernels }).map((_, i) => (
                <circle key={i} cx="50" cy={35 + i * 15} r="3" fill="white" opacity="0.6" />
            ))}
        </svg>
    );
};

// --- 3. 网球与球拍系列 ---
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
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <GradientDef id={gradId} colors={[color, "#1E3A8A"]} />
            <rect x="46" y="65" width="8" height="30" rx="2" fill="#334155" />
            <ellipse cx="50" cy="38" rx="28" ry="32" fill="none" stroke={`url(#${gradId})`} strokeWidth="7" />
            <g opacity="0.2" stroke="#94A3B8" strokeWidth="1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <React.Fragment key={i}>
                        <line x1={25} y1={20 + i * 7} x2={75} y2={20 + i * 7} />
                        <line x1={30 + i * 8} y1={10} x2={30 + i * 8} y2={65} />
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

// --- 4. 运动服系列 ---
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

export const LeafHintIcon = ({ count }: { count: number }) => <StepHintIcon count={count} color="#22C55E" />;
export const BallHintIcon = ({ count }: { count: number }) => (
    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`w-6 h-6 rounded-full border-2 border-white shadow-sm ${i < count ? 'bg-lime-400' : 'bg-slate-100 opacity-20'}`} />
        ))}
    </div>
);
