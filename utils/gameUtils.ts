



// 游戏通用工具函数

// --- 音效辅助函数 ---
export const playSound = (type: 'correct' | 'wrong' | 'shoot') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;

        if (type === 'correct') {
            // 正确提示音 (正弦波，清脆)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'wrong') {
            // 错误提示音 (三角波，低沉，柔和)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'shoot') {
            // 发射/下落音效
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    } catch (e) {
        // 忽略音频上下文错误
    }
};

// --- 简单旋律播放器 ---
export const playNote = (frequency: number, duration: number, startTime: number = 0, type: 'sine' | 'square' | 'triangle' = 'sine') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        // 注意：实际应用中应该重用 AudioContext，这里简化处理
        // 为了避免频繁创建 Context 导致警告，在游戏中应由外部传入 Context，或者使用单例
        // 这里仅作兼容，建议组件内部创建 Context
        const ctx = new AudioContext(); 
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime + startTime;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
        
        return ctx; // 返回 ctx 以便外部关闭
    } catch(e) { console.log(e) }
};

// --- 找不同游戏数据 ---
// 分为三个难度等级
export const ODD_ONE_PAIRS = {
    // 等级 1: 细微差别 (简单模式)
    level1: [
        ['😀', '😃'], ['🔒', '🔓'], ['👀', '👁️'], ['🍕', '🧀'],
        ['🚌', '🚐'], ['🧡', '💛'], ['🥛', '🧃'], ['🌹', '🌷'], 
        ['🍎', '🍏'], ['🚲', '🛴'], ['🏠', '🏡'], ['🌛', '🌜'],
        ['👨', '👱'], ['🐱', '🐈'], ['🐶', '🐕'], ['🚗', '🚕'],
        ['⚽', '🏀'], ['🍺', '🍻'], ['🌧️', '🌦️'], ['❄️', '☃️'],
        ['🍓', '🍒'], ['🎮', '🕹️'], ['📷', '📹'], ['📕', '📖']
    ],
    // 等级 2: 非常细微的差别 (中等模式)
    level2: [
        ['🧐', '🤓'], ['😯', '😦'], ['🌕', '🌖'], ['📥', '📤'],
        ['🖊️', '🖋️'], ['🔈', '🔉'], ['☁️', '🌧️'], ['🐱', '🐯'],
        ['➡️', '💲'], ['⚔️', '⚒️'], ['🎩', '🎓'], ['⌚', '⏰'],
        ['📝', '📋'], ['📅', '🗓️'], ['📎', '🖇️'], ['📏', '📐'],
        ['🔑', '🗝️'], ['🔏', '🔐'], ['🔔', '🔕'], ['🔋', '🔌'],
        ['🔨', '🔧'], ['💊', '💉'], ['📧', '📨'], ['📦', '🗳️']
    ],
    // 等级 3: 专家级/像素级找茬 (困难模式)
    level3: [
        ['🕐', '🕑'], ['🕓', '🕒'], ['📅', '📆'], ['📎', '🖇️'], 
        ['✅', '❎'], ['☮️', '☯️'], ['⭕', '⭕️'], ['⬛', '◼️'],
        ['➖', '➗'], ['❔', '❓'], ['🇨🇳', '🇨🇭'], ['🔙', '🔚'],
        ['⬆️', '↗️'], ['♎', '♍'], ['♈', '♉'], ['♋', '♌'],
        ['⏸️', '⏯️'], ['🔈', '🔇'], ['🔅', '🔆'], ['📶', '📳'],
        ['🈶', '🈚'], ['🈸', '🈺'], ['🟢', '🔵'], ['🟧', '🟨']
    ]
};

// --- 水果类型定义 (用于寻找水果游戏) ---
export interface FruitTypeDef {
    name: string;
    label: string;
    color: string;
    fleshColor?: string;
    viewType: 'whole' | 'cut';
    radiusRatio: number;
    pairId?: number;
}

// 用于"寻找水果"游戏 (配对逻辑)
export const FRUIT_TYPES: FruitTypeDef[] = [
    // 1. 苹果组
    { name: '红苹果', label: '🍎', color: '#EF4444', viewType: 'whole', radiusRatio: 0.12, pairId: 1 },
    { name: '切开苹果', label: '🍎', color: '#EF4444', fleshColor: '#FEF3C7', viewType: 'cut', radiusRatio: 0.12, pairId: 0 },

    // 2. 西瓜组
    { name: '西瓜', label: '🍉', color: '#166534', viewType: 'whole', radiusRatio: 0.20, pairId: 3 },
    { name: '西瓜瓤', label: '🍉', color: '#166534', fleshColor: '#EF4444', viewType: 'cut', radiusRatio: 0.20, pairId: 2 },

    // 3. 橙子组
    { name: '橙子', label: '🍊', color: '#F97316', viewType: 'whole', radiusRatio: 0.10, pairId: 5 },
    { name: '切开橙子', label: '🍊', color: '#F97316', fleshColor: '#FED7AA', viewType: 'cut', radiusRatio: 0.10, pairId: 4 },

    // 4. 椰子组
    { name: '椰子', label: '🥥', color: '#5D4037', viewType: 'whole', radiusRatio: 0.18, pairId: 7 },
    { name: '椰肉', label: '🥥', color: '#5D4037', fleshColor: '#F5F5F4', viewType: 'cut', radiusRatio: 0.18, pairId: 6 },

    // 5. 牛油果组
    { name: '牛油果', label: '🥑', color: '#3f6212', viewType: 'whole', radiusRatio: 0.11, pairId: 9 },
    { name: '切开牛油果', label: '🥑', color: '#3f6212', fleshColor: '#bef264', viewType: 'cut', radiusRatio: 0.11, pairId: 8 },

    // 6. 猕猴桃组
    { name: '猕猴桃', label: '🥝', color: '#854d0e', viewType: 'whole', radiusRatio: 0.09, pairId: 11 },
    { name: '切开猕猴桃', label: '🥝', color: '#854d0e', fleshColor: '#a3e635', viewType: 'cut', radiusRatio: 0.09, pairId: 10 },

    // 7. 柠檬组
    { name: '柠檬', label: '🍋', color: '#eab308', viewType: 'whole', radiusRatio: 0.09, pairId: 13 },
    { name: '柠檬片', label: '🍋', color: '#eab308', fleshColor: '#fef08a', viewType: 'cut', radiusRatio: 0.09, pairId: 12 },

    // 单个水果
    { name: '菠萝', label: '🍍', color: '#d97706', viewType: 'whole', radiusRatio: 0.16 },
    { name: '草莓', label: '🍓', color: '#dc2626', viewType: 'whole', radiusRatio: 0.07 },
    { name: '葡萄', label: '🍇', color: '#7e22ce', viewType: 'whole', radiusRatio: 0.10 },
    { name: '香蕉', label: '🍌', color: '#facc15', viewType: 'whole', radiusRatio: 0.12 },
    { name: '桃子', label: '🍑', color: '#fca5a5', viewType: 'whole', radiusRatio: 0.11 },
];


// --- 合成大西瓜数据 ---
// 按大小严格排序，减小了整体比例以适应屏幕
export const MERGE_FRUITS = [
    { name: '葡萄', label: '🍇', color: '#7e22ce', radiusRatio: 0.03 },  // Level 0 (最小)
    { name: '草莓', label: '🍓', color: '#dc2626', radiusRatio: 0.045 }, // Level 1
    { name: '柠檬', label: '🍋', color: '#eab308', radiusRatio: 0.06 },  // Level 2
    { name: '橙子', label: '🍊', color: '#F97316', radiusRatio: 0.075 }, // Level 3
    { name: '苹果', label: '🍎', color: '#EF4444', radiusRatio: 0.095 }, // Level 4
    { name: '菠萝', label: '🍍', color: '#d97706', radiusRatio: 0.12 },  // Level 5
    { name: '椰子', label: '🥥', color: '#5D4037', radiusRatio: 0.145 }, // Level 6
    { name: '西瓜', label: '🍉', color: '#166534', radiusRatio: 0.175 }, // Level 7 (最大目标)
];