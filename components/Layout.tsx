import React from 'react';
import { Home, Settings, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  // 检查是否在游戏页面，如果是，则移除宽度限制和内边距
  const isGamePage = location.pathname.includes('/game/');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header - 在游戏页面可以隐藏或简化，这里保持显示但背景可能需要调整 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className={`mx-auto px-4 py-3 flex justify-between items-center ${isGamePage ? 'w-full' : 'max-w-5xl'}`}>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-blue to-brand-purple rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
              BE
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">BrightEyes</h1>
              <p className="text-xs text-slate-500 font-medium">儿童弱视训练系统</p>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
             {!isHome && (
                <Link to="/" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <Home className="w-6 h-6 text-slate-600" />
                </Link>
             )}
            <button className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
              <User className="w-6 h-6 text-slate-600" />
            </button>
            <button className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
              <Settings className="w-6 h-6 text-slate-600" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content - 游戏页面占满全屏，普通页面保持居中和内边距 */}
      <main className={`flex-grow w-full ${isGamePage ? 'p-0 overflow-hidden' : 'max-w-5xl mx-auto p-4 md:p-6'}`}>
        {children}
      </main>

      {/* Footer - 游戏页面不显示 Footer 以避免干扰 */}
      {!isGamePage && (
        <footer className="bg-white border-t border-slate-100 py-6 mt-8">
          <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
            <p>© 2024 BrightEyes Trainer. 坚持训练，重获清晰视界。</p>
          </div>
        </footer>
      )}
    </div>
  );
};