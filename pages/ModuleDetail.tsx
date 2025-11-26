import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { TRAINING_MODULES } from '../constants';
import * as Icons from 'lucide-react';
import { Game } from '../types';

export const ModuleDetail: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const module = TRAINING_MODULES.find((m) => m.id === moduleId);

  // State for Visual Acuity (only for stimulation module)
  const [visualAcuity, setVisualAcuity] = useState<string>('0.2-0.4');

  useEffect(() => {
    const saved = localStorage.getItem('visualAcuity');
    if (saved) setVisualAcuity(saved);
  }, []);

  const handleAcuityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setVisualAcuity(val);
      localStorage.setItem('visualAcuity', val);
  };

  if (!module) {
    return <Navigate to="/" replace />;
  }

  const IconComponent = (Icons as any)[module.iconName] || Icons.HelpCircle;

  return (
    <div className="animate-fade-in">
      <div className={`rounded-3xl bg-gradient-to-r ${module.colorFrom} ${module.colorTo} p-8 text-white mb-8 shadow-lg`}>
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <IconComponent className="w-12 h-12 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
                    <p className="text-white/90 text-lg">{module.description}</p>
                </div>
            </div>

            {/* Visual Acuity Global Setting - Only for Stimulation Module */}
            {moduleId === 'stimulation' && (
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[200px]">
                    <label className="block text-white/80 text-sm font-semibold mb-2 flex items-center gap-2">
                        <Icons.Eye className="w-4 h-4" />
                        训练视力等级
                    </label>
                    <select 
                        value={visualAcuity} 
                        onChange={handleAcuityChange}
                        className="w-full bg-white/90 text-slate-800 text-sm rounded-lg border-0 ring-2 ring-transparent focus:ring-white p-2.5 font-medium cursor-pointer"
                    >
                        <option value="0.0-0.1">低视力 (0.0-0.1)</option>
                        <option value="0.2-0.4">中低视力 (0.2-0.4)</option>
                        <option value="0.5-0.6">中高视力 (0.5-0.6)</option>
                        <option value="0.7-0.9">高视力 (0.7-0.9)</option>
                    </select>
                    <p className="text-xs text-white/60 mt-2">
                        此设置将应用于所有视觉刺激游戏
                    </p>
                </div>
            )}
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Icons.Gamepad2 className="w-6 h-6 text-slate-400" />
        选择训练项目
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {module.games.map((game) => (
          <GameItem key={game.id} game={game} moduleId={module.id} />
        ))}
      </div>
    </div>
  );
};

interface GameItemProps {
  game: Game;
  moduleId: string;
}

const GameItem: React.FC<GameItemProps> = ({ game, moduleId }) => {
    let difficultyColor = 'bg-green-100 text-green-700';
    if (game.difficulty === 'Medium') difficultyColor = 'bg-yellow-100 text-yellow-700';
    if (game.difficulty === 'Hard') difficultyColor = 'bg-red-100 text-red-700';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex justify-between items-center group">
      <div>
        <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            {game.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-md font-medium ${difficultyColor}`}>
                {game.difficulty}
            </span>
        </div>
        <p className="text-slate-500 text-sm">{game.description}</p>
      </div>
      
      <Link 
        to={`/module/${moduleId}/game/${game.id}`}
        className="ml-4 w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"
      >
        <Icons.Play className="w-5 h-5 ml-1" />
      </Link>
    </div>
  );
};