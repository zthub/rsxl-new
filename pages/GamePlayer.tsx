
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TRAINING_MODULES } from '../constants';
import { ArrowLeft, RefreshCw, Play, Pause, Target as TargetIcon, Home } from 'lucide-react';
import { GameRegistry } from '../games/registry';

// 时间格式化工具 (MM:SS)
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

type GameOverReason = 'TIMEOUT' | 'FAILURE' | null;

export const GamePlayer: React.FC = () => {
  const { moduleId, gameId } = useParams<{ moduleId: string; gameId: string }>();
  const navigate = useNavigate();
  const module = TRAINING_MODULES.find((m) => m.id === moduleId);
  const game = module?.games.find((g) => g.id === gameId);

  // Check if this is a video player module (Grating Player)
  const isVideoPlayer = moduleId === 'grating-player';
  
  // Check if this is a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   (window.innerWidth <= 768);
  
  // Games that should not use fullscreen on mobile (g2-6: 俄罗斯方块新, g2-7: 动物消消乐, g2-8: 拆炸弹, g2-9: 保护小鸡, g3-1: 红蓝俄罗斯方块)
  const gamesWithoutFullscreenOnMobile = ['g2-5', 'g2-6', 'g2-7', 'g2-8', 'g2-9', 'g3-1'];
  const shouldUseFullscreen = !(isMobile && gamesWithoutFullscreenOnMobile.includes(gameId || ''));
  
  // Determine Game Duration
  // 默认没有时间限制 (0)，表示无限模式
  // g2-4 (六角消消乐) 现在改为内部计时，此处设为0
  let initialDuration = 0;
  
  // Helper to check if global timer is enabled
  const isTimerEnabled = initialDuration > 0;

  // Container Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Game State
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialDuration); 
  
  // If it's a video player, start immediately without modal
  const [isPlaying, setIsPlaying] = useState(isVideoPlayer);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null); 
  const [showStartModal, setShowStartModal] = useState(!isVideoPlayer);
  
  // 关键：用于强制重置游戏组件的 Key
  const [restartKey, setRestartKey] = useState(0); 

  const [ammo, setAmmo] = useState(20); // Specific to shooter

  // 进入全屏模式的函数
  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch((err) => {
        console.log('无法进入全屏模式:', err);
      });
    } else if ((element as any).webkitRequestFullscreen) {
      // Safari
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      // IE/Edge
      (element as any).msRequestFullscreen();
    }
  };

  // 退出全屏模式的函数
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.log('无法退出全屏模式:', err);
      });
    } else if ((document as any).webkitExitFullscreen) {
      // Safari
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      // IE/Edge
      (document as any).msExitFullscreen();
    }
  };

  // Handle Resize - 添加 orientationchange 事件以支持手机横屏
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            // 延迟一下，确保在横屏切换后能获取到正确的尺寸
            setTimeout(() => {
                if (containerRef.current) {
                    setDimensions({
                        width: containerRef.current.clientWidth,
                        height: containerRef.current.clientHeight
                    });
                }
            }, 100);
        }
    };
    const handleOrientationChange = () => {
        // 横屏切换时，延迟更久一点以确保获取正确尺寸
        setTimeout(() => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        }, 300);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    handleResize(); 
    setTimeout(handleResize, 100);
    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // 对于视频播放器，在组件挂载时自动进入全屏
  useEffect(() => {
    if (isVideoPlayer && isPlaying && shouldUseFullscreen) {
      enterFullscreen();
    }
  }, [isVideoPlayer, isPlaying, shouldUseFullscreen]);

  // 组件卸载时退出全屏
  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    // Only run timer if explicitly enabled (duration > 0)
    if (isPlaying && isTimerEnabled && timeLeft > 0 && !gameOver) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                if (!isVideoPlayer) {
                    setIsPlaying(false);
                    setGameOver(true);
                    setGameOverReason('TIMEOUT'); // 标记为时间到了
                }
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, gameOver, isVideoPlayer, isTimerEnabled]);

  const startGame = () => {
    setShowStartModal(false);
    setScore(0);
    setTimeLeft(initialDuration);
    setGameOver(false);
    setGameOverReason(null);
    setIsPlaying(true);
    setAmmo(20);
    setRestartKey(k => k + 1); // 强制刷新游戏组件
    // 进入全屏模式（手机端的特定游戏除外）
    if (shouldUseFullscreen) {
      enterFullscreen();
    }
  };

  const stopGame = () => setIsPlaying(false);
  
  const resetGame = () => {
    startGame();
  };

  const continueGame = () => {
      setGameOver(false);
      setGameOverReason(null);
      setIsPlaying(true);
      // 只有有时间限制的游戏才加时间
      if (isTimerEnabled) {
          setTimeLeft(prev => prev + initialDuration); 
      }
  };

  const goBack = () => {
      // 退出全屏模式
      exitFullscreen();
      navigate(`/module/${moduleId}`);
  };

  const handleGameComponentGameOver = () => {
      setGameOver(true);
      setIsPlaying(false);
      setGameOverReason('FAILURE'); // 标记为游戏失败
  };

  // Resolve Component
  const GameComponent = gameId ? GameRegistry[gameId] : null;

  // Gold Miner (g1-13) & Hexagon (g2-4) has no continue option on failure/timeout
  const hideContinue = gameOverReason === 'FAILURE' || gameId === 'g1-13' || gameId === 'g2-4';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900" ref={containerRef}>
      {/* Control Bar - Added pointer-events-none to container, auto to children to prevent blocking game clicks */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 transition-opacity duration-300 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
            <button onClick={goBack} className="p-2 hover:bg-white/50 rounded-full text-slate-600 transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <h2 className="font-bold text-slate-800 text-sm md:text-base">{game?.title}</h2>
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 font-medium">
                   <span>分数: {score}</span>
                   
                   {/* 仅当启用倒计时时显示时间 */}
                   {isTimerEnabled && (
                       <>
                        <span className="text-slate-300">|</span>
                        <span className={`${timeLeft < 10 && isPlaying ? 'text-red-500 font-bold animate-pulse' : ''}`}>
                            时间: {formatTime(timeLeft)}
                        </span>
                       </>
                   )}

                   {gameId === 'g1-7' && (
                       <>
                        <span className="text-slate-300">|</span>
                        <span className={`${ammo <= 3 ? 'text-red-500 font-bold' : 'text-slate-600'}`}>子弹: {ammo}</span>
                       </>
                   )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
            {isPlaying && (
                <button onClick={stopGame} className="flex items-center gap-2 px-4 py-1.5 bg-orange-400 text-white rounded-full font-bold shadow-md hover:bg-orange-500 transition-colors text-sm">
                    <Pause className="w-4 h-4" /> <span className="hidden md:inline">暂停</span>
                </button>
            )}
            {!isPlaying && !gameOver && !showStartModal && (
                 <button onClick={() => setIsPlaying(true)} className="flex items-center gap-2 px-4 py-1.5 bg-brand-blue text-white rounded-full font-bold shadow-md hover:bg-blue-500 transition-colors text-sm">
                    <Play className="w-4 h-4" /> <span className="hidden md:inline">继续</span>
                 </button>
            )}
            {/* 游戏中途的重置按钮 */}
            {!showStartModal && !gameOver && (
                <button onClick={resetGame} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors" title="重新开始">
                    <RefreshCw className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {/* Game Area */}
      <div className={`w-full h-full relative overflow-hidden ${gameId === 'g3-3' ? '' : 'bg-black'}`}>
        {dimensions.width > 0 && GameComponent && (
            <GameComponent 
                key={restartKey} // 关键：Key 变化时 React 会完全销毁并重建组件
                width={dimensions.width}
                height={dimensions.height}
                isPlaying={isPlaying}
                onScore={(pts) => setScore(s => s + pts)}
                onGameOver={handleGameComponentGameOver}
                onUpdateAmmo={setAmmo}
                gameId={gameId || ''}
            />
        )}

        {/* Start Modal */}
        {showStartModal && (
            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm z-50 animate-fade-in p-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full border-4 border-brand-blue/20">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-blue rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
                        <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">{game?.title}</h3>
                    <p className="text-slate-500 mb-6 md:mb-8 text-sm md:text-base">{game?.description}</p>
                    
                    <div className="space-y-3">
                        <button onClick={startGame} className="w-full py-3 md:py-4 bg-brand-blue text-white rounded-xl font-bold text-lg shadow-blue-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95">
                            开始训练 {isTimerEnabled ? `(${Math.floor(initialDuration/60)}分钟)` : ''}
                        </button>
                        <button onClick={goBack} className="block w-full py-3 text-slate-400 font-medium hover:text-slate-600 text-sm">
                            返回上一页
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-md animate-fade-in z-50 p-4">
                <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full border-4 border-brand-yellow/30">
                    <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg animate-bounce">
                        🏆
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                        {gameOverReason === 'TIMEOUT' ? '训练时间到!' : '游戏结束'}
                    </h3>
                    <p className="text-slate-500 mb-6">最终得分: <span className="text-3xl font-bold text-brand-blue ml-2">{score}</span></p>
                    
                    <div className="space-y-3">
                        {!hideContinue && (
                            <button onClick={continueGame} className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-all">
                                继续游戏 {isTimerEnabled ? `(+${Math.floor(initialDuration/60)}分钟)` : ''}
                            </button>
                        )}
                        <button onClick={resetGame} className="w-full py-3 bg-brand-green text-white rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all">
                            再来一局
                        </button>
                        <button onClick={goBack} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                            <Home className="w-4 h-4" /> 返回列表
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
