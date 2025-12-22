import React, { useMemo } from 'react';

export interface AvatarConfig {
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  hairStyle: number; // 0-5
  accStyle: number; // 0 (none), 1 (cap), 2 (bow), 3 (bunny ears), 4 (glasses)
  eyeStyle: number; // 0 (open), 1 (wink), 2 (happy)
  mouthStyle: number; // 0 (smile), 1 (open), 2 (cat)
  blush: boolean;
}

const SKIN_TONES = ['#FFE0BD', '#FFCDB0', '#EAC086', '#FFD1AA'];
const HAIR_COLORS = ['#2D2D2D', '#4A3B2A', '#8B4513', '#E6C76E', '#D35400', '#2C3E50'];
const SHIRT_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8787', '#6C5CE7', '#A8E6CF', '#FFA07A'];

export const getRandomAvatarConfig = (): AvatarConfig => ({
  skinColor: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
  hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
  shirtColor: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
  hairStyle: Math.floor(Math.random() * 6),
  accStyle: Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0, 
  eyeStyle: Math.floor(Math.random() * 3),
  mouthStyle: Math.floor(Math.random() * 3),
  blush: Math.random() > 0.3,
});

interface Props {
  config: AvatarConfig;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const Avatar: React.FC<Props> = ({ config, className, onClick }) => {
  const { skinColor, hairColor, shirtColor, hairStyle, accStyle, eyeStyle, mouthStyle, blush } = config;

  return (
    <div onClick={onClick} className={`relative cursor-pointer transition-transform hover:scale-110 active:scale-95 ${className}`}>
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm overflow-visible">
        
        {/* --- Back Hair (Behind Head) --- */}
        {hairStyle === 1 && <path d="M30 60 Q20 100 30 110 L90 110 Q100 100 90 60" fill={hairColor} />} 
        {hairStyle === 2 && <path d="M20 60 Q10 90 25 100 L95 100 Q110 90 100 60" fill={hairColor} />}
        {hairStyle === 4 && (
            <>
            <circle cx="20" cy="50" r="12" fill={hairColor} />
            <circle cx="100" cy="50" r="12" fill={hairColor} />
            </>
        )}

        {/* --- Body --- */}
        <path d="M30 100 Q30 85 60 85 Q90 85 90 100 L90 120 L30 120 Z" fill={shirtColor} />
        {/* Collar/Detail */}
        <path d="M50 85 Q60 95 70 85" fill="white" />

        {/* --- Head --- */}
        <path d="M25 60 Q25 20 60 20 Q95 20 95 60 Q95 95 60 95 Q25 95 25 60" fill={skinColor} />
        
        {/* Ears */}
        <circle cx="24" cy="65" r="6" fill={skinColor} />
        <circle cx="96" cy="65" r="6" fill={skinColor} />

        {/* --- Face Details --- */}
        
        {/* Blush */}
        {blush && (
          <>
            <ellipse cx="35" cy="72" rx="6" ry="3" fill="#FF8FAB" opacity="0.5" />
            <ellipse cx="85" cy="72" rx="6" ry="3" fill="#FF8FAB" opacity="0.5" />
          </>
        )}

        {/* Eyes */}
        <g fill="#333">
           {eyeStyle === 0 && ( // Normal Big Eyes
             <>
                <circle cx="42" cy="60" r="5" />
                <circle cx="78" cy="60" r="5" />
                <circle cx="44" cy="58" r="2" fill="white" />
                <circle cx="80" cy="58" r="2" fill="white" />
             </>
           )}
           {eyeStyle === 1 && ( // Happy Arches
             <>
                <path d="M36 60 Q42 54 48 60" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                <path d="M72 60 Q78 54 84 60" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
             </>
           )}
           {eyeStyle === 2 && ( // Wink
             <>
                <circle cx="42" cy="60" r="5" />
                <circle cx="44" cy="58" r="2" fill="white" />
                <path d="M72 60 L84 60" stroke="#333" strokeWidth="3" strokeLinecap="round" />
             </>
           )}
        </g>
        
        {/* Glasses Accessory (accStyle 4) */}
        {accStyle === 4 && (
            <g stroke="#333" strokeWidth="2" fill="rgba(255,255,255,0.3)">
                <circle cx="42" cy="60" r="9" />
                <circle cx="78" cy="60" r="9" />
                <line x1="51" y1="60" x2="69" y2="60" />
            </g>
        )}

        {/* Mouth */}
        {mouthStyle === 0 && <path d="M52 80 Q60 85 68 80" fill="none" stroke="#6D4C41" strokeWidth="3" strokeLinecap="round" />}
        {mouthStyle === 1 && <circle cx="60" cy="82" r="3" fill="#6D4C41" />}
        {mouthStyle === 2 && <path d="M55 80 Q60 82 65 80" fill="none" stroke="#6D4C41" strokeWidth="3" strokeLinecap="round" />}

        {/* --- Front Hair --- */}
        {/* 0: Boy Messy */}
        {hairStyle === 0 && <path d="M25 55 Q30 20 60 20 Q90 20 95 55 Q90 40 75 45 Q60 30 45 45 Q30 40 25 55" fill={hairColor} />}
        {/* 1: Girl Bangs */}
        {hairStyle === 1 && <path d="M25 60 Q30 20 60 20 Q90 20 95 60 Q90 35 60 35 Q30 35 25 60" fill={hairColor} />}
        {/* 2: Side Part */}
        {hairStyle === 2 && <path d="M25 50 Q40 15 80 25 Q95 30 95 60 Q80 25 25 50" fill={hairColor} />}
        {/* 3: Spiky Up */}
        {hairStyle === 3 && <path d="M28 50 L35 30 L45 45 L60 25 L75 45 L85 30 L92 50 Q60 35 28 50" fill={hairColor} />}
        {/* 4: Buns Front */}
        {hairStyle === 4 && <path d="M30 55 Q40 25 60 25 Q80 25 90 55 Q60 40 30 55" fill={hairColor} />}
        {/* 5: Curly */}
        {hairStyle === 5 && <path d="M25 55 Q30 15 45 25 Q60 10 75 25 Q90 15 95 55 Q60 35 25 55" fill={hairColor} />}

        {/* --- Accessories --- */}
        {/* 1: Cap */}
        {accStyle === 1 && (
             <path d="M20 50 Q60 5 100 50 L105 52 Q60 25 15 52 Z" fill={shirtColor} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        )}
        {/* 2: Bow */}
        {accStyle === 2 && (
             <path d="M45 25 L35 15 L45 35 L60 30 L75 35 L85 15 L75 25 Q60 15 45 25" fill="#FF69B4" />
        )}
        {/* 3: Bunny Ears */}
        {accStyle === 3 && (
             <g fill="white" stroke="#FFE0BD" strokeWidth="1">
                <ellipse cx="40" cy="20" rx="8" ry="25" transform="rotate(-15 40 20)" />
                <ellipse cx="40" cy="20" rx="4" ry="18" fill="#FFC0CB" transform="rotate(-15 40 20)" stroke="none" />
                
                <ellipse cx="80" cy="20" rx="8" ry="25" transform="rotate(15 80 20)" />
                <ellipse cx="80" cy="20" rx="4" ry="18" fill="#FFC0CB" transform="rotate(15 80 20)" stroke="none" />
             </g>
        )}

      </svg>
    </div>
  );
};

export default Avatar;

