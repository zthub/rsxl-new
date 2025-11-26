import React from 'react';
import { TRAINING_MODULES } from '../constants';
import { ModuleCard } from '../components/ModuleCard';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 py-8">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
          今天想做哪个训练？
        </h2>
        <p className="text-slate-500 text-lg">
          坚持每天打卡，让眼睛更明亮
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TRAINING_MODULES.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
};