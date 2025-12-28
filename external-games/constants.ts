
import { GameType } from './types';

export const GAMES = [
  {
    id: GameType.BOMB,
    title: '拆炸弹',
    description: '在数字炸弹爆炸前找到不同的那一个！',
    color: 'bg-purple-500',
    icon: '💣',
  },
  {
    id: GameType.CHICKS,
    title: '保护小鸡',
    description: '老鹰混进了小鸡群，快用弓箭赶走它们！',
    color: 'bg-green-500',
    icon: '🐤',
  },
  {
    id: GameType.DRINK_SHOP,
    title: '色彩饮品店',
    description: '整理相同颜色的饮料，满足顾客的点单需求！',
    color: 'bg-orange-400',
    icon: '🥤',
  },
  {
    id: GameType.BEANS,
    title: '找红豆',
    description: '在一堆红枣中找到藏起来的红豆。',
    color: 'bg-red-400',
    icon: '🫘',
  },
  {
    id: GameType.CATCH,
    title: '接苹果',
    description: '移动红篮子接住掉落的蓝苹果，锻炼双眼同时视。',
    color: 'bg-indigo-500',
    icon: '🧺',
  },
  {
    id: GameType.PARKING,
    title: '快乐停车场',
    description: '挪动车辆开辟道路，送红色小车回家！',
    color: 'bg-blue-600',
    icon: '🚗',
  },
  {
    id: GameType.FIND_AVATAR,
    title: '找朋友',
    description: '在一群小朋友中找到和上面完全一样的那一个！',
    color: 'bg-pink-500',
    icon: '👦',
  },
  {
    id: GameType.MAP_PUZZLE,
    title: '拼地图',
    description: '将打乱的中国地图碎片重新拼完整，认识祖国版图。',
    color: 'bg-amber-500',
    icon: '🧩',
  },
];
