
import React, { useRef, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';

export const LittleDonkeyGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    // 用户指定的 Bilibili 视频链接
    // 基础链接: //player.bilibili.com/player.html?isOutside=true&aid=663702413&bvid=BV1ya4y1U7o1&cid=1340037362&p=1
    // 额外添加: high_quality=1 (高清优先), danmaku=0 (关闭弹幕避免干扰)
    const VIDEO_URL = "https://player.bilibili.com/player.html?isOutside=true&aid=663702413&bvid=BV1ya4y1U7o1&cid=1340037362&p=1&high_quality=1&danmaku=0";

    // 背景动画循环 (仅负责视觉刺激背景)
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        
        // 渲染通用的闪烁背景 (光栅/棋盘格)
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
            {/* 1. 背景层：视觉刺激 (全屏) */}
            <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                className="absolute inset-0 block" 
            />

            {/* 2. 视频层：居中显示，占据一小块位置 */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div 
                    className="pointer-events-auto relative bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm"
                    style={{
                        width: '480px',    // 固定宽度，保证只占中间一小块
                        maxWidth: '90%',   // 移动端适配
                        aspectRatio: '16/9'
                    }}
                >
                    {isPlaying ? (
                        <iframe 
                            src={VIDEO_URL}
                            className="w-full h-full"
                            scrolling="no" 
                            frameBorder="0"
                            allowFullScreen={true}
                            // 添加 no-referrer 以确保非 Bilibili 域名下能正常加载视频
                            referrerPolicy="no-referrer"
                            title="小毛驴儿歌"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-900 font-bold">
                            加载中...
                        </div>
                    )}
                </div>
            </div>

            {/* 底部提示 */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/80 font-bold text-sm bg-black/30 inline-block px-4 py-1 rounded-full backdrop-blur-md">
                    请点击播放按钮观看，同时利用余光感受背景刺激
                </p>
            </div>
        </div>
    );
};
