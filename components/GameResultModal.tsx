import React from 'react';
import { GameState } from '../types';
import { RefreshCcw, Home, Play } from 'lucide-react';

interface Props {
  gameState: GameState;
  onRestart: () => void;
  onNextLevel?: () => void;
  onHome: () => void;
  message?: string;
  isLastLevel?: boolean;
}

const GameResultModal: React.FC<Props> = ({ gameState, onRestart, onNextLevel, onHome, message, isLastLevel }) => {
  if (gameState !== GameState.WON && gameState !== GameState.GAME_OVER) return null;

  const isWin = gameState === GameState.WON;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl text-center transform transition-all scale-100 ${isWin ? 'bg-gradient-to-b from-yellow-100 to-white' : 'bg-white'}`}>
        
        <div className="mb-6">
          {isWin ? (
            <div className="text-6xl animate-bounce">🎉</div>
          ) : (
            <div className="text-6xl animate-pulse">💥</div>
          )}
        </div>

        <h2 className={`text-3xl font-black mb-2 ${isWin ? 'text-yellow-600' : 'text-gray-800'}`}>
          {isWin ? '挑战成功!' : '游戏结束'}
        </h2>
        
        <p className="text-gray-600 text-lg mb-8 font-medium">
          {message || (isWin ? '你的眼睛真敏锐！' : '再试一次，你一定行！')}
        </p>

        <div className="flex flex-col gap-3">
          {isWin && !isLastLevel && onNextLevel && (
            <button
              onClick={onNextLevel}
              className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Play size={24} fill="currentColor" />
              下一关
            </button>
          )}

          <button
            onClick={onRestart}
            className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95
              ${isWin && !isLastLevel ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' : 'bg-blue-500 hover:bg-blue-600 text-white'}
            `}
          >
            <RefreshCcw size={24} />
            {isWin && isLastLevel ? '再玩一次' : '重新开始'}
          </button>

          <button
            onClick={onHome}
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-lg flex items-center justify-center gap-2 mt-2"
          >
            <Home size={20} />
            返回主页
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResultModal;