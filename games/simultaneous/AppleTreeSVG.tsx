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
      viewBox="-200 0 1400 1000" 
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
        {/* 底层树叶（深绿色，最大，使用路径让叶子更宽更自然） - 扩展到更宽的宽度 */}
        <path
          d="M0 400 Q-100 450 -150 350 Q-200 200 -50 150 Q100 80 250 60 Q350 60 550 100 Q700 100 950 150 Q1100 200 1050 350 Q1000 450 900 400 Q800 450 550 480 Q350 500 250 480 Q50 450 0 400"
          fill="#166534"
          opacity="0.9"
        />
        
        {/* 中层左侧树叶团（更宽的叶子形状） - 向左扩展 */}
        <path
          d="M50 400 Q-80 420 -120 360 Q-150 280 -80 240 Q-20 200 80 240 Q150 260 200 300 Q250 340 240 380 Q200 400 150 400 Q100 400 50 400"
          fill="#15803D"
          opacity="0.95"
        />
        
        {/* 中层右侧树叶团 - 向右扩展 */}
        <path
          d="M750 400 Q920 420 960 360 Q990 280 920 240 Q860 200 760 240 Q700 260 650 300 Q600 340 610 380 Q650 400 700 400 Q750 400 750 400"
          fill="#15803D"
          opacity="0.95"
        />
        
        {/* 中层顶部树叶团（更宽） - 扩展宽度 */}
        <path
          d="M200 200 Q50 150 -80 180 Q-150 200 -50 240 Q80 280 300 260 Q520 280 690 240 Q800 200 650 180 Q500 150 350 200 Q280 180 200 200"
          fill="#15803D"
          opacity="0.95"
        />
        
        {/* 上层树叶（浅绿色，高光，使用路径） - 扩展宽度 */}
        <path
          d="M100 350 Q-50 400 -120 350 Q-180 280 50 250 Q250 200 350 200 Q450 200 550 250 Q880 280 1020 350 Q950 400 800 350 Q750 380 550 380 Q350 380 200 380 Q150 370 100 350"
          fill="url(#leafGradient1)"
        />
        
        {/* 左侧高光树叶（更宽的叶子） - 向左扩展 */}
        <path
          d="M100 380 Q-50 400 -80 360 Q-100 300 40 280 Q100 260 150 280 Q200 300 210 340 Q200 370 150 380 Q130 380 100 380"
          fill="#4ADE80"
          opacity="0.7"
        />
        
        {/* 右侧高光树叶 - 向右扩展 */}
        <path
          d="M700 380 Q900 400 920 360 Q940 320 860 280 Q800 260 750 280 Q700 300 690 340 Q700 370 750 380 Q820 380 700 380"
          fill="#4ADE80"
          opacity="0.7"
        />
        
        {/* 顶部高光树叶（更宽） - 扩展宽度 */}
        <path
          d="M350 200 Q200 150 50 180 Q-50 200 80 240 Q270 280 350 260 Q430 280 720 240 Q850 200 750 180 Q600 150 450 200 Q400 180 350 200"
          fill="#86EFAC"
          opacity="0.6"
        />
        
        {/* 细节叶片 - 使用路径让叶子更自然 - 扩展宽度 */}
        <path
          d="M180 280 Q80 300 20 260 Q-20 230 80 210 Q180 200 250 220 Q300 240 290 270 Q280 280 180 280"
          fill="#22C55E"
          opacity="0.5"
        />
        <path
          d="M620 280 Q820 300 880 260 Q920 230 820 210 Q720 200 650 220 Q600 240 610 270 Q620 280 620 280"
          fill="#22C55E"
          opacity="0.5"
        />
        <path
          d="M220 380 Q100 400 50 360 Q0 330 100 310 Q200 300 250 320 Q300 340 290 370 Q250 380 220 380"
          fill="#4ADE80"
          opacity="0.4"
        />
        <path
          d="M580 380 Q800 400 850 360 Q900 330 800 310 Q700 300 650 320 Q600 340 610 370 Q650 380 680 380 Q750 380 580 380"
          fill="#4ADE80"
          opacity="0.4"
        />
        <path
          d="M400 180 Q250 140 100 170 Q-50 200 80 240 Q320 280 400 260 Q480 280 820 240 Q950 200 850 170 Q650 140 500 180 Q450 160 400 180"
          fill="#86EFAC"
          opacity="0.4"
        />
      </g>
    </svg>
  );
};

