import React from 'react';

// --- Bomb Game Assets ---
export const BombIcon: React.FC<{ number: number; isTarget: boolean; onClick?: () => void; className?: string }> = ({ number, isTarget, onClick, className }) => (
  <div 
    onClick={onClick}
    className={`relative cursor-pointer group transition-transform active:scale-95 ${className}`}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      {/* Fuse */}
      <path d="M50 15 Q60 5 70 10" stroke="#F59E0B" strokeWidth="4" fill="none" />
      <circle cx="70" cy="10" r="3" fill="#EF4444" className="animate-pulse" />
      
      {/* Bomb Body */}
      <circle cx="50" cy="55" r="40" fill="#374151" />
      <circle cx="35" cy="40" r="8" fill="white" opacity="0.2" />
      
      {/* Digital Screen */}
      <rect x="25" y="40" width="50" height="30" rx="4" fill="#1F2937" stroke="#4B5563" strokeWidth="2" />
    </svg>
    {/* Number Overlay */}
    <div className="absolute inset-0 flex items-center justify-center pt-3 pointer-events-none">
      <span className="text-green-500 font-mono font-bold text-xl md:text-2xl lg:text-3xl tracking-widest drop-shadow-md">
        {number}
      </span>
    </div>
  </div>
);

// --- Chicks Game Assets ---
export const ChickIcon: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
  <div onClick={onClick} className={`cursor-pointer transition-transform hover:scale-105 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      {/* Body - Brownish Orange */}
      <path d="M20 80 Q10 50 30 30 Q50 10 70 30 Q90 50 80 80 Z" fill="#D97706" />
      {/* Wing */}
      <path d="M70 50 Q80 60 70 70" fill="none" stroke="#92400E" strokeWidth="3" />
      {/* Eyes - Cute and wide */}
      <circle cx="40" cy="45" r="4" fill="white" />
      <circle cx="40" cy="45" r="2" fill="black" />
      <circle cx="65" cy="45" r="4" fill="white" />
      <circle cx="65" cy="45" r="2" fill="black" />
      
      {/* Beak - Small Triangle (The subtle difference) */}
      <path d="M48 52 L52 52 L50 58 Z" fill="#FDBA74" stroke="#C2410C" strokeWidth="1" />
      
      {/* Feet */}
      <path d="M35 80 L35 90 M40 80 L40 90" stroke="#92400E" strokeWidth="3" />
      <path d="M60 80 L60 90 M65 80 L65 90" stroke="#92400E" strokeWidth="3" />
    </svg>
  </div>
);

export const EagleIcon: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
  <div onClick={onClick} className={`cursor-pointer transition-transform hover:scale-105 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      {/* Body - Same Color/Shape to be tricky */}
      <path d="M20 80 Q10 50 30 30 Q50 10 70 30 Q90 50 80 80 Z" fill="#D97706" />
       {/* Wing */}
       <path d="M70 50 Q80 60 70 70" fill="none" stroke="#78350F" strokeWidth="3" />
       
      {/* Eyes - Angry Eyebrows */}
      <path d="M32 38 L45 42" stroke="black" strokeWidth="2" /> 
      <path d="M72 38 L58 42" stroke="black" strokeWidth="2" />
      <circle cx="40" cy="45" r="3" fill="black" />
      <circle cx="65" cy="45" r="3" fill="black" />

      {/* Beak - HUGE Hooked Mouth (The difference) */}
      <path d="M45 50 Q52 40 60 50 Q65 60 52 70 Q45 60 45 50" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
      
       {/* Feet */}
       <path d="M35 80 L35 90 M40 80 L40 90" stroke="#78350F" strokeWidth="3" />
       <path d="M60 80 L60 90 M65 80 L65 90" stroke="#78350F" strokeWidth="3" />
    </svg>
  </div>
);

export const Arrow: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 60" className={className}>
    <line x1="12" y1="60" x2="12" y2="10" stroke="#5D4037" strokeWidth="4" />
    <path d="M12 0 L4 15 L12 12 L20 15 Z" fill="#9CA3AF" />
    <path d="M4 55 L20 55" stroke="#8B4513" strokeWidth="2" />
    <path d="M4 50 L20 50" stroke="#8B4513" strokeWidth="2" />
  </svg>
);

// --- Beans Game Assets ---
export const DateIcon: React.FC<{ onClick?: () => void; className?: string }> = ({ onClick, className }) => (
    <div onClick={onClick} className={`cursor-pointer ${className}`}>
        <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-sm transition-transform hover:scale-105">
            {/* Simple Red Oval for Red Date (Jujube) */}
            <ellipse cx="50" cy="30" rx="45" ry="25" fill="#991B1B" />
            <path d="M20 20 Q50 5 80 20" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
        </svg>
    </div>
);

export const RedBeanIcon: React.FC<{ onClick?: () => void; className?: string }> = ({ onClick, className }) => (
    <div onClick={onClick} className={`cursor-pointer ${className}`}>
         <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-sm transition-transform hover:scale-105">
            {/* Red Bean - Slightly curved, has a white line (hilum) */}
            <path d="M10 30 Q10 5 50 5 Q90 5 90 30 Q90 55 50 50 Q10 55 10 30" fill="#991B1B" />
            {/* The White Spot (Hilum) - The key differentiator */}
            <ellipse cx="50" cy="15" rx="8" ry="3" fill="white" opacity="0.9" />
        </svg>
    </div>
);

// --- Catch Apple Assets ---
export const TreeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl">
      {/* Detailed Trunk - Brown, wider at base */}
      <path d="M220 500 L200 450 Q230 400 235 300 Q200 250 150 220 L160 200 Q240 230 250 300 Q260 230 340 200 L350 220 Q300 250 265 300 Q270 400 300 450 L280 500 Z" fill="#8B4513" />
      
      {/* Foliage Layer 1 (Dark Green Shadow) */}
      <path d="M100 300 Q50 350 20 250 Q0 150 100 100 Q150 20 250 20 Q350 20 400 100 Q500 150 480 250 Q450 350 400 300 Q350 400 250 380 Q150 400 100 300" fill="#1b4d1b" />

      {/* Foliage Layer 2 (Base Green) */}
      <path d="M110 290 Q70 330 40 240 Q20 150 110 110 Q160 40 250 40 Q340 40 390 110 Q480 150 460 240 Q430 330 390 290 Q340 380 250 360 Q160 380 110 290" fill="#228B22" />

      {/* Foliage Layer 3 (Highlights/Fluff - Lighter Green) */}
      <path d="M120 250 Q100 200 130 180 Q120 120 180 100 Q200 50 280 60 Q340 50 380 100 Q430 120 420 180 Q450 200 420 260 Q400 320 320 300 Q250 330 180 300 Q140 310 120 250" fill="#32CD32" opacity="0.9" />
      
      {/* Individual Leaf Clumps for Detail */}
      <circle cx="150" cy="180" r="40" fill="#4ADE80" opacity="0.4" />
      <circle cx="350" cy="180" r="40" fill="#4ADE80" opacity="0.4" />
      <circle cx="250" cy="120" r="50" fill="#4ADE80" opacity="0.4" />
      <circle cx="200" cy="250" r="40" fill="#4ADE80" opacity="0.3" />
      <circle cx="300" cy="250" r="45" fill="#4ADE80" opacity="0.3" />
    </svg>
  </div>
);

export const AppleIcon: React.FC<{ color?: string; className?: string }> = ({ color = "#EF4444", className }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
       {/* Stem */}
       <path d="M50 35 Q50 15 55 10" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round" />
       
       {/* Leaf - Single green leaf on the right */}
       <path d="M55 20 Q70 10 75 25 Q65 35 55 20" fill="#4ADE80" stroke="#166534" strokeWidth="1" />

       {/* Apple Body - Classic Shape */}
       <path d="M25 40 Q25 20 50 35 Q75 20 75 40 Q85 60 70 85 Q50 95 30 85 Q15 60 25 40" fill={color} />
       
       {/* Shine/Highlight - White oval on top left */}
       <ellipse cx="35" cy="45" rx="5" ry="8" fill="white" opacity="0.6" transform="rotate(-15 35 45)" />
    </svg>
  </div>
);

export const BasketIcon: React.FC<{ className?: string; onClick?: () => void }> = ({ className, onClick }) => (
  <div className={className} onClick={onClick}>
     <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-xl">
       {/* Handle */}
       <path d="M10 30 Q50 -10 90 30" fill="none" stroke="#B91C1C" strokeWidth="4" />
       {/* Basket Body - Red */}
       <path d="M10 30 L20 75 Q50 85 80 75 L90 30 Z" fill="#DC2626" />
       {/* Weave details */}
       <path d="M15 45 L85 45 M20 60 L80 60" stroke="#991B1B" strokeWidth="2" />
       <path d="M30 30 L35 78 M50 30 L50 80 M70 30 L65 78" stroke="#991B1B" strokeWidth="2" />
     </svg>
  </div>
);