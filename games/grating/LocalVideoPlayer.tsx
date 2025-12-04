
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { Upload, Video as VideoIcon, Trash2, Maximize2, Eye, EyeOff } from 'lucide-react';

export const LocalVideoPlayer: React.FC<GameComponentProps> = ({ width, height, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // 视力类型：视觉刺激 / 立体视，从本地存储读取上次保存的值
    const [visionType, setVisionType] = useState<'visual' | 'stereo'>(() => {
        const saved = localStorage.getItem('gratingPlayerVisionType');
        if (saved === 'visual' || saved === 'stereo') {
            return saved;
        }
        return 'visual';
    });

    // 视频窗口大小状态
    const [videoSize, setVideoSize] = useState({ width: 480, height: 270 });
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartRef = useRef<{ x: number; y: number; startWidth: number; startHeight: number } | null>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    
    // 透明度状态（视觉刺激时：调视频整体透明度；立体视时：调红蓝遮罩透明度）
    const [opacity, setOpacity] = useState(1.0);
    const [showOpacityControl, setShowOpacityControl] = useState(false);

    // 当切换为立体视时，将遮罩默认透明度设置为 80%；切回视觉刺激则恢复为 100%
    useEffect(() => {
        if (visionType === 'stereo') {
            setOpacity(0.8);
        } else {
            setOpacity(1.0);
        }
    }, [visionType]);

    // 背景动画 / 静态背景循环
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (visionType === 'stereo') {
            // 立体视：简单静态背景
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#020617');
            gradient.addColorStop(1, '#111827');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        } else {
            // 视觉刺激：原动态背景
            frameCountRef.current++;
            renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);
        }
        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, visionType]);

    // 设置Canvas高DPI支持
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        
        // 设置实际分辨率（物理像素）
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // 设置CSS显示尺寸（逻辑像素）
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        // 缩放上下文以匹配设备像素比
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
            ctx.scale(dpr, dpr);
        }
    }, [width, height]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    // 处理文件选择
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setFileName(file.name);
        }
    };

    // 清除视频
    const clearVideo = () => {
        if (videoSrc) {
            URL.revokeObjectURL(videoSrc);
        }
        setVideoSrc(null);
        setFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 组件卸载时清理 URL
    useEffect(() => {
        return () => {
            if (videoSrc) URL.revokeObjectURL(videoSrc);
        };
    }, []);

    // 拖拽调整大小处理
    const handleResizeStart = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!videoContainerRef.current) return;
        
        const rect = videoContainerRef.current.getBoundingClientRect();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            startWidth: videoSize.width,
            startHeight: videoSize.height
        };
        
        // 设置全局指针捕获
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleResizeMove = (e: React.PointerEvent) => {
        if (!isResizing || !resizeStartRef.current) return;
        e.preventDefault();
        
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;
        
        // 计算新尺寸（保持16:9比例或自由调整）
        const newWidth = Math.max(240, Math.min(width * 0.9, resizeStartRef.current.startWidth + deltaX));
        const newHeight = Math.max(135, Math.min(height * 0.9, resizeStartRef.current.startHeight + deltaY));
        
        setVideoSize({ width: newWidth, height: newHeight });
    };

    const handleResizeEnd = (e: React.PointerEvent) => {
        if (!isResizing) return;
        e.preventDefault();
        setIsResizing(false);
        resizeStartRef.current = null;
        
        // 释放指针捕获
        try {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch (err) {
            // 忽略错误
        }
    };

    // 重置大小到默认值
    const resetSize = () => {
        setVideoSize({ width: 480, height: 270 });
    };
    
    // 重置透明度到默认值
    const resetOpacity = () => {
        setOpacity(1.0);
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* 1. 背景层 */}
            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* 2. 顶部控制栏：视力类型选择 */}
            <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-lg shadow border border-slate-200 text-xs text-slate-700">
                    <span className="font-semibold whitespace-nowrap">视力类型</span>
                    <select
                        value={visionType}
                        onChange={(e) => {
                            const newValue = e.target.value as 'visual' | 'stereo';
                            setVisionType(newValue);
                            // 保存到本地存储
                            localStorage.setItem('gratingPlayerVisionType', newValue);
                        }}
                        className="border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="visual">视觉刺激</option>
                        <option value="stereo">立体视</option>
                    </select>
                </div>
            </div>

            {/* 3. 视频区域 */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div 
                    ref={videoContainerRef}
                    className="pointer-events-auto relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm flex flex-col items-center justify-center"
                    style={{
                        width: `${videoSize.width}px`,
                        height: `${videoSize.height}px`,
                        maxWidth: '90%',
                        maxHeight: '90%',
                        minWidth: '240px',
                        minHeight: '135px',
                        // 视觉刺激：调整体透明度；立体视：视频始终不透明
                        opacity: visionType === 'visual' ? opacity : 1
                    }}
                >
                    {videoSrc ? (
                        <div className="relative w-full h-full group">
                            <video 
                                src={videoSrc}
                                className="w-full h-full object-contain bg-black"
                                controls
                                autoPlay
                                loop
                            />
                            <button 
                                onClick={clearVideo}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-20"
                                title="移除视频"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {/* 重置大小按钮 */}
                            <div className="absolute top-2 left-2 flex gap-2 z-20">
                                <button 
                                    onClick={resetSize}
                                    className="p-2 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-lg"
                                    title="重置窗口大小"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setShowOpacityControl(!showOpacityControl)}
                                    className="p-2 bg-purple-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 shadow-lg"
                                    title="调整透明度"
                                >
                                    {opacity < 1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* 透明度 / 遮罩透明度 控制面板 */}
                            {showOpacityControl && (
                                <div className="absolute top-12 left-2 bg-white/95 backdrop-blur-md rounded-lg p-4 shadow-xl z-30 min-w-[200px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-slate-800">
                                            {visionType === 'visual' ? '透明度' : '遮罩透明度'}
                                        </span>
                                        <button 
                                            onClick={resetOpacity}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                                        >
                                            重置
                                        </button>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={opacity}
                                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                                        <span>0%</span>
                                        <span className="font-bold text-purple-600">{Math.round(opacity * 100)}%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            )}
                            {/* 拖拽调整大小手柄 */}
                            <div
                                className="absolute bottom-0 right-0 w-6 h-6 bg-white/80 rounded-tl-lg cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center"
                                onPointerDown={handleResizeStart}
                                onPointerMove={handleResizeMove}
                                onPointerUp={handleResizeEnd}
                                onPointerCancel={handleResizeEnd}
                                style={{
                                    cursor: isResizing ? 'nwse-resize' : 'nwse-resize'
                                }}
                            >
                                <div className="w-3 h-3 border-2 border-slate-600 rounded-sm"></div>
                            </div>

                            {/* 立体视遮罩：左红右蓝，透明度由 slider 控制 */}
                            {visionType === 'stereo' && (
                                <div className="pointer-events-none absolute inset-0 flex z-10">
                                    <div
                                        className="w-1/2 h-full"
                                        style={{
                                            backgroundColor: `rgba(255, 0, 0, ${opacity})`,
                                            mixBlendMode: 'multiply',
                                        }}
                                    />
                                    <div
                                        className="w-1/2 h-full"
                                        style={{
                                            backgroundColor: `rgba(0, 102, 255, ${opacity})`,
                                            mixBlendMode: 'multiply',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-6 space-y-4">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                                <VideoIcon className="w-8 h-8 text-white/70" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">选择本地视频</h3>
                                <p className="text-white/50 text-xs">支持 MP4, WebM 等常见格式</p>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-2 bg-brand-blue hover:bg-blue-500 text-white rounded-full font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 mx-auto"
                            >
                                <Upload className="w-4 h-4" />
                                打开文件
                            </button>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="video/*" 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/80 font-bold text-xs md:text-sm bg-black/40 inline-block px-4 py-1.5 rounded-full backdrop-blur-md">
                    {fileName ? `正在播放: ${fileName}` : '请打开视频文件开始训练'}
                </p>
            </div>
        </div>
    );
};
