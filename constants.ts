
import { TrainingModule } from './types';

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'stimulation',
    title: '视觉刺激',
    description: '通过高对比度光栅和红光闪烁，唤醒沉睡的视觉细胞。',
    colorFrom: 'from-red-400',
    colorTo: 'to-rose-600',
    iconName: 'Zap',
    games: [
      { id: 'g1-8', title: '火眼金睛', description: '找出那个不一样的图案！', difficulty: 'Easy' },
      { id: 'g1-5', title: '合成大西瓜', description: '在闪烁背景下合成更大的水果', difficulty: 'Hard' },
      { id: 'g1-6', title: '寻找水果', description: '在闪烁背景中找出底部指定的水果', difficulty: 'Hard' },
      { id: 'g1-7', title: '转转打靶乐', description: '瞄准旋转转盘上的物品进行射击', difficulty: 'Medium' },
      { id: 'g1-9', title: '雷霆战机', description: '驾驶战机在闪烁空间中击退敌人', difficulty: 'Hard' },
      { id: 'g1-10', title: '谁藏起来了', description: '记住两个动物，猜猜谁躲进了窗户后', difficulty: 'Medium' },
      { id: 'g1-11', title: '顽皮兔大作战', description: '敲击兔子得分，小心避开炸弹！', difficulty: 'Medium' },
      { id: 'g1-12', title: '动物拼图', description: '拖动碎片还原可爱的动物形象', difficulty: 'Easy' },
      { id: 'g1-13', title: '欢乐矿工', description: '看准时机，抓取星星和宝藏！', difficulty: 'Medium' },
      { id: 'g1-14', title: '快乐停车场', description: '移动车辆为红色小车让路，从右侧出口开出！', difficulty: 'Medium' },
      // 强闪永远放在视觉刺激模块的最后
      { id: 'g1-4', title: '强闪刺激', description: '整屏在红黄蓝黑白之间快速闪烁，可根据视力自动调频并手动微调速率', difficulty: 'Medium' },
    ]
  },
  {
    id: 'fine-motor',
    title: '视觉精细',
    description: '通过描图、穿孔等游戏，提升手眼协调和视力精细度。',
    colorFrom: 'from-blue-400',
    colorTo: 'to-cyan-600',
    iconName: 'MousePointer2',
    games: [
      { id: 'g2-1', title: '连点成画', description: '按顺序连接数字点，描绘出可爱动物', difficulty: 'Easy' },
      { id: 'g2-2', title: '精准点击', description: '点击屏幕上出现的微小目标', difficulty: 'Medium' },
      { id: 'g2-3', title: '迷宫探险', description: '走出随机生成的复杂迷宫', difficulty: 'Hard' },
      { id: 'g2-4', title: '六角消消乐', description: '拖动钻石填满六边形网格消除', difficulty: 'Medium' },
      { id: 'g2-5', title: '传统俄罗斯方块', description: '经典消除游戏，锻炼手眼协调', difficulty: 'Medium' },
      { id: 'g2-6', title: '俄罗斯方块新', description: '拖动和旋转带动物图案的方块，消除完整行', difficulty: 'Easy' },
      { id: 'g2-7', title: '动物消消乐', description: '点击相同动物消除，阻止方块堆满', difficulty: 'Medium' },
      { id: 'g2-8', title: '拆炸弹', description: '在倒计时结束前找出正确炸弹并点击', difficulty: 'Medium' },
      { id: 'g2-9', title: '保护小鸡', description: '快速找出老鹰，避免误点到小鸡', difficulty: 'Medium' },
      { id: 'g2-10', title: '找红豆', description: '在一堆相似小豆中精准找出红豆', difficulty: 'Medium' },
      { id: 'g2-11', title: '找朋友', description: '在一群小朋友中找到和上面完全一样的那一个！', difficulty: 'Medium' },
    ]
  },
  {
    id: 'simultaneous',
    title: '同时视',
    description: '利用红蓝眼镜分视原理，训练双眼同时感知物像。',
    colorFrom: 'from-green-400',
    colorTo: 'to-emerald-600',
    iconName: 'Eye',
    games: [
      { id: 'g3-1', title: '红蓝俄罗斯方块', description: '红蓝交替方块，训练双眼同视协调', difficulty: 'Medium' },
      { id: 'g3-2', title: '红蓝贪吃蛇', description: '红色小蛇吃蓝色小点，紫色背景同时视训练', difficulty: 'Medium' },
      { id: 'g3-3', title: '红蓝配对消除', description: '同时看到红蓝图案进行配对消除，强化双眼同时感知', difficulty: 'Medium' },
      { id: 'g3-4', title: '接苹果', description: '移动红篮子接住掉落的蓝苹果，锻炼双眼同时视', difficulty: 'Medium' },
    ]
  },
  {
    id: 'fusion',
    title: '融合视',
    description: '扩大融合范围，建立双眼单视功能，消除复视。',
    colorFrom: 'from-purple-400',
    colorTo: 'to-violet-600',
    iconName: 'Layers',
    games: [
      { id: 'g4-1', title: '圆环融合', description: '通过调节眼肌融合两个圆环', difficulty: 'Medium' },
      { id: 'g4-2', title: '融合点点击', description: '点击红蓝点之间的中点进行融合，训练双眼融合能力', difficulty: 'Easy' },
    ]
  },
  {
    id: 'stereoscopic',
    title: '立体视',
    description: '最高级的视觉功能训练，建立三维空间深度感。',
    colorFrom: 'from-orange-400',
    colorTo: 'to-amber-600',
    iconName: 'Box',
    games: [
      { id: 'g5-1', title: '随机点立体图', description: '在噪点中寻找隐藏的3D图形', difficulty: 'Hard' },
      { id: 'g5-2', title: '深度接球', description: '判断球的深度并移动到正确位置接球，训练立体视觉', difficulty: 'Hard' },
    ]
  },
  {
    id: 'grating-player',
    title: '光栅播放器',
    description: '在背景光栅闪烁刺激下观看视频，兼顾娱乐与被动训练。',
    colorFrom: 'from-indigo-400',
    colorTo: 'to-violet-600',
    iconName: 'Tv',
    games: [
      { id: 'g6-1', title: '在线视频', description: '观看精选儿歌与动画（如小毛驴）', difficulty: 'Easy' },
      { id: 'g6-2', title: '本地视频', description: '播放手机或电脑中的本地视频文件', difficulty: 'Easy' },
    ]
  }
];
