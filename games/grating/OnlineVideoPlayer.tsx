
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { ListVideo } from 'lucide-react';

interface VideoSource {
    id: string;
    title: string;
    url: string;
}

const VIDEO_LIST: VideoSource[] = [
    {
        id: 'donkey',
        title: '小毛驴儿歌',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=663702413&bvid=BV1ya4y1U7o1&cid=1340037362&p=1&high_quality=1&danmaku=0"
    },
    {
        id: 'english-songs',
        title: '英语启蒙歌曲 (15首)',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=115553779844782&bvid=BV1jJCyB8EmD&cid=34027145271&p=1&high_quality=1&danmaku=0"
    },
    {
        id: 'animal-kingdom',
        title: '动物王国大冒险',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=311657791&bvid=BV1uN411T7um&cid=1072609515&p=1&high_quality=1&danmaku=0"
    },
    {
        id: 'spring-where',
        title: '春天在哪里',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=94915347&bvid=BV1ZE411K7hG&cid=162033842&p=1&high_quality=1&danmaku=0"
    },
    {
        id: 'spring-where-en',
        title: '春天在哪里 (英文版)',
        url: "//player.bilibili.com/player.html?isOutside=true&aid=1402657882&bvid=BV1jr421t7GD&cid=1489517027&p=1&high_quality=1&danmaku=0"
    }
];

export const OnlineVideoPlayer: React.FC<GameComponentProps> = ({ width, height, isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';
    
    const [currentVideo, setCurrentVideo] = useState<VideoSource>(VIDEO_LIST[0]);
    const [showMenu, setShowMenu] = useState(false);

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

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* 1. 视觉刺激背景层 */}
            <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="absolute inset-0 block" 
            />

            {/* 2. 视频播放器层 & UI */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-4">
                
                {/* 控制栏 - 放置在播放器上方右侧 */}
                <div 
                    className="flex justify-end mb-2 pointer-events-none"
                    style={{ width: '480px', maxWidth: '100%' }}
                >
                    <div className="pointer-events-auto relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/90 text-slate-800 rounded-lg shadow-lg hover:bg-white transition-all font-bold text-sm backdrop-blur-md border border-slate-200"
                        >
                            <ListVideo className="w-4 h-4" />
                            切换视频
                        </button>

                        {/* 下拉菜单 */}
                        {showMenu && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in max-h-[60vh] overflow-y-auto z-50">
                                {VIDEO_LIST.map(video => (
                                    <button
                                        key={video.id}
                                        onClick={() => {
                                            setCurrentVideo(video);
                                            setShowMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                                            currentVideo.id === video.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'
                                        }`}
                                    >
                                        {video.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 播放器容器 */}
                <div 
                    className="pointer-events-auto relative bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm group"
                    style={{
                        width: '480px',
                        maxWidth: '100%',
                        aspectRatio: '16/9'
                    }}
                >
                    {isPlaying ? (
                        <iframe 
                            key={currentVideo.id} // 确保切换视频时重新加载 iframe
                            src={currentVideo.url}
                            className="w-full h-full"
                            scrolling="no" 
                            frameBorder="0"
                            allowFullScreen={true}
                            referrerPolicy="no-referrer"
                            title={currentVideo.title}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-900 font-bold">
                            准备播放
                        </div>
                    )}
                </div>
            </div>

            {/* 底部提示 */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/80 font-bold text-xs md:text-sm bg-black/40 inline-block px-4 py-1.5 rounded-full backdrop-blur-md">
                    正在播放: {currentVideo.title} — 请保持注视屏幕中央
                </p>
            </div>
        </div>
    );
};
