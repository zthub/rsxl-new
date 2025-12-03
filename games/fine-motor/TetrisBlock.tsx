import React from 'react';

interface BlockProps {
  color?: string;
  emoji?: string;
  isGhost?: boolean;
  grayscale?: boolean;
}

const TetrisBlock: React.FC<BlockProps> = ({ color, emoji, isGhost, grayscale }) => {
  if (isGhost) {
    return (
      <div className="w-full h-full border-2 border-dashed border-gray-400 rounded-md bg-white/20 flex items-center justify-center">
      </div>
    );
  }

  // Fallback if empty
  if (!color) return <div className="w-full h-full" />;

  const grayscaleClass = grayscale ? 'filter grayscale opacity-50' : '';

  return (
    <div
      className={`w-full h-full ${color} ${grayscaleClass} border-b-4 border-r-4 rounded-lg flex items-center justify-center text-lg sm:text-xl lg:text-2xl shadow-sm transition-transform duration-300`}
    >
      <span className="select-none pointer-events-none drop-shadow-md filter">{emoji}</span>
    </div>
  );
};

export default React.memo(TetrisBlock);

