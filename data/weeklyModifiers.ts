import { WeeklyModifier } from '@/types/game';

export const weeklyModifiers: WeeklyModifier[] = [
  {
    name: '梅雨',
    description: '潮湿的天气让人胸闷气短。冲突减少了，但影响力也更难建立了。',
    icon: '🌧️',
    multipliers: {
      healthChange: 0.8,
      popularityChange: 1.0,
      prestigeChange: 0.6,
      favorChange: 0.9,
      riskChange: 0.5,
    },
  },
  {
    name: '大检',
    description: '人事大检查期间，任何冲突都会被放大。烟雾少了，但风险高了。',
    icon: '📋',
    multipliers: {
      healthChange: 0.9,
      popularityChange: 0.8,
      prestigeChange: 0.7,
      favorChange: 0.7,
      riskChange: 2.0,
    },
  },
  {
    name: '裁员',
    description: '公司人心惶惶，所有人都小心翼翼。人际往来变得异常困难。',
    icon: '📉',
    multipliers: {
      healthChange: 1.0,
      popularityChange: 0.5,
      prestigeChange: 0.5,
      favorChange: 0.4,
      riskChange: 1.3,
    },
  },
  {
    name: '酷暑',
    description: '炎热的天气让人烦躁，但敢于发声的人也更容易被记住。',
    icon: '☀️',
    multipliers: {
      healthChange: 1.3,
      popularityChange: 0.7,
      prestigeChange: 1.5,
      favorChange: 0.8,
      riskChange: 1.2,
    },
  },
  {
    name: '项目冲刺',
    description: '全公司都在赶项目，业绩压力大，但也更容易获得领导认可。',
    icon: '🚀',
    multipliers: {
      healthChange: 1.2,
      popularityChange: 0.6,
      prestigeChange: 1.3,
      favorChange: 1.4,
      riskChange: 0.8,
    },
  },
];

export function getRandomModifier(): WeeklyModifier {
  return weeklyModifiers[Math.floor(Math.random() * weeklyModifiers.length)];
}