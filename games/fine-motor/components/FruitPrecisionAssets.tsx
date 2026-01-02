import React from 'react';

// --- Fruit Find Assets (精细辨识版) ---
// 将颜色统一，迫使观察者关注形状和内部细节差异
const UNIFIED_PRIMARY = "#D4E157"; // 统一的果皮颜色
const UNIFIED_SECONDARY = "#F1F8E9"; // 统一的果肉颜色

// 牛油果：外形较圆润，中心有明显的深色圆形果核
export const AvocadoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className}>
        <path d="M50 15 Q30 20 25 50 Q20 85 50 90 Q80 85 75 50 Q70 20 50 15" fill={UNIFIED_PRIMARY} />
        <path d="M50 25 Q38 30 35 50 Q30 75 50 82 Q70 75 65 50 Q62 30 50 25" fill={UNIFIED_SECONDARY} />
        {/* 关键辨识点：圆形果核 */}
        <circle cx="50" cy="62" r="12" fill="#5D4037" />
        <circle cx="53" cy="59" r="3" fill="white" opacity="0.2" />
    </svg>
);

// 雪梨：外形顶部稍窄，有细长的果柄，无果核
export const PearIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className}>
        {/* 关键辨识点：细长果柄 */}
        <path d="M50 5 L50 15 Q55 10 60 12" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 15 Q30 20 25 50 Q20 85 50 90 Q80 85 75 50 Q70 20 50 15" fill={UNIFIED_PRIMARY} />
        <path d="M50 22 Q38 25 35 48 Q30 72 50 80 Q70 72 65 48 Q62 25 50 22" fill={UNIFIED_SECONDARY} />
        {/* 细微的果皮斑点 */}
        <circle cx="45" cy="55" r="1" fill="#827717" opacity="0.2" />
        <circle cx="55" cy="65" r="1" fill="#827717" opacity="0.2" />
    </svg>
);
