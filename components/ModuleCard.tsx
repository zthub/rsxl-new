import React from 'react';
import { TrainingModule } from '../types';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleCardProps {
  module: TrainingModule;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  // Dynamically resolve the icon
  const IconComponent = (Icons as any)[module.iconName] || Icons.HelpCircle;

  return (
    <Link 
        to={`/module/${module.id}`}
        className="group relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block h-full ring-1 ring-slate-100"
    >
      {/* Background Gradient decoration */}
      <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${module.colorFrom} ${module.colorTo}`} />
      
      <div className="p-6 flex flex-col items-center text-center h-full">
        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${module.colorFrom} ${module.colorTo} flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        
        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600">
          {module.title}
        </h3>
        
        <p className="text-slate-500 text-sm leading-relaxed">
          {module.description}
        </p>

        <div className="mt-auto pt-6 w-full">
            <span className="inline-block py-2 px-4 rounded-full bg-slate-50 text-slate-600 font-semibold text-sm group-hover:bg-slate-100 transition-colors">
                进入训练 &rarr;
            </span>
        </div>
      </div>
    </Link>
  );
};