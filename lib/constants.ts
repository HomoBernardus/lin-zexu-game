import { GameStats } from '@/types/game';

// 游戏常量配置

export const GAME_CONFIG = {
  TOTAL_DAYS: 30,
  TOTAL_WEEKS: 4,
  START_DATE: '4月1日',
  MAX_STAT: 100,
  MIN_STAT: 0,

  // 初始数值
  INITIAL_STATS: {
    health: 100,
    popularity: 50,
    prestige: 30,
    favor: 35,
    risk: 0,
  },

  // NPC初始值
  INITIAL_NPCS: {
    wang: { affinity: 40, prestigePath: 0, popularityPath: 0 },
    chen: { affinity: 45, prestigePath: 0, popularityPath: 0 },
    li: { affinity: 35, prestigePath: 0, popularityPath: 0 },
  },

  // 攻略阈值（提高以降低完美通关率）
  CONQUEST_THRESHOLD: 65,
  DUAL_THRESHOLD: 110,

  // 周关键词持续时间
  MODIFIER_DURATION_DAYS: 7,

  // 健康衰减
  BASE_HEALTH_DRAIN: 2,
  RISK_DECAY_INTERVAL: 2,
};

export const STAT_LABELS: Record<keyof GameStats, { name: string; color: string; icon: string }> = {
  health: { name: '肺部健康', color: '#DCAE96', icon: '🫁' },
  popularity: { name: '职场人缘', color: '#FF8C69', icon: '👥' },
  prestige: { name: '名望影响力', color: '#6C91B2', icon: '⚡' },
  favor: { name: '上司满意', color: '#7CB518', icon: '👔' },
  risk: { name: 'HR风险', color: '#D9534F', icon: '⚠️' },
};