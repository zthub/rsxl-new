import React, { useState } from 'react';
import { Home, Settings, User, Info } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isGamePage = location.pathname.includes('/game/');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
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
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors relative"
            >
              <Settings className="w-6 h-6 text-slate-600" />
            </button>
          </nav>
        </div>
      </header>

      {/* Settings Dropdown Menu */}
      {showSettingsMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSettingsMenu(false)}
          />
          <div className="fixed top-16 right-4 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 min-w-[160px] animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setShowSettingsMenu(false);
                setShowAboutModal(true);
              }}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-slate-700 font-medium"
            >
              <Info size={18} />
              关于
            </button>
          </div>
        </>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-800 mb-4">关于</h3>
            <div className="space-y-4">
              <p className="text-slate-500 text-sm">
                点击下方链接了解更多信息：
              </p>
              <a
                href="https://dlsc.rsxl.xyz/BUvBI4"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                访问链接
              </a>
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full mt-2 text-slate-500 hover:text-slate-700 font-medium py-2 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

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