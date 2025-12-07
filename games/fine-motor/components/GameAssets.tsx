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
      <span className="text-green-500 font-mono font-bold text-base sm:text-lg md:text-2xl lg:text-3xl tracking-widest drop-shadow-md">
        {number}
      </span>
    </div>
  </div>
);

// --- Chicks Game Assets ---
export const ChickIcon: React.FC<{ onClick?: () => void; className?: string }> = ({ onClick, className }) => (
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

export const EagleIcon: React.FC<{ onClick?: () => void; className?: string }> = ({ onClick, className }) => (
  <div onClick={onClick} className={`cursor-pointer transition-transform hover:scale-105 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      {/* Body - Same as chick */}
      <path d="M20 80 Q10 50 30 30 Q50 10 70 30 Q90 50 80 80 Z" fill="#D97706" />
      {/* Wing - Same as chick */}
      <path d="M70 50 Q80 60 70 70" fill="none" stroke="#92400E" strokeWidth="3" />
      {/* Eyes - Same as chick */}
      <circle cx="40" cy="45" r="4" fill="white" />
      <circle cx="40" cy="45" r="2" fill="black" />
      <circle cx="65" cy="45" r="4" fill="white" />
      <circle cx="65" cy="45" r="2" fill="black" />
      
      {/* Beak - Hooked mouth (the only difference) */}
      <path d="M45 50 Q52 40 60 50 Q65 60 52 70 Q45 60 45 50" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
      
      {/* Feet - Same as chick */}
      <path d="M35 80 L35 90 M40 80 L40 90" stroke="#92400E" strokeWidth="3" />
      <path d="M60 80 L60 90 M65 80 L65 90" stroke="#92400E" strokeWidth="3" />
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
            {/* Red Bean - Slightly curved shape, subtle difference from DateIcon */}
            <path d="M10 30 Q10 5 50 5 Q90 5 90 30 Q90 55 50 50 Q10 55 10 30" fill="#991B1B" />
            {/* Very subtle white spot (hilum) - smaller and less obvious */}
            <ellipse cx="50" cy="18" rx="6" ry="2" fill="white" opacity="0.3" />
        </svg>
    </div>
);

