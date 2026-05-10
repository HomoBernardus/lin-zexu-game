import { PropConfig } from '@/types/game';

export const props: PropConfig[] = [
  {
    id: 'mask',
    name: '口罩',
    icon: '😷',
    description: '戴上N95口罩过滤二手烟，略显突兀但有效',
    protection: 3,
    equipCost: { popularity: -3, risk: 2 },
    flavor: '你默默戴上口罩。同事们投来异样的目光，但你不在乎。',
  },
  {
    id: 'fan',
    name: '小风扇',
    icon: '🌬️',
    description: '桌面小风扇吹走烟雾，低调不惹人注意',
    protection: 3,
    equipCost: { popularity: -1, favor: -3, risk: 3 },
    flavor: '小风扇呼呼转动，烟雾被吹散。没人觉得有什么不对。',
  },
  {
    id: 'watergun',
    name: '水枪',
    icon: '🔫',
    description: '用水枪浇灭烟头，效果显著但会得罪人',
    protection: 7,
    equipCost: { popularity: -8, favor: -5, risk: 10 },
    dailyCost: { popularity: -1 },
    flavor: '噗——水枪精准命中烟头。办公室里鸦雀无声，然后炸开了锅。',
  },
  {
    id: 'gasmask',
    name: '防毒面具',
    icon: '☠️',
    description: '军用级防毒面具，极致防护但像疯了一样',
    protection: 10,
    equipCost: { popularity: -12, favor: -8, risk: 12 },
    dailyCost: { popularity: -2, favor: -1 },
    flavor: '你戴上防毒面具走进办公室。李总手里的茶杯掉在地上。全场寂静。',
  },
];
