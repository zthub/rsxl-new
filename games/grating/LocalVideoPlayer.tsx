
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { Upload, Video as VideoIcon, Trash2 } from 'lucide-react';

export const LocalVideoPlayer: React.FC<GameComponentProps> = ({ width, height, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 背景动画循环
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);
        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity]);

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

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* 1. 背景层 */}
            <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0 block" />

            {/* 2. 视频区域 */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div 
                    className="pointer-events-auto relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm flex flex-col items-center justify-center"
                    style={{
                        width: '480px',
                        maxWidth: '90%',
                        aspectRatio: '16/9',
                        minHeight: '270px'
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
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                                title="移除视频"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
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
