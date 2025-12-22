import React from 'react';
import { GAMES } from '../constants';
import { GameType } from '../types';

interface Props {
  onSelectGame: (id: GameType) => void;
}

const Home: React.FC<Props> = ({ onSelectGame }) => {
  return (
    <div className="min-h-screen bg-[#E0F7FA] relative overflow-hidden flex flex-col items-center py-10 px-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#4DD0E1] to-[#E0F7FA] rounded-b-[50%] scale-150 z-0 opacity-50"></div>
      
      {/* Header */}
      <div className="relative z-10 text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-blue-900 tracking-wider mb-2 drop-shadow-sm">
          快乐爱眼训练营
        </h1>
        <p className="text-blue-700 text-lg font-medium">每天坚持玩一玩，眼睛更明亮！</p>
      </div>

      {/* Game Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className="group relative flex flex-col items-center text-left bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-b-8 border-gray-100 active:border-b-0 active:translate-y-0"
          >
             {/* Card Header Color */}
            <div className={`absolute top-0 left-0 w-full h-24 ${game.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
            
            <div className={`relative z-10 w-24 h-24 mb-4 rounded-full ${game.color} flex items-center justify-center text-5xl shadow-inner group-hover:scale-110 transition-transform duration-300`}>
              {game.icon}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{game.title}</h3>
            <p className="text-gray-500 text-center leading-relaxed">{game.description}</p>
            
            <div className="mt-6 w-full py-2 bg-gray-50 rounded-xl text-center text-blue-500 font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
              开始游戏
            </div>
          </button>
        ))}
      </div>

      {/* Footer / Characters */}
      <div className="fixed bottom-0 w-full flex justify-between px-4 pointer-events-none opacity-50 md:opacity-100">
         {/* Simple CSS shapes for clouds/grass could go here, but keeping it clean for now */}
      </div>
    </div>
  );
};

export default Home;