import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  title: string;
  level: number;
  onBack: () => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  bgColorClass?: string;
  customHeader?: React.ReactNode; // New prop for custom header content
}

const GameLayout: React.FC<Props> = ({ title, level, onBack, children, headerRight, bgColorClass = 'bg-blue-50', customHeader }) => {
  return (
    <div className={`min-h-screen flex flex-col ${bgColorClass} overflow-hidden`}>
      {/* Header */}
      <header className="px-4 py-3 md:py-4 flex items-center justify-between bg-white/10 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-white/20">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
        >
          <ArrowLeft size={28} className="text-gray-700 dark:text-gray-200" />
        </button>
        
        <div className="flex flex-col items-center">
          {customHeader ? (
            customHeader
          ) : (
            <>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h1>
              <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-0.5 rounded-full">
                第 {level} 关
              </span>
            </>
          )}
        </div>

        <div className="min-w-[40px] flex justify-end">
          {headerRight}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col p-2 md:p-4 max-w-6xl mx-auto w-full h-full justify-center">
        {children}
      </main>
    </div>
  );
};

export default GameLayout;