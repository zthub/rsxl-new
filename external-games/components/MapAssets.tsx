import React from 'react';

// A stylized, colorful SVG representation of China for the puzzle
// Note: This is a simplified artistic representation for children's game purposes
export const ChinaMapGraphic: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-md">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ocean Background (Subtle) */}
        <path d="M80 60 Q100 70 120 60 V100 H80 Z" fill="#E0F7FA" opacity="0.5" />

        {/* --- Map Regions (Stylized Polygons) --- */}

        {/* 1. North West (Xinjiang) - Purple */}
        <path 
          d="M15 35 L35 30 L45 35 L40 50 L15 55 L5 40 Z" 
          fill="#DDD6FE" stroke="white" strokeWidth="0.5" 
        />
        
        {/* 2. Tibet / South West - Orange */}
        <path 
          d="M15 55 L40 50 L50 60 L45 75 L20 70 Z" 
          fill="#FED7AA" stroke="white" strokeWidth="0.5" 
        />
        
        {/* 3. Inner Mongolia / North - Green */}
        <path 
          d="M35 30 L60 25 L80 30 L75 40 L45 35 Z" 
          fill="#BBF7D0" stroke="white" strokeWidth="0.5" 
        />

        {/* 4. North East (Heilongjiang/Jilin/Liaoning) - Blue */}
        <path 
          d="M80 30 L90 20 L95 25 L95 35 L80 40 L75 40 Z" 
          fill="#BFDBFE" stroke="white" strokeWidth="0.5" 
        />

        {/* 5. Central / East - Pink */}
        <path 
          d="M40 50 L75 40 L80 40 L90 55 L75 65 L50 60 Z" 
          fill="#FBCFE8" stroke="white" strokeWidth="0.5" 
        />

        {/* 6. South - Yellow */}
        <path 
          d="M50 60 L75 65 L85 80 L65 85 L60 75 Z" 
          fill="#FEF08A" stroke="white" strokeWidth="0.5" 
        />

        {/* --- Landmarks / Icons --- */}
        
        {/* Beijing Star */}
        <g transform="translate(72, 38)">
           <path d="M0 -3 L1 -1 L3 -1 L1.5 0.5 L2 2.5 L0 1.5 L-2 2.5 L-1.5 0.5 L-3 -1 L-1 -1 Z" fill="#EF4444" />
        </g>

        {/* Panda (SW) */}
        <g transform="translate(55, 65) scale(0.15)">
           <circle cx="0" cy="0" r="15" fill="white" />
           <circle cx="-6" cy="-6" r="4" fill="black" />
           <circle cx="6" cy="-6" r="4" fill="black" />
           <circle cx="-3" cy="0" r="2" fill="black" />
           <circle cx="3" cy="0" r="2" fill="black" />
           <ellipse cx="0" cy="5" rx="3" ry="2" fill="black" />
        </g>

        {/* Tower (East) */}
        <g transform="translate(85, 55)">
           <path d="M0 0 L0 -8" stroke="#7C3AED" strokeWidth="1" />
           <circle cx="0" cy="-3" r="1.5" fill="#7C3AED" />
           <circle cx="0" cy="0" r="2" fill="#7C3AED" />
        </g>
        
        {/* Taiwan Island */}
        <ellipse cx="92" cy="70" rx="2" ry="4" fill="#FBCFE8" stroke="white" strokeWidth="0.5" transform="rotate(20 92 70)" />
        
        {/* Hainan Island */}
        <circle cx="68" cy="88" r="2.5" fill="#FEF08A" stroke="white" strokeWidth="0.5" />

        {/* Decoration: Clouds */}
        <path d="M10 20 Q15 15 20 20 T30 20" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
        <path d="M90 80 Q95 75 100 80 T110 80" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />

      </svg>
    </div>
  );
};
