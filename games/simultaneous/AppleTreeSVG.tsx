import React from 'react';

/**
 * 苹果树SVG组件
 * 用于替换 appletree.png 图片
 * 设计说明：
 * - 树应该从顶部延伸到接近底部（约85-95%高度）
 * - 树冠区域应该在顶部30%的区域，用于放置静态苹果装饰
 * - 树干应该足够宽，但不要遮挡游戏元素
 * - 树的中心应该在50%宽度位置
 */
export const AppleTreeSVG: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 800 1000" 
      className={className}
      preserveAspectRatio="xMidYMax meet"
      style={{ width: '100%', height: '100%' }}
    >
      {/* 定义渐变和阴影 */}
      <defs>
        {/* 树干渐变 */}
        <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="50%" stopColor="#654321" />
          <stop offset="100%" stopColor="#5C4037" />
        </linearGradient>
        
        {/* 树叶渐变 */}
        <radialGradient id="leafGradient1" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#166534" stopOpacity="1" />
        </radialGradient>
        
        <radialGradient id="leafGradient2" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#15803D" stopOpacity="1" />
        </radialGradient>
        
        {/* 阴影滤镜 */}
        <filter id="treeShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="2" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 树干 - 从底部向上延伸，底部较宽 */}
      <g filter="url(#treeShadow)">
        {/* 主树干 */}
        <path
          d="M 380 1000 
             L 370 850 
             Q 375 700 380 600
             Q 385 500 390 400
             Q 385 350 380 300
             Q 375 250 370 200
             Q 365 150 360 100
             L 420 100
             Q 425 150 420 200
             Q 415 250 410 300
             Q 405 350 400 400
             Q 405 500 410 600
             Q 415 700 420 850
             L 410 1000 Z"
          fill="url(#trunkGradient)"
        />
        
        {/* 左侧分支 */}
        <path
          d="M 370 400
             Q 300 380 250 350
             Q 200 320 180 280
             Q 160 240 150 200
             L 170 200
             Q 180 240 200 280
             Q 220 320 270 350
             Q 320 380 370 400 Z"
          fill="url(#trunkGradient)"
        />
        
        {/* 右侧分支 */}
        <path
          d="M 420 400
             Q 500 380 550 350
             Q 600 320 620 280
             Q 640 240 650 200
             L 630 200
             Q 620 240 600 280
             Q 580 320 530 350
             Q 480 380 420 400 Z"
          fill="url(#trunkGradient)"
        />
      </g>

      {/* 树冠 - 使用更宽、更自然的叶子形状 */}
      <g filter="url(#treeShadow)">
        {/* 底层树叶（深绿色，最大，使用路径让叶子更宽更自然） */}
        <path
          d="M120 400 Q50 450 20 350 Q0 250 100 200 Q150 100 250 80 Q350 80 450 100 Q550 120 600 200 Q780 250 760 350 Q730 450 680 400 Q650 450 550 480 Q350 500 250 480 Q150 450 120 400"
          fill="#166534"
          opacity="0.9"
        />
        
        {/* 中层左侧树叶团（更宽的叶子形状） */}
        <path
          d="M150 400 Q80 420 50 360 Q30 300 80 260 Q120 220 180 240 Q220 260 250 300 Q280 340 270 380 Q240 400 200 400 Q180 400 150 400"
          fill="#15803D"
          opacity="0.95"
        />
        
        {/* 中层右侧树叶团 */}
        <path
          d="M650 400 Q720 420 750 360 Q770 300 720 260 Q680 220 620 240 Q580 260 550 300 Q520 340 530 380 Q560 400 600 400 Q620 400 650 400"
          fill="#15803D"
          opacity="0.95"
        />
        
        {/* 中层顶部树叶团（更宽） */}
        <path
          d="M300 200 Q250 150 200 180 Q150 200 180 240 Q220 280 300 260 Q380 280 420 240 Q450 200 400 180 Q350 150 300 200"
          fill="#15803D"
          opacity="0.95"
        />
        
        {/* 上层树叶（浅绿色，高光，使用路径） */}
        <path
          d="M200 350 Q150 400 100 350 Q50 300 150 250 Q250 200 350 200 Q450 200 550 250 Q650 300 600 350 Q550 400 500 350 Q450 380 350 380 Q250 380 200 350"
          fill="url(#leafGradient1)"
        />
        
        {/* 左侧高光树叶（更宽的叶子） */}
        <path
          d="M200 380 Q150 400 120 360 Q100 320 140 280 Q180 260 220 280 Q250 300 260 340 Q250 370 220 380 Q210 380 200 380"
          fill="#4ADE80"
          opacity="0.7"
        />
        
        {/* 右侧高光树叶 */}
        <path
          d="M600 380 Q650 400 680 360 Q700 320 660 280 Q620 260 580 280 Q550 300 540 340 Q550 370 580 380 Q590 380 600 380"
          fill="#4ADE80"
          opacity="0.7"
        />
        
        {/* 顶部高光树叶（更宽） */}
        <path
          d="M350 200 Q300 150 250 180 Q200 200 230 240 Q270 280 350 260 Q430 280 470 240 Q500 200 450 180 Q400 150 350 200"
          fill="#86EFAC"
          opacity="0.6"
        />
        
        {/* 细节叶片 - 使用路径让叶子更自然 */}
        <path
          d="M280 280 Q240 300 220 260 Q210 230 240 210 Q270 200 300 220 Q320 240 310 270 Q300 280 280 280"
          fill="#22C55E"
          opacity="0.5"
        />
        <path
          d="M520 280 Q560 300 580 260 Q590 230 560 210 Q530 200 500 220 Q480 240 490 270 Q500 280 520 280"
          fill="#22C55E"
          opacity="0.5"
        />
        <path
          d="M320 380 Q290 400 280 360 Q275 330 300 310 Q330 300 360 320 Q380 340 375 370 Q360 380 320 380"
          fill="#4ADE80"
          opacity="0.4"
        />
        <path
          d="M480 380 Q510 400 520 360 Q525 330 500 310 Q470 300 440 320 Q420 340 425 370 Q440 380 480 380"
          fill="#4ADE80"
          opacity="0.4"
        />
        <path
          d="M400 180 Q350 140 300 170 Q250 200 280 240 Q320 280 400 260 Q480 280 520 240 Q550 200 500 170 Q450 140 400 180"
          fill="#86EFAC"
          opacity="0.4"
        />
      </g>
    </svg>
  );
};

