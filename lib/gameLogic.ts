import { GameState, GameStats, NPC, WeeklyModifier, EndingType, ChoiceDelta } from '@/types/game';
import { GAME_CONFIG, STAT_LABELS } from './constants';

// 边界限制
export function clamp(value: number): number {
  return Math.min(GAME_CONFIG.MAX_STAT, Math.max(GAME_CONFIG.MIN_STAT, value));
}

// 应用数值变化（带周关键词修正）
export function applyDelta(
  stats: GameStats,
  delta: ChoiceDelta,
  modifier: WeeklyModifier | null
): GameStats {
  const multipliers = modifier?.multipliers || {
    healthChange: 1, popularityChange: 1, prestigeChange: 1, favorChange: 1, riskChange: 1
  };

  const newStats = { ...stats };

  if (delta.health !== undefined) {
    newStats.health = clamp(stats.health + Math.round(delta.health * multipliers.healthChange));
  }
  if (delta.popularity !== undefined) {
    newStats.popularity = clamp(stats.popularity + Math.round(delta.popularity * multipliers.popularityChange));
  }
  if (delta.prestige !== undefined) {
    newStats.prestige = clamp(stats.prestige + Math.round(delta.prestige * multipliers.prestigeChange));
  }
  if (delta.favor !== undefined) {
    newStats.favor = clamp(stats.favor + Math.round(delta.favor * multipliers.favorChange));
  }
  if (delta.risk !== undefined) {
    newStats.risk = clamp(stats.risk + Math.round(delta.risk * multipliers.riskChange));
  }
  
  return newStats;
}

// 更新NPC好感度
export function updateNPCAffinity(
  npcs: GameState['npcs'],
  affects: { wang?: number; chen?: number; li?: number; zhou?: number }
): GameState['npcs'] {
  const newNpcs = { ...npcs };
  
  // 好感提升时同步累积双路径，权重按NPC角色定位分配
  // 小王：同龄人，先做朋友，专业能力也能建立威信 (7:3)
  if (affects.wang !== undefined) {
    newNpcs.wang.affinity = clamp(newNpcs.wang.affinity + affects.wang);
    if (affects.wang > 0) {
      newNpcs.wang.popularityPath = clamp(newNpcs.wang.popularityPath + Math.round(affects.wang * 0.7));
      newNpcs.wang.prestigePath = clamp(newNpcs.wang.prestigePath + Math.round(affects.wang * 0.3));
    }
  }
  // 陈哥：中立HR，人情与专业并重 (5:5)
  if (affects.chen !== undefined) {
    newNpcs.chen.affinity = clamp(newNpcs.chen.affinity + affects.chen);
    if (affects.chen > 0) {
      newNpcs.chen.popularityPath = clamp(newNpcs.chen.popularityPath + Math.round(affects.chen * 0.5));
      newNpcs.chen.prestigePath = clamp(newNpcs.chen.prestigePath + Math.round(affects.chen * 0.5));
    }
  }
  // 李总：上级，先看专业，关怀则是意外加分 (3:7)
  if (affects.li !== undefined) {
    newNpcs.li.affinity = clamp(newNpcs.li.affinity + affects.li);
    if (affects.li > 0) {
      newNpcs.li.popularityPath = clamp(newNpcs.li.popularityPath + Math.round(affects.li * 0.3));
      newNpcs.li.prestigePath = clamp(newNpcs.li.prestigePath + Math.round(affects.li * 0.7));
    }
  }
  // 小周：天然盟友，好感增减不累积攻略路线（非核心NPC）
  if (affects.zhou !== undefined) {
    newNpcs.zhou.affinity = clamp(newNpcs.zhou.affinity + affects.zhou);
  }

  return newNpcs;
}

// 检查NPC是否攻略成功
export function checkNPCConquest(npc: NPC): boolean {
  const isSinglePath = npc.prestigePath >= GAME_CONFIG.CONQUEST_THRESHOLD ||
                       npc.popularityPath >= GAME_CONFIG.CONQUEST_THRESHOLD;
  const isDualPath = npc.prestigePath + npc.popularityPath >= GAME_CONFIG.DUAL_THRESHOLD;
  return isSinglePath || isDualPath;
}

// 计算最终支持率
export function calculateSupport(state: GameState): number {
  let support = 20; // 基础值
  
  // 数值加成
  support += state.stats.prestige * 0.25;
  support += state.stats.popularity * 0.25;
  
  // NPC攻略加成（李总需要 li_data_meeting 才计入）
  const liEffectiveForSupport = state.npcs.li.isConquered && state.activeFlags.includes('li_data_meeting');
  const conqueredCount = [
    state.npcs.wang.isConquered,
    state.npcs.chen.isConquered,
    liEffectiveForSupport,
  ].filter(Boolean).length;
  support += conqueredCount * 12;
  
  // 蝴蝶效应加成
  if (state.activeFlags.includes('wang_app_created')) support += 10;
  if (state.activeFlags.includes('chen_law_aid')) support += 8;
  if (state.activeFlags.includes('chen_reconciled')) support += 6;
  if (state.activeFlags.includes('li_endorsement')) support += 15;
  
  // 人缘与影响力的平衡惩罚
  const diff = Math.abs(state.stats.prestige - state.stats.popularity);
  if (diff > 40) {
    support -= state.stats.prestige > state.stats.popularity ? 15 : 10;
  }
  
  return Math.round(support);
}

// 判定结局
export function determineEnding(state: GameState): EndingType {
  // 优先判定失败结局
  if (state.stats.health <= 0) return 'sickbed';
  if (state.stats.risk >= 100) return 'fired_rigid';
  if (state.stats.favor <= 0) return 'laid_off';
  
  const support = calculateSupport(state);
  const conqueredCount = [
    state.npcs.wang.isConquered,
    state.npcs.chen.isConquered,
    state.npcs.li.isConquered,
  ].filter(Boolean).length;

  // 隐藏结局：完美通关（3 NPC + 极高支持率，需 100 支持率兜底）
  if (conqueredCount === 3 && support >= 108) return 'perfect_triumph';

  // 隐藏结局：孤狼 — 不看support，只看是否纯靠影响力单走
  if (state.stats.prestige >= 65 && state.stats.popularity <= 35) return 'lone_wolf';

  // 主要结局
  if (support >= 85 && conqueredCount >= 2) return 'success_full';
  if (support >= 40 && conqueredCount >= 1) return 'success_partial';

  // 活着但没有盟友
  if (conqueredCount === 0) return 'failure_ignored';

  return 'failure_ignored';
}