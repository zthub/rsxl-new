import React, { useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';

export const ConsultationBtn: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white shadow-lg border border-slate-200 rounded-l-2xl p-3 flex flex-col items-center gap-1 hover:bg-slate-50 transition-all hover:translate-x-[-4px] group"
        aria-label="专业咨询"
      >
        <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
          <MessageSquareText size={24} />
        </div>
        <span className="text-[10px] font-bold text-slate-600 vertical-text">专业咨询</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-slate-800">专业咨询</h3>
              <p className="text-slate-500 text-sm">扫码添加专家微信，获取专业指导</p>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center">
                <img 
                  src="/images/kf.png" 
                  alt="专业咨询二维码" 
                  className="w-full h-auto rounded-lg shadow-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/400x400?text=QR+Code+Not+Found';
                  }}
                />
              </div>
              
              <p className="text-[10px] text-slate-400">坚持训练，守护孩子明亮双眼</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: upright;
          letter-spacing: 0.1em;
        }
      `}</style>
    </>
  );
};
