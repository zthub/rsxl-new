
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameComponentProps } from '../../types';
import { renderCommonBackground } from '../../utils/visualRendering';
import { playSound } from '../../utils/gameUtils';

// --- 类型定义 ---
interface PuzzlePart {
    id: number;
    name: string;
    targetX: number; // 相对于动物中心的偏移
    targetY: number;
    currentX: number; // 屏幕绝对坐标
    currentY: number;
    isLocked: boolean;
    isDragging: boolean;
    draw: (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => void;
    width: number; // 用于碰撞检测
    height: number;
}

interface LevelDef {
    name: string;
    drawBase: (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => void;
    parts: Omit<PuzzlePart, 'currentX' | 'currentY' | 'isLocked' | 'isDragging'>[];
}

// --- 绘图辅助函数 (简化代码，支持大量关卡) ---
const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
};
const drawEllipse = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
};
const drawEye = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    drawCircle(ctx, x, y, r, '#000');
    drawCircle(ctx, x - r*0.3, y - r*0.3, r*0.3, '#fff');
};

// --- 海量关卡数据 (20个) ---
const LEVELS: LevelDef[] = [
    {
        name: '小熊',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 80 * s, '#f59e0b'); // 头
            drawEllipse(ctx, x, y + 20 * s, 35 * s, 25 * s, '#fde68a'); // 嘴区
            // 嘴
            ctx.strokeStyle = '#451a03'; ctx.lineWidth = 3 * s;
            ctx.beginPath(); ctx.moveTo(x, y + 20 * s); ctx.lineTo(x, y + 35 * s); ctx.stroke();
            ctx.beginPath(); ctx.arc(x - 10 * s, y + 35 * s, 10 * s, 0, Math.PI, false); ctx.stroke();
            ctx.beginPath(); ctx.arc(x + 10 * s, y + 35 * s, 10 * s, 0, Math.PI, false); ctx.stroke();
        },
        parts: [
            { id: 1, name: '左耳', targetX: -70, targetY: -70, width: 50, height: 50, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 25 * s, '#f59e0b'); drawCircle(ctx, x, y, 12 * s, '#fde68a'); } },
            { id: 2, name: '右耳', targetX: 70, targetY: -70, width: 50, height: 50, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 25 * s, '#f59e0b'); drawCircle(ctx, x, y, 12 * s, '#fde68a'); } },
            { id: 3, name: '左眼', targetX: -30, targetY: -20, width: 30, height: 30, draw: (ctx, x, y, s) => drawEye(ctx, x, y, 10 * s) },
            { id: 4, name: '右眼', targetX: 30, targetY: -20, width: 30, height: 30, draw: (ctx, x, y, s) => drawEye(ctx, x, y, 10 * s) },
            { id: 5, name: '鼻子', targetX: 0, targetY: 15, width: 30, height: 20, draw: (ctx, x, y, s) => drawEllipse(ctx, x, y, 12 * s, 8 * s, '#451a03') }
        ]
    },
    {
        name: '雪人',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y + 60 * s, 70 * s, '#fff'); // 身
            drawCircle(ctx, x, y - 50 * s, 50 * s, '#fff'); // 头
            drawCircle(ctx, x - 20 * s, y - 60 * s, 5 * s, '#333'); // 左眼底
            drawCircle(ctx, x + 20 * s, y - 60 * s, 5 * s, '#333'); // 右眼底
        },
        parts: [
            { id: 1, name: '帽子', targetX: 0, targetY: -100, width: 80, height: 80, draw: (ctx, x, y, s) => { ctx.fillStyle='#ef4444'; ctx.fillRect(x-35*s, y, 70*s, 40*s); ctx.fillRect(x-50*s, y+40*s, 100*s, 10*s); drawCircle(ctx, x, y, 15*s, '#fff'); } },
            { id: 2, name: '鼻子', targetX: 0, targetY: -45, width: 60, height: 20, draw: (ctx, x, y, s) => { ctx.fillStyle='#f97316'; ctx.beginPath(); ctx.moveTo(x-30*s, y+5*s); ctx.lineTo(x, y-5*s); ctx.lineTo(x, y+15*s); ctx.fill(); } },
            { id: 3, name: '围巾', targetX: 0, targetY: -10, width: 80, height: 40, draw: (ctx, x, y, s) => { ctx.fillStyle='#16a34a'; ctx.beginPath(); ctx.roundRect(x-45*s, y-10*s, 90*s, 20*s, 10); ctx.fill(); ctx.beginPath(); ctx.roundRect(x+10*s, y, 20*s, 50*s, 5); ctx.fill(); } }
        ]
    },
    {
        name: '狮子',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 90 * s, '#b45309'); // 鬃毛
            drawCircle(ctx, x, y, 65 * s, '#fcd34d'); // 脸
            drawCircle(ctx, x, y+20*s, 25*s, '#fff7ed'); // 嘴区
        },
        parts: [
            { id: 1, name: '左眼', targetX: -25, targetY: -10, width: 30, height: 30, draw: (ctx, x, y, s) => drawEye(ctx, x, y, 8 * s) },
            { id: 2, name: '右眼', targetX: 25, targetY: -10, width: 30, height: 30, draw: (ctx, x, y, s) => drawEye(ctx, x, y, 8 * s) },
            { id: 3, name: '鼻子', targetX: 0, targetY: 15, width: 30, height: 25, draw: (ctx, x, y, s) => { ctx.fillStyle='#78350f'; ctx.beginPath(); ctx.moveTo(x-12*s, y-8*s); ctx.lineTo(x+12*s, y-8*s); ctx.lineTo(x, y+10*s); ctx.fill(); } },
            { id: 4, name: '左耳', targetX: -60, targetY: -55, width: 40, height: 40, draw: (ctx, x, y, s) => drawCircle(ctx, x, y, 18*s, '#fcd34d') },
            { id: 5, name: '右耳', targetX: 60, targetY: -55, width: 40, height: 40, draw: (ctx, x, y, s) => drawCircle(ctx, x, y, 18*s, '#fcd34d') }
        ]
    },
    {
        name: '小猪',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 75 * s, '#fca5a5'); // 头
        },
        parts: [
            { id: 1, name: '鼻子', targetX: 0, targetY: 10, width: 60, height: 40, draw: (ctx, x, y, s) => { drawEllipse(ctx, x, y, 25*s, 18*s, '#f472b6'); drawCircle(ctx, x-8*s, y, 5*s, '#be185d'); drawCircle(ctx, x+8*s, y, 5*s, '#be185d'); } },
            { id: 2, name: '左耳', targetX: -50, targetY: -60, width: 40, height: 50, draw: (ctx, x, y, s) => { ctx.fillStyle='#fca5a5'; ctx.beginPath(); ctx.moveTo(x, y+20*s); ctx.lineTo(x-20*s, y-20*s); ctx.lineTo(x+20*s, y-10*s); ctx.fill(); } },
            { id: 3, name: '右耳', targetX: 50, targetY: -60, width: 40, height: 50, draw: (ctx, x, y, s) => { ctx.fillStyle='#fca5a5'; ctx.beginPath(); ctx.moveTo(x, y+20*s); ctx.lineTo(x+20*s, y-20*s); ctx.lineTo(x-20*s, y-10*s); ctx.fill(); } },
            { id: 4, name: '眼睛', targetX: 0, targetY: -20, width: 80, height: 30, draw: (ctx, x, y, s) => { drawEye(ctx, x-25*s, y, 8*s); drawEye(ctx, x+25*s, y, 8*s); } }
        ]
    },
    {
        name: '猫头鹰',
        drawBase: (ctx, x, y, s) => {
            drawEllipse(ctx, x, y, 70 * s, 80 * s, '#92400e'); // 身体
            drawEllipse(ctx, x, y+20*s, 50*s, 40*s, '#fef3c7'); // 肚子
        },
        parts: [
            { id: 1, name: '大眼睛', targetX: 0, targetY: -30, width: 100, height: 50, draw: (ctx, x, y, s) => { drawCircle(ctx, x-30*s, y, 22*s, '#fff'); drawCircle(ctx, x+30*s, y, 22*s, '#fff'); drawCircle(ctx, x-30*s, y, 8*s, '#000'); drawCircle(ctx, x+30*s, y, 8*s, '#000'); } },
            { id: 2, name: '嘴巴', targetX: 0, targetY: 0, width: 30, height: 30, draw: (ctx, x, y, s) => { ctx.fillStyle='#f59e0b'; ctx.beginPath(); ctx.moveTo(x-8*s, y); ctx.lineTo(x+8*s, y); ctx.lineTo(x, y+15*s); ctx.fill(); } },
            { id: 3, name: '左翅膀', targetX: -70, targetY: 20, width: 40, height: 60, draw: (ctx, x, y, s) => drawEllipse(ctx, x, y, 15*s, 30*s, '#78350f') },
            { id: 4, name: '右翅膀', targetX: 70, targetY: 20, width: 40, height: 60, draw: (ctx, x, y, s) => drawEllipse(ctx, x, y, 15*s, 30*s, '#78350f') }
        ]
    },
    {
        name: '熊猫',
        drawBase: (ctx, x, y, s) => {
             drawCircle(ctx, x, y, 75 * s, '#fff'); // 头
             drawCircle(ctx, x - 65 * s, y - 55 * s, 25 * s, '#000'); // 左耳
             drawCircle(ctx, x + 65 * s, y - 55 * s, 25 * s, '#000'); // 右耳
        },
        parts: [
            { id: 1, name: '左黑眼圈', targetX: -30, targetY: -10, width: 40, height: 40, draw: (ctx, x, y, s) => { drawEllipse(ctx, x, y, 18*s, 14*s, '#000'); drawCircle(ctx, x-5*s, y-5*s, 4*s, '#fff'); } },
            { id: 2, name: '右黑眼圈', targetX: 30, targetY: -10, width: 40, height: 40, draw: (ctx, x, y, s) => { drawEllipse(ctx, x, y, 18*s, 14*s, '#000'); drawCircle(ctx, x+5*s, y-5*s, 4*s, '#fff'); } },
            { id: 3, name: '鼻子', targetX: 0, targetY: 20, width: 30, height: 20, draw: (ctx, x, y, s) => drawEllipse(ctx, x, y, 10*s, 7*s, '#000') }
        ]
    },
    {
        name: '青蛙',
        drawBase: (ctx, x, y, s) => {
            drawEllipse(ctx, x, y+10*s, 80*s, 60*s, '#4ade80'); // 脸
        },
        parts: [
            { id: 1, name: '左眼泡', targetX: -50, targetY: -40, width: 50, height: 50, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 25*s, '#4ade80'); drawCircle(ctx, x, y, 10*s, '#000'); drawCircle(ctx, x-3*s, y-3*s, 4*s, '#fff'); } },
            { id: 2, name: '右眼泡', targetX: 50, targetY: -40, width: 50, height: 50, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 25*s, '#4ade80'); drawCircle(ctx, x, y, 10*s, '#000'); drawCircle(ctx, x-3*s, y-3*s, 4*s, '#fff'); } },
            { id: 3, name: '红晕', targetX: 0, targetY: 10, width: 120, height: 30, draw: (ctx, x, y, s) => { drawCircle(ctx, x-50*s, y, 10*s, '#fbcfe8'); drawCircle(ctx, x+50*s, y, 10*s, '#fbcfe8'); } },
            { id: 4, name: '嘴巴', targetX: 0, targetY: 30, width: 40, height: 20, draw: (ctx, x, y, s) => { ctx.strokeStyle='#064e3b'; ctx.lineWidth=3*s; ctx.beginPath(); ctx.arc(x, y-10*s, 20*s, 0.2*Math.PI, 0.8*Math.PI); ctx.stroke(); } }
        ]
    },
    {
        name: '兔子',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 70 * s, '#fff'); // 头
        },
        parts: [
            { id: 1, name: '左耳', targetX: -40, targetY: -90, width: 40, height: 100, draw: (ctx, x, y, s) => { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(x, y, 15*s, 50*s, -0.2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#fce7f3'; ctx.beginPath(); ctx.ellipse(x, y, 8*s, 35*s, -0.2, 0, Math.PI*2); ctx.fill(); } },
            { id: 2, name: '右耳', targetX: 40, targetY: -90, width: 40, height: 100, draw: (ctx, x, y, s) => { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(x, y, 15*s, 50*s, 0.2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#fce7f3'; ctx.beginPath(); ctx.ellipse(x, y, 8*s, 35*s, 0.2, 0, Math.PI*2); ctx.fill(); } },
            { id: 3, name: '红眼睛', targetX: 0, targetY: -10, width: 80, height: 30, draw: (ctx, x, y, s) => { drawCircle(ctx, x-25*s, y, 8*s, '#ef4444'); drawCircle(ctx, x+25*s, y, 8*s, '#ef4444'); } },
            { id: 4, name: '三瓣嘴', targetX: 0, targetY: 20, width: 30, height: 30, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 5*s, '#f472b6'); ctx.strokeStyle='#000'; ctx.lineWidth=2*s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-5*s, y+10*s); ctx.moveTo(x, y); ctx.lineTo(x+5*s, y+10*s); ctx.stroke(); } }
        ]
    },
    {
        name: '老虎',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 80 * s, '#f97316'); // 头
            drawCircle(ctx, x, y+25*s, 25*s, '#ffedd5'); // 嘴部
        },
        parts: [
            { id: 1, name: '王字', targetX: 0, targetY: -50, width: 40, height: 30, draw: (ctx, x, y, s) => { ctx.strokeStyle='#000'; ctx.lineWidth=4*s; ctx.beginPath(); ctx.moveTo(x-15*s, y-10*s); ctx.lineTo(x+15*s, y-10*s); ctx.moveTo(x-15*s, y); ctx.lineTo(x+15*s, y); ctx.moveTo(x-15*s, y+10*s); ctx.lineTo(x+15*s, y+10*s); ctx.moveTo(x, y-10*s); ctx.lineTo(x, y+10*s); ctx.stroke(); } },
            { id: 2, name: '左纹', targetX: -60, targetY: 0, width: 20, height: 40, draw: (ctx, x, y, s) => { ctx.fillStyle='#000'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+20*s, y-5*s); ctx.lineTo(x+20*s, y+5*s); ctx.fill(); } },
            { id: 3, name: '右纹', targetX: 60, targetY: 0, width: 20, height: 40, draw: (ctx, x, y, s) => { ctx.fillStyle='#000'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-20*s, y-5*s); ctx.lineTo(x-20*s, y+5*s); ctx.fill(); } },
            { id: 4, name: '五官', targetX: 0, targetY: -10, width: 80, height: 60, draw: (ctx, x, y, s) => { drawEye(ctx, x-25*s, y, 8*s); drawEye(ctx, x+25*s, y, 8*s); drawEllipse(ctx, x, y+30*s, 10*s, 8*s, '#000'); } }
        ]
    },
    {
        name: '考拉',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 75 * s, '#94a3b8'); // 灰头
        },
        parts: [
            { id: 1, name: '大鼻子', targetX: 0, targetY: 10, width: 30, height: 40, draw: (ctx, x, y, s) => drawEllipse(ctx, x, y, 15*s, 22*s, '#1e293b') },
            { id: 2, name: '左耳', targetX: -70, targetY: -40, width: 50, height: 50, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 30*s, '#94a3b8'); drawCircle(ctx, x, y, 20*s, '#fff'); } },
            { id: 3, name: '右耳', targetX: 70, targetY: -40, width: 50, height: 50, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 30*s, '#94a3b8'); drawCircle(ctx, x, y, 20*s, '#fff'); } },
            { id: 4, name: '眼睛', targetX: 0, targetY: -20, width: 80, height: 20, draw: (ctx, x, y, s) => { drawCircle(ctx, x-25*s, y, 6*s, '#000'); drawCircle(ctx, x+25*s, y, 6*s, '#000'); } }
        ]
    },
    {
        name: '狐狸',
        drawBase: (ctx, x, y, s) => {
             ctx.fillStyle = '#f97316';
             ctx.beginPath(); ctx.moveTo(x-60*s, y-40*s); ctx.lineTo(x+60*s, y-40*s); ctx.lineTo(x, y+70*s); ctx.fill(); // 脸
             ctx.fillStyle = '#fff';
             ctx.beginPath(); ctx.moveTo(x-60*s, y-40*s); ctx.lineTo(x-20*s, y-40*s); ctx.lineTo(x, y+70*s); ctx.fill(); // 左白脸
             ctx.beginPath(); ctx.moveTo(x+60*s, y-40*s); ctx.lineTo(x+20*s, y-40*s); ctx.lineTo(x, y+70*s); ctx.fill(); // 右白脸
        },
        parts: [
            { id: 1, name: '左耳', targetX: -50, targetY: -70, width: 40, height: 60, draw: (ctx, x, y, s) => { ctx.fillStyle='#f97316'; ctx.beginPath(); ctx.moveTo(x-20*s, y+20*s); ctx.lineTo(x+20*s, y+20*s); ctx.lineTo(x, y-30*s); ctx.fill(); } },
            { id: 2, name: '右耳', targetX: 50, targetY: -70, width: 40, height: 60, draw: (ctx, x, y, s) => { ctx.fillStyle='#f97316'; ctx.beginPath(); ctx.moveTo(x-20*s, y+20*s); ctx.lineTo(x+20*s, y+20*s); ctx.lineTo(x, y-30*s); ctx.fill(); } },
            { id: 3, name: '鼻子', targetX: 0, targetY: 60, width: 20, height: 20, draw: (ctx, x, y, s) => drawCircle(ctx, x, y, 8*s, '#000') },
            { id: 4, name: '眼睛', targetX: 0, targetY: -20, width: 80, height: 20, draw: (ctx, x, y, s) => { ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(x-20*s, y, 8*s, 4*s, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+20*s, y, 8*s, 4*s, 0, 0, Math.PI*2); ctx.fill(); } }
        ]
    },
    {
        name: '小鸡',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 70 * s, '#fde047');
        },
        parts: [
            { id: 1, name: '蛋壳', targetX: 0, targetY: 60, width: 80, height: 40, draw: (ctx, x, y, s) => { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x, y-20*s, 72*s, 0, Math.PI, false); ctx.lineTo(x-72*s, y-20*s); for(let i=0;i<6;i++) ctx.lineTo(x-72*s + (i+1)*24*s, y-20*s + (i%2==0?10*s:-10*s)); ctx.fill(); } },
            { id: 2, name: '嘴巴', targetX: 0, targetY: 0, width: 20, height: 20, draw: (ctx, x, y, s) => { ctx.fillStyle='#f97316'; ctx.beginPath(); ctx.moveTo(x-8*s, y); ctx.lineTo(x+8*s, y); ctx.lineTo(x, y+12*s); ctx.fill(); } },
            { id: 3, name: '眼睛', targetX: 0, targetY: -20, width: 60, height: 20, draw: (ctx, x, y, s) => { drawCircle(ctx, x-20*s, y, 5*s, '#000'); drawCircle(ctx, x+20*s, y, 5*s, '#000'); } }
        ]
    },
    {
        name: '猴子',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 70 * s, '#8d4f23'); // 头
            drawEllipse(ctx, x, y+15*s, 40*s, 30*s, '#fcd34d'); // 脸
            drawCircle(ctx, x, y-15*s, 25*s, '#fcd34d'); // 额头
        },
        parts: [
            { id: 1, name: '左耳', targetX: -70, targetY: 0, width: 40, height: 40, draw: (ctx, x, y, s) => drawCircle(ctx, x, y, 20*s, '#8d4f23') },
            { id: 2, name: '右耳', targetX: 70, targetY: 0, width: 40, height: 40, draw: (ctx, x, y, s) => drawCircle(ctx, x, y, 20*s, '#8d4f23') },
            { id: 3, name: '五官', targetX: 0, targetY: 0, width: 60, height: 50, draw: (ctx, x, y, s) => { drawEye(ctx, x-15*s, y-10*s, 6*s); drawEye(ctx, x+15*s, y-10*s, 6*s); drawCircle(ctx, x, y+10*s, 3*s, '#000'); ctx.strokeStyle='#000'; ctx.beginPath(); ctx.arc(x, y+20*s, 10*s, 0.2*Math.PI, 0.8*Math.PI); ctx.stroke(); } }
        ]
    },
    {
        name: '老鼠',
        drawBase: (ctx, x, y, s) => {
             drawCircle(ctx, x, y, 70 * s, '#9ca3af');
        },
        parts: [
            { id: 1, name: '左大耳', targetX: -60, targetY: -60, width: 60, height: 60, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 35*s, '#9ca3af'); drawCircle(ctx, x, y, 20*s, '#fca5a5'); } },
            { id: 2, name: '右大耳', targetX: 60, targetY: -60, width: 60, height: 60, draw: (ctx, x, y, s) => { drawCircle(ctx, x, y, 35*s, '#9ca3af'); drawCircle(ctx, x, y, 20*s, '#fca5a5'); } },
            { id: 3, name: '胡须', targetX: 0, targetY: 20, width: 120, height: 40, draw: (ctx, x, y, s) => { ctx.strokeStyle='#000'; ctx.lineWidth=2*s; ctx.beginPath(); ctx.moveTo(x-10*s, y); ctx.lineTo(x-50*s, y-10*s); ctx.moveTo(x-10*s, y+5*s); ctx.lineTo(x-50*s, y+15*s); ctx.moveTo(x+10*s, y); ctx.lineTo(x+50*s, y-10*s); ctx.moveTo(x+10*s, y+5*s); ctx.lineTo(x+50*s, y+15*s); ctx.stroke(); drawCircle(ctx, x, y, 6*s, '#000'); } },
            { id: 4, name: '眼睛', targetX: 0, targetY: -10, width: 60, height: 20, draw: (ctx, x, y, s) => { drawCircle(ctx, x-15*s, y, 5*s, '#000'); drawCircle(ctx, x+15*s, y, 5*s, '#000'); } }
        ]
    },
    {
        name: '大象',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 80 * s, '#94a3b8');
        },
        parts: [
            { id: 1, name: '长鼻子', targetX: 0, targetY: 40, width: 40, height: 80, draw: (ctx, x, y, s) => { ctx.strokeStyle='#94a3b8'; ctx.lineWidth=25*s; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x, y-20*s); ctx.quadraticCurveTo(x, y+40*s, x+30*s, y+30*s); ctx.stroke(); } },
            { id: 2, name: '左大耳', targetX: -80, targetY: 0, width: 60, height: 100, draw: (ctx, x, y, s) => { ctx.fillStyle='#94a3b8'; ctx.beginPath(); ctx.ellipse(x, y, 30*s, 60*s, 0, 0, Math.PI*2); ctx.fill(); } },
            { id: 3, name: '右大耳', targetX: 80, targetY: 0, width: 60, height: 100, draw: (ctx, x, y, s) => { ctx.fillStyle='#94a3b8'; ctx.beginPath(); ctx.ellipse(x, y, 30*s, 60*s, 0, 0, Math.PI*2); ctx.fill(); } },
            { id: 4, name: '眼睛', targetX: 0, targetY: -20, width: 80, height: 20, draw: (ctx, x, y, s) => { drawCircle(ctx, x-30*s, y, 6*s, '#000'); drawCircle(ctx, x+30*s, y, 6*s, '#000'); } }
        ]
    },
    {
        name: '企鹅',
        drawBase: (ctx, x, y, s) => {
            drawEllipse(ctx, x, y, 70 * s, 80 * s, '#1e293b'); // 黑身
            drawEllipse(ctx, x, y+10*s, 50 * s, 60 * s, '#fff'); // 白肚
        },
        parts: [
            { id: 1, name: '嘴巴', targetX: 0, targetY: -10, width: 30, height: 20, draw: (ctx, x, y, s) => { ctx.fillStyle='#facc15'; ctx.beginPath(); ctx.moveTo(x-10*s, y); ctx.lineTo(x+10*s, y); ctx.lineTo(x, y+15*s); ctx.fill(); } },
            { id: 2, name: '眼睛', targetX: 0, targetY: -30, width: 60, height: 20, draw: (ctx, x, y, s) => { drawEye(ctx, x-20*s, y, 8*s); drawEye(ctx, x+20*s, y, 8*s); } },
            { id: 3, name: '左翅', targetX: -70, targetY: 20, width: 30, height: 60, draw: (ctx, x, y, s) => { ctx.fillStyle='#1e293b'; ctx.beginPath(); ctx.ellipse(x, y, 15*s, 40*s, 0.2, 0, Math.PI*2); ctx.fill(); } },
            { id: 4, name: '右翅', targetX: 70, targetY: 20, width: 30, height: 60, draw: (ctx, x, y, s) => { ctx.fillStyle='#1e293b'; ctx.beginPath(); ctx.ellipse(x, y, 15*s, 40*s, -0.2, 0, Math.PI*2); ctx.fill(); } }
        ]
    },
    {
        name: '绵羊',
        drawBase: (ctx, x, y, s) => {
            // 羊毛
            ctx.fillStyle = '#f1f5f9';
            for(let i=0; i<8; i++) drawCircle(ctx, x + Math.cos(i*Math.PI/4)*60*s, y + Math.sin(i*Math.PI/4)*60*s, 30*s, '#f1f5f9');
            drawCircle(ctx, x, y, 70*s, '#f1f5f9');
            // 脸
            drawEllipse(ctx, x, y+10*s, 40*s, 50*s, '#fcd34d'); // 皮肤色
        },
        parts: [
            { id: 1, name: '眼睛', targetX: 0, targetY: 0, width: 60, height: 20, draw: (ctx, x, y, s) => { drawEye(ctx, x-15*s, y, 6*s); drawEye(ctx, x+15*s, y, 6*s); } },
            { id: 2, name: '耳朵', targetX: 0, targetY: -10, width: 120, height: 30, draw: (ctx, x, y, s) => { ctx.fillStyle='#fcd34d'; ctx.beginPath(); ctx.ellipse(x-50*s, y, 10*s, 20*s, 1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+50*s, y, 10*s, 20*s, -1, 0, Math.PI*2); ctx.fill(); } },
            { id: 3, name: '嘴巴', targetX: 0, targetY: 30, width: 20, height: 20, draw: (ctx, x, y, s) => { ctx.strokeStyle='#000'; ctx.lineWidth=2*s; ctx.beginPath(); ctx.moveTo(x, y-5*s); ctx.lineTo(x, y+5*s); ctx.moveTo(x-5*s, y+10*s); ctx.lineTo(x, y+5*s); ctx.lineTo(x+5*s, y+10*s); ctx.stroke(); } }
        ]
    },
    {
        name: '奶牛',
        drawBase: (ctx, x, y, s) => {
            drawEllipse(ctx, x, y, 70*s, 80*s, '#fff'); // 头
            drawEllipse(ctx, x, y+40*s, 50*s, 35*s, '#fca5a5'); // 嘴部
        },
        parts: [
            { id: 1, name: '黑斑', targetX: 30, targetY: -40, width: 40, height: 40, draw: (ctx, x, y, s) => { ctx.fillStyle='#000'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x+30*s, y-10*s, x+20*s, y+30*s); ctx.quadraticCurveTo(x-10*s, y+20*s, x, y); ctx.fill(); } },
            { id: 2, name: '角', targetX: 0, targetY: -80, width: 100, height: 40, draw: (ctx, x, y, s) => { ctx.fillStyle='#fcd34d'; ctx.beginPath(); ctx.moveTo(x-40*s, y+20*s); ctx.quadraticCurveTo(x-60*s, y, x-40*s, y-20*s); ctx.fill(); ctx.beginPath(); ctx.moveTo(x+40*s, y+20*s); ctx.quadraticCurveTo(x+60*s, y, x+40*s, y-20*s); ctx.fill(); } },
            { id: 3, name: '鼻孔', targetX: 0, targetY: 40, width: 40, height: 20, draw: (ctx, x, y, s) => { drawCircle(ctx, x-15*s, y, 6*s, '#000'); drawCircle(ctx, x+15*s, y, 6*s, '#000'); } },
            { id: 4, name: '眼睛', targetX: 0, targetY: -10, width: 80, height: 20, draw: (ctx, x, y, s) => { drawEye(ctx, x-30*s, y, 7*s); drawEye(ctx, x+30*s, y, 7*s); } }
        ]
    },
    {
        name: '章鱼',
        drawBase: (ctx, x, y, s) => {
            drawCircle(ctx, x, y, 60 * s, '#fb7185'); // 头
            // 脚
            for(let i=0; i<4; i++) {
                drawEllipse(ctx, x - 50*s + i*35*s, y+60*s, 15*s, 30*s, '#fb7185');
            }
        },
        parts: [
            { id: 1, name: '大眼睛', targetX: 0, targetY: 0, width: 80, height: 30, draw: (ctx, x, y, s) => { drawCircle(ctx, x-20*s, y, 15*s, '#fff'); drawCircle(ctx, x+20*s, y, 15*s, '#fff'); drawCircle(ctx, x-20*s, y, 5*s, '#000'); drawCircle(ctx, x+20*s, y, 5*s, '#000'); } },
            { id: 2, name: 'O嘴', targetX: 0, targetY: 30, width: 20, height: 20, draw: (ctx, x, y, s) => { ctx.strokeStyle='#be123c'; ctx.lineWidth=3*s; ctx.beginPath(); ctx.arc(x, y, 8*s, 0, Math.PI*2); ctx.stroke(); } },
            { id: 3, name: '气泡', targetX: 60, targetY: -60, width: 30, height: 30, draw: (ctx, x, y, s) => { ctx.strokeStyle='#60a5fa'; ctx.lineWidth=2*s; ctx.beginPath(); ctx.arc(x, y, 8*s, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(x-15*s, y+10*s, 5*s, 0, Math.PI*2); ctx.stroke(); } }
        ]
    },
    {
        name: '小狗',
        drawBase: (ctx, x, y, s) => {
            drawEllipse(ctx, x, y, 70*s, 65*s, '#d6d3d1'); // 头
            drawEllipse(ctx, x, y+20*s, 30*s, 25*s, '#fff'); // 嘴部
        },
        parts: [
            { id: 1, name: '左垂耳', targetX: -60, targetY: -20, width: 40, height: 80, draw: (ctx, x, y, s) => { ctx.fillStyle='#a8a29e'; ctx.beginPath(); ctx.ellipse(x, y, 20*s, 40*s, 0.2, 0, Math.PI*2); ctx.fill(); } },
            { id: 2, name: '右垂耳', targetX: 60, targetY: -20, width: 40, height: 80, draw: (ctx, x, y, s) => { ctx.fillStyle='#a8a29e'; ctx.beginPath(); ctx.ellipse(x, y, 20*s, 40*s, -0.2, 0, Math.PI*2); ctx.fill(); } },
            { id: 3, name: '鼻子', targetX: 0, targetY: 10, width: 30, height: 20, draw: (ctx, x, y, s) => drawEllipse(ctx, x, y, 12*s, 8*s, '#000') },
            { id: 4, name: '眼睛', targetX: 0, targetY: -20, width: 80, height: 20, draw: (ctx, x, y, s) => { drawEye(ctx, x-25*s, y, 7*s); drawEye(ctx, x+25*s, y, 7*s); } }
        ]
    }
];

export const AnimalPuzzleGame: React.FC<GameComponentProps> = ({ width, height, isPlaying, onScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameCountRef = useRef(0);
    const visualAcuity = localStorage.getItem('visualAcuity') || '0.2-0.4';

    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const partsRef = useRef<PuzzlePart[]>([]);
    const [completed, setCompleted] = useState(false);
    const initializedRef = useRef(false); // Track if game has been initialized

    // 布局参数
    const sidebarWidth = Math.max(200, width * 0.25);
    const mainWidth = width - sidebarWidth;
    const animalScale = Math.min(mainWidth, height) * 0.0025; // 根据屏幕缩放
    const animalX = mainWidth / 2;
    const animalY = height / 2;

    const initLevel = useCallback(() => {
        const level = LEVELS[currentLevelIdx];
        const newParts: PuzzlePart[] = level.parts.map(p => ({
            ...p,
            // 随机散落在侧边栏区域 (mainWidth 到 width)
            currentX: mainWidth + (sidebarWidth * 0.2) + Math.random() * (sidebarWidth * 0.6), 
            currentY: height * 0.3 + Math.random() * (height * 0.6),
            isLocked: false,
            isDragging: false
        }));
        partsRef.current = newParts;
        setCompleted(false);
    }, [currentLevelIdx, width, height, mainWidth, sidebarWidth]);

    // Init - 首次启动或关卡切换时初始化
    useEffect(() => {
        if (isPlaying) {
            if (!initializedRef.current) {
                initializedRef.current = true;
            }
            initLevel();
        }
    }, [isPlaying, currentLevelIdx, initLevel]);

    const handleLevelComplete = () => {
        setCompleted(true);
        playSound('correct');
        onScore(100);
        setTimeout(() => {
            setCompleted(false); // 重置 completed 状态，关闭遮罩
            setCurrentLevelIdx(prev => (prev + 1) % LEVELS.length);
            // initLevel 会在 useEffect 中自动调用（因为 currentLevelIdx 变化）
        }, 1500);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isPlaying || completed) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 检查点击了哪个部件 (反向遍历，优先点上面的)
        for (let i = partsRef.current.length - 1; i >= 0; i--) {
            const p = partsRef.current[i];
            if (p.isLocked) continue;

            // 简单碰撞检测
            if (Math.abs(x - p.currentX) < 40 && Math.abs(y - p.currentY) < 40) {
                p.isDragging = true;
                const part = partsRef.current.splice(i, 1)[0];
                partsRef.current.push(part);
                return;
            }
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        partsRef.current.forEach(p => {
            if (p.isDragging) {
                p.currentX = x;
                p.currentY = y;
            }
        });
    };

    const handlePointerUp = () => {
        let anyChange = false;
        let allLocked = true;

        partsRef.current.forEach(p => {
            if (p.isDragging) {
                p.isDragging = false;
                
                // 检查吸附
                const targetScreenX = animalX + p.targetX * animalScale;
                const targetScreenY = animalY + p.targetY * animalScale;
                const dist = Math.hypot(p.currentX - targetScreenX, p.currentY - targetScreenY);

                if (dist < 60) { // 吸附阈值
                    p.currentX = targetScreenX;
                    p.currentY = targetScreenY;
                    p.isLocked = true;
                    playSound('shoot'); 
                    anyChange = true;
                } else {
                    // 弹回侧边栏
                    p.currentX = mainWidth + sidebarWidth / 2;
                    p.currentY = height * 0.4 + Math.random() * (height * 0.4);
                    playSound('wrong');
                }
            }
            if (!p.isLocked) allLocked = false;
        });

        if (allLocked && !completed) {
            handleLevelComplete();
        }
    };

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        frameCountRef.current++;
        const level = LEVELS[currentLevelIdx];

        // 1. 全屏视觉刺激背景 (不再裁剪)
        renderCommonBackground(ctx, width, height, frameCountRef.current, visualAcuity);

        // 2. 侧边栏背景 (极通透的磨砂玻璃效果)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // 20% 透明度白色
        ctx.fillRect(mainWidth, 0, sidebarWidth, height);
        // 侧边栏分割线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(mainWidth, 0); ctx.lineTo(mainWidth, height); ctx.stroke();

        // 3. 绘制参考图 (右侧顶部)
        // 动态计算 Y 轴位置，确保不被顶部 Header (约 60-80px) 遮挡
        // 设置为屏幕高度的 15%，且最小不低于 120px
        const refSize = sidebarWidth * 0.35;
        const refX = mainWidth + sidebarWidth / 2;
        const refY = Math.max(140, height * 0.18); 
        const refScale = animalScale * 0.35;

        // 参考图底座 (半透明白底，防止背景干扰)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.roundRect(refX - refSize, refY - refSize, refSize * 2, refSize * 2, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.save();
        // 绘制完整参考图
        level.drawBase(ctx, refX, refY, refScale);
        level.parts.forEach(p => p.draw(ctx, refX + p.targetX * refScale, refY + p.targetY * refScale, refScale));
        ctx.restore();
        
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
        ctx.shadowColor='black'; ctx.shadowBlur=4;
        ctx.fillText('目标', refX, refY + refSize + 20);
        ctx.shadowBlur=0;

        // 4. 绘制左侧主操作区的动物 (缺损状态)
        // 为了让动物在复杂背景上更清晰，加一个淡淡的光晕
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'; ctx.shadowBlur = 40;
        level.drawBase(ctx, animalX, animalY, animalScale);
        ctx.restore();

        // 绘制缺损部位的虚线框提示
        partsRef.current.forEach(p => {
            if (!p.isLocked) {
                const tx = animalX + p.targetX * animalScale;
                const ty = animalY + p.targetY * animalScale;
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 8]);
                ctx.beginPath(); ctx.arc(tx, ty, 15 * animalScale, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        // 5. 绘制拼图部件
        partsRef.current.forEach(p => {
            ctx.save();
            // 阴影和高亮，增加立体感，防背景吞没
            if (p.isDragging) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 15;
                ctx.translate(0, -5); // 拿起效果
            } else {
                ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10;
            }
            
            // 给部件加一个白色描边，使其在任何背景下都清晰可见
            p.draw(ctx, p.currentX, p.currentY, animalScale);
            
            ctx.restore();
        });

        // 6. 成功动画
        if (completed) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 64px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🌟 太棒了! 🌟', width / 2, height / 2);
            
            ctx.font = '24px sans-serif';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText('准备迎接下一个动物朋友...', width / 2, height / 2 + 60);
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [width, height, visualAcuity, currentLevelIdx, completed, mainWidth, sidebarWidth, animalX, animalY, animalScale]);

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
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, animate]);

    return (
        <canvas 
            ref={canvasRef} 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="block touch-none cursor-move" 
        />
    );
};
