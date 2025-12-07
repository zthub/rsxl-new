import React from 'react';

// 树图标
export const TreeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl">
      {/* 详细的树干 - 棕色，底部更宽 */}
      <path
        d="M220 500 L200 450 Q230 400 235 300 Q200 250 150 220 L160 200 Q240 230 250 300 Q260 230 340 200 L350 220 Q300 250 265 300 Q270 400 300 450 L280 500 Z"
        fill="#8B4513"
      />

      {/* 树叶层 1（深绿色阴影） */}
      <path
        d="M100 300 Q50 350 20 250 Q0 150 100 100 Q150 20 250 20 Q350 20 400 100 Q500 150 480 250 Q450 350 400 300 Q350 400 250 380 Q150 400 100 300"
        fill="#1b4d1b"
      />

      {/* 树叶层 2（基础绿色） */}
      <path
        d="M110 290 Q70 330 40 240 Q20 150 110 110 Q160 40 250 40 Q340 40 390 110 Q480 150 460 240 Q430 330 390 290 Q340 380 250 360 Q160 380 110 290"
        fill="#228B22"
      />

      {/* 树叶层 3（高光/蓬松 - 浅绿色） */}
      <path
        d="M120 250 Q100 200 130 180 Q120 120 180 100 Q200 50 280 60 Q340 50 380 100 Q430 120 420 180 Q450 200 420 260 Q400 320 320 300 Q250 330 180 300 Q140 310 120 250"
        fill="#32CD32"
        opacity="0.9"
      />

      {/* 单个叶片团块细节 */}
      <circle cx="150" cy="180" r="40" fill="#4ADE80" opacity="0.4" />
      <circle cx="350" cy="180" r="40" fill="#4ADE80" opacity="0.4" />
      <circle cx="250" cy="120" r="50" fill="#4ADE80" opacity="0.4" />
      <circle cx="200" cy="250" r="40" fill="#4ADE80" opacity="0.3" />
      <circle cx="300" cy="250" r="45" fill="#4ADE80" opacity="0.3" />
    </svg>
  </div>
);

// 苹果图标
export const AppleIcon: React.FC<{ color?: string; className?: string }> = ({
  color = '#EF4444',
  className,
}) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      {/* 茎 */}
      <path
        d="M50 35 Q50 15 55 10"
        stroke="#5D4037"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* 叶子 - 右侧的单个绿色叶子 */}
      <path
        d="M55 20 Q70 10 75 25 Q65 35 55 20"
        fill="#4ADE80"
        stroke="#166534"
        strokeWidth="1"
      />

      {/* 苹果主体 - 经典形状 */}
      <path
        d="M25 40 Q25 20 50 35 Q75 20 75 40 Q85 60 70 85 Q50 95 30 85 Q15 60 25 40"
        fill={color}
      />

      {/* 光泽/高光 - 左上角的白色椭圆 */}
      <ellipse
        cx="35"
        cy="45"
        rx="5"
        ry="8"
        fill="white"
        opacity="0.6"
        transform="rotate(-15 35 45)"
      />
    </svg>
  </div>
);

// 篮子图标 - 通体红色，无把手，无装饰线
export const BasketIcon: React.FC<{ className?: string; onClick?: () => void }> = ({
  className,
  onClick,
}) => (
  <div className={className} onClick={onClick}>
    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
      {/* 篮子主体 - 通体红色 */}
      <path d="M10 30 L20 75 Q50 85 80 75 L90 30 Z" fill="#DC2626" />
    </svg>
  </div>
);

