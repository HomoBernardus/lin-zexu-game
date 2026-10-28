/**
 * 道具系统平衡测试脚本 — 基于真实事件数据
 * 模拟 1000 组不同策略的完整游戏流程，验证健康衰减 + 道具防护 + 事件风险的数值平衡
 *
 * 运行: npx tsx scripts/simulate.ts
 */

import { GameStats, GameEvent, Choice, WeeklyModifier, PropType, NPC } from '../types/game';
import { GAME_CONFIG } from '../lib/constants';
import { applyDelta, updateNPCAffinity, checkNPCConquest, determineEnding, clamp } from '../lib/gameLogic';
import { getRandomModifier } from '../data/weeklyModifiers';
import { props as propDefs } from '../data/props';
import week1Data from '../data/events/week1.json';
import week2Data from '../data/events/week2.json';
import week3Data from '../data/events/week3.json';
import week4Data from '../data/events/week4.json';

// ====== 配置 ======
const TOTAL_DAYS = 28;
const TOTAL_RUNS = 2000;

// ====== 加载事件 ======
function loadEvents(): GameEvent[] {
  const addWeek = (events: Record<string, unknown>[], week: number): GameEvent[] =>
    events.map(e => ({ ...e, week } as unknown as GameEvent));
  return [
    ...addWeek(week1Data.events, 1),
    ...addWeek(week2Data.events, 2),
    ...addWeek(week3Data.events, 3),
    ...addWeek(week4Data.events, 4),
  ];
}

const ALL_EVENTS = loadEvents();

// ====== 健康衰减加成 ======
function getHealthDrainBonus(modifier: WeeklyModifier | null): number {
  if (!modifier) return 0;
  switch (modifier.name) {
    case '梅雨': return 1;
    case '大检': return 1;
    case '裁员': return 2;
    case '酷暑': return 1;
    case '项目冲刺': return 0;
    default: return 0;
  }
}

// ====== 策略类型 ======
type ChoiceStrategy = 'safe' | 'risky' | 'balanced' | 'random';
type PropStrategy = 'none' | 'mask_only' | 'fan_prefer' | 'watergun_aggressive' | 'gasmask_extreme' | 'optimal';
type GardenLevel = 'low' | 'mid' | 'high';

interface TestCase {
  id: number;
  choiceStrategy: ChoiceStrategy;
  propStrategy: PropStrategy;
  gardenLevel: GardenLevel;
  seed: number; // 随机种子偏移
}

// ====== 选择策略 ======
function pickChoice(choices: Choice[], strategy: ChoiceStrategy, seed: number): Choice {
  if (choices.length === 1) return choices[0];

  switch (strategy) {
    case 'safe':
      // 选 risk 最低，平局选 health 最高
      return choices.reduce((best, c) => {
        const bRisk = best.delta.risk ?? 0;
        const cRisk = c.delta.risk ?? 0;
        if (cRisk < bRisk) return c;
        if (cRisk === bRisk && (c.delta.health ?? 0) > (best.delta.health ?? 0)) return c;
        return best;
      });

    case 'risky':
      // 主攻 prestige，但规避极端风险（risk -0.2）+ 略重视 favor（+0.3）
      return choices.reduce((best, c) => {
        const cScore = (c.delta.prestige ?? 0) * 1.0 - (c.delta.risk ?? 0) * 0.2 + (c.delta.favor ?? 0) * 0.3;
        const bScore = (best.delta.prestige ?? 0) * 1.0 - (best.delta.risk ?? 0) * 0.2 + (best.delta.favor ?? 0) * 0.3;
        return cScore > bScore ? c : best;
      });

    case 'balanced': {
      // 五项 delta 加权总和（risk 权重为负）
      const score = (c: Choice) =>
        (c.delta.health ?? 0) * 1.0 +
        (c.delta.popularity ?? 0) * 0.8 +
        (c.delta.prestige ?? 0) * 0.8 +
        (c.delta.favor ?? 0) * 0.8 -
        (c.delta.risk ?? 0) * 1.2;
      return choices.reduce((best, c) => score(c) > score(best) ? c : best);
    }

    case 'random': {
      // 确定性伪随机（基于 seed + 选项数）
      const idx = (seed * 7919 + choices.length * 6271) % choices.length;
      return choices[Math.abs(idx)];
    }
  }
}

// ====== 道具策略 ======
function getTargetProp(strategy: PropStrategy, inventory: Record<PropType, boolean>): PropType | null {
  const owned = (Object.keys(inventory) as PropType[]).filter(k => inventory[k]);
  if (owned.length === 0) return null;

  switch (strategy) {
    case 'none': return null;
    case 'mask_only': return inventory.mask ? 'mask' : null;
    case 'fan_prefer': return inventory.fan ? 'fan' : null;
    case 'watergun_aggressive': return inventory.watergun ? 'watergun' : null;
    case 'gasmask_extreme': return inventory.gasmask ? 'gasmask' : null;
    case 'optimal':
      return owned.reduce((best, next) => {
        const bestDef = propDefs.find(p => p.id === best)!;
        const nextDef = propDefs.find(p => p.id === next)!;
        return nextDef.protection > bestDef.protection ? next : best;
      });
    default: return null;
  }
}

function getGardenChance(level: GardenLevel): number {
  switch (level) {
    case 'low': return 0.2;
    case 'mid': return 0.5;
    case 'high': return 0.8;
  }
}

// ====== 测试用例生成 ======
function generateTestCases(): TestCase[] {
  const choiceStrategies: ChoiceStrategy[] = ['safe', 'risky', 'balanced', 'random'];
  const propStrategies: PropStrategy[] = ['none', 'mask_only', 'fan_prefer', 'watergun_aggressive', 'gasmask_extreme', 'optimal'];
  const gardenLevels: GardenLevel[] = ['low', 'mid', 'high'];

  const combos: { cs: ChoiceStrategy; ps: PropStrategy; gl: GardenLevel }[] = [];
  for (const cs of choiceStrategies) {
    for (const ps of propStrategies) {
      for (const gl of gardenLevels) {
        combos.push({ cs, ps, gl });
      }
    }
  }
  // 72 combos, ~14 each = 1008, take first 1000
  const perCombo = Math.ceil(TOTAL_RUNS / combos.length);
  const cases: TestCase[] = [];
  let id = 0;

  for (const { cs, ps, gl } of combos) {
    for (let i = 0; i < perCombo && cases.length < TOTAL_RUNS; i++) {
      cases.push({ id: ++id, choiceStrategy: cs, propStrategy: ps, gardenLevel: gl, seed: id * 7 + i * 13 });
    }
  }

  return cases;
}

// ====== 初始 NPC ======
const initialNPCs = {
  wang: { id: 'wang' as const, name: '苏辰', nickname: '小苏', title: '技术部', affinity: 40, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#7CB518' },
  chen: { id: 'chen' as const, name: '陈文彬', nickname: '陈哥', title: 'HR', affinity: 45, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#FF8C69' },
  li: { id: 'li' as const, name: '李婉宁', nickname: '李总', title: '副总经理', affinity: 35, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#6C91B2' },
  zhou: { id: 'zhou' as const, name: '周雨桐', nickname: '小周', title: '技术部', affinity: 60, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#E07B39' },
  zhao: { id: 'zhao' as const, name: '赵德柱', nickname: '老赵', title: '市场部', affinity: 15, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#8B6F5E' },
};

// ====== 结果类型 ======
interface SimulationResult {
  id: number;
  choiceStrategy: ChoiceStrategy;
  propStrategy: PropStrategy;
  gardenLevel: GardenLevel;
  survived: boolean;
  deathDay: number | null;
  deathCause: string | null;
  finalHealth: number;
  finalPopularity: number;
  finalPrestige: number;
  finalFavor: number;
  finalRisk: number;
  ending: string;
  totalHealthDrain: number;
  totalHealthRecovered: number;
  gardenUses: number;
  equippedDays: number;
  eventsProcessed: number;
}

// ====== 简陋伪随机 ======
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ====== 主模拟 ======
function simulateOne(test: TestCase): SimulationResult {
  let rngSeed = test.seed;
  const rng = () => {
    const val = pseudoRandom(rngSeed);
    rngSeed++;
    return val;
  };

  // 初始状态
  const stats: GameStats = {
    health: GAME_CONFIG.INITIAL_STATS.health,
    popularity: GAME_CONFIG.INITIAL_STATS.popularity,
    prestige: GAME_CONFIG.INITIAL_STATS.prestige,
    favor: GAME_CONFIG.INITIAL_STATS.favor,
    risk: GAME_CONFIG.INITIAL_STATS.risk,
  };

  const npcs = JSON.parse(JSON.stringify(initialNPCs)) as typeof initialNPCs;

  // 道具库存
  const inventory: Record<PropType, boolean> = { mask: true, fan: false, watergun: false, gasmask: false };
  let equippedProp: PropType | null = null;

  // 追踪
  let totalHealthDrain = 0;
  let totalHealthRecovered = 0;
  let gardenUses = 0;
  let equippedDays = 0;
  let eventsProcessed = 0;
  let deathDay: number | null = null;
  let deathCause: string | null = null;

  // 蝴蝶效应标记
  const activeFlags: string[] = [];

  // 周关键词
  const initialModifier = getRandomModifier();
  let modifier = initialModifier;
  let modifierRemainingDays = 7;

  // 花园使用概率
  const gardenChance = getGardenChance(test.gardenLevel);

  // 养成式花园：2 个花盆
  const gardenPlots: { plant: 'mint' | 'gardenia' | 'orchid' | null; plantedDay: number }[] = [
    { plant: null, plantedDay: 0 },
    { plant: null, plantedDay: 0 },
  ];
  const gardenPlantDefs = [
    { id: 'mint' as const, daysToGrow: 2, harvest: { health: 12, risk: -6 } },
    { id: 'gardenia' as const, daysToGrow: 4, harvest: { popularity: 10, favor: 4 } },
    { id: 'orchid' as const, daysToGrow: 5, harvest: { prestige: 10, favor: 4 } },
  ];

  // 主循环
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    if (deathDay !== null) break;

    // 周一换关键词
    if (day === 8 || day === 15 || day === 22) {
      modifier = getRandomModifier();
      modifierRemainingDays = 7;
    }
    modifierRemainingDays--;

    // 处理当天所有事件（按 phase 顺序）
    const dayEvents = ALL_EVENTS.filter(e => e.day === day).sort((a, b) => {
      const order = ['morning', 'noon', 'afternoon', 'evening'];
      return order.indexOf(a.phase) - order.indexOf(b.phase);
    });

    for (const event of dayEvents) {
      // 检查条件
      const raw = event as unknown as Record<string, unknown>;
      const conditions = raw.conditions as { requiresFlag?: string[] } | undefined;
      if (conditions?.requiresFlag) {
        const allFlagsMet = conditions.requiresFlag.every(f => activeFlags.includes(f));
        if (!allFlagsMet) continue;
      }

      if (event.choices.length === 0) continue;
      eventsProcessed++;

      // 按策略选选项
      const choice = pickChoice(event.choices, test.choiceStrategy, rngSeed + event.choices.length);

      // 应用 delta（含周词倍率）
      const newStats = applyDelta(stats, choice.delta, modifier);
      Object.assign(stats, newStats);

      // 更新 NPC 好感
      if (choice.npcAffect) {
        const newNpcs = updateNPCAffinity(npcs, choice.npcAffect);
        Object.assign(npcs, newNpcs);
      }

      // 蝴蝶效应标记
      if (choice.butterflyFlag) {
        activeFlags.push(choice.butterflyFlag);
      }

      // 道具奖励
      if (choice.propReward) {
        inventory[choice.propReward] = true;
      }

      // 检查 NPC 攻略
      Object.values(npcs).forEach(npc => {
        if (!npc.isConquered && checkNPCConquest(npc as NPC)) {
          (npc as NPC).isConquered = true;
        }
      });
    }

    // === 道具装备管理（每天事件处理后） ===
    const targetProp = getTargetProp(test.propStrategy, inventory);
    if (targetProp && equippedProp !== targetProp) {
      // 卸下当前装备
      if (equippedProp) {
        const prev = propDefs.find(p => p.id === equippedProp);
        if (prev) {
          stats.popularity = clamp(stats.popularity - (prev.equipCost.popularity ?? 0));
          stats.favor = clamp(stats.favor - (prev.equipCost.favor ?? 0));
          stats.risk = clamp(stats.risk - (prev.equipCost.risk ?? 0));
        }
      }
      // 装备新道具
      const prop = propDefs.find(p => p.id === targetProp);
      if (prop) {
        stats.popularity = clamp(stats.popularity + (prop.equipCost.popularity ?? 0));
        stats.favor = clamp(stats.favor + (prop.equipCost.favor ?? 0));
        stats.risk = clamp(stats.risk + (prop.equipCost.risk ?? 0));
      }
      equippedProp = targetProp;
    }

    // === 每日健康衰减 ===
    const equipped = equippedProp ? propDefs.find(p => p.id === equippedProp) : null;
    const protection = equipped?.protection ?? 0;
    const bonus = getHealthDrainBonus(modifier);
    const drain = Math.max(0, GAME_CONFIG.BASE_HEALTH_DRAIN + bonus - protection);
    stats.health = Math.max(0, stats.health - drain);
    totalHealthDrain += drain;

    if (equipped) {
      equippedDays++;
      if (equipped.dailyCost) {
        if (equipped.dailyCost.popularity) stats.popularity = Math.max(0, stats.popularity + equipped.dailyCost.popularity);
        if (equipped.dailyCost.favor) stats.favor = Math.max(0, stats.favor + equipped.dailyCost.favor);
        if (equipped.dailyCost.risk) stats.risk = Math.min(100, stats.risk + equipped.dailyCost.risk);
      }
    }

    // === 风险自然衰减（每N天降1点） ===
    if (day % GAME_CONFIG.RISK_DECAY_INTERVAL === 0) {
      stats.risk = Math.max(0, stats.risk - 1);
    }

    // === 花园（养成式：种下→生长→收成） ===
    for (let pi = 0; pi < gardenPlots.length; pi++) {
      const plot = gardenPlots[pi];
      if (plot.plant) {
        const def = gardenPlantDefs.find(p => p.id === plot.plant)!;
        if (day - plot.plantedDay >= def.daysToGrow) {
          // 收成（不受周关键词影响）
          gardenUses++;
          if (def.harvest.health) { stats.health = clamp(stats.health + def.harvest.health); totalHealthRecovered += def.harvest.health; }
          if (def.harvest.popularity) stats.popularity = clamp(stats.popularity + def.harvest.popularity);
          if (def.harvest.prestige) stats.prestige = clamp(stats.prestige + def.harvest.prestige);
          if (def.harvest.favor) stats.favor = clamp(stats.favor + def.harvest.favor);
          if (def.harvest.risk) stats.risk = clamp(stats.risk + def.harvest.risk);
          plot.plant = null;
          plot.plantedDay = 0;
        }
      } else if (rng() < gardenChance) {
        // 种下：健康低/风险高优先薄荷，否则按人缘/名望差距选择
        let type: 'mint' | 'gardenia' | 'orchid' = 'mint';
        if (stats.health >= 55 && stats.risk <= 55) {
          type = stats.popularity <= stats.prestige ? 'gardenia' : 'orchid';
        }
        plot.plant = type;
        plot.plantedDay = day;
      }
    }

    // === 死亡判定 ===
    if (stats.health <= 0) {
      deathDay = day;
      deathCause = '肺部健康归零 (病退)';
    } else if (stats.risk >= 100) {
      deathDay = day;
      deathCause = 'HR风险满值 (被开除)';
    } else if (stats.favor <= 0) {
      deathDay = day;
      deathCause = '上司满意归零 (裁员)';
    }
  }

  // 结局判定
  const gameState = {
    day: deathDay ?? TOTAL_DAYS,
    week: Math.ceil((deathDay ?? TOTAL_DAYS) / 7),
    stats,
    npcs,
    weeklyModifier: modifier,
    modifierRemainingDays: 0,
    butterflyLog: [],
    activeFlags,
    completedEvents: [],
    inventory,
    equippedProp,
    garden: { plots: gardenPlots, harvested: gardenUses },
    gameOver: deathDay !== null,
    ending: null as string | null,
  };
  const ending = determineEnding(gameState);

  return {
    id: test.id,
    choiceStrategy: test.choiceStrategy,
    propStrategy: test.propStrategy,
    gardenLevel: test.gardenLevel,
    survived: deathDay === null,
    deathDay,
    deathCause,
    finalHealth: stats.health,
    finalPopularity: stats.popularity,
    finalPrestige: stats.prestige,
    finalFavor: stats.favor,
    finalRisk: stats.risk,
    ending,
    totalHealthDrain,
    totalHealthRecovered,
    gardenUses,
    equippedDays,
    eventsProcessed,
  };
}

// ====== 输出 ======
function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function pct(n: number, total: number): string {
  return ((n / total) * 100).toFixed(1) + '%';
}

function run() {
  const testCases = generateTestCases();
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║     道具系统平衡测试 — ${TOTAL_RUNS} 组模拟（真实事件数据）        ║`);
  console.log(`║     健康扣减: ${GAME_CONFIG.BASE_HEALTH_DRAIN}/天 | 初始: 健康${GAME_CONFIG.INITIAL_STATS.health} 人缘${GAME_CONFIG.INITIAL_STATS.popularity} 影响${GAME_CONFIG.INITIAL_STATS.prestige} 上司${GAME_CONFIG.INITIAL_STATS.favor} 风险${GAME_CONFIG.INITIAL_STATS.risk}  ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

  console.log(`运行 ${TOTAL_RUNS} 组模拟中...`);
  const results = testCases.map(simulateOne);

  // ====== 1. 按选择策略 × 道具策略交叉汇总 ======
  console.log(`\n────── 策略交叉汇总（选择策略 × 道具策略）──────\n`);
  console.log(`选择策略          道具策略           组数  存活率   均健康 均人缘 均影响 均上司 均风险  均衰减 均恢复 花园次 装备天 事件数`);
  console.log(`────────────────  ────────────────  ──   ─────  ─────  ─────  ─────  ─────  ─────  ─────  ─────  ─────  ─────  ─────`);

  const comboKey = (r: SimulationResult) => `${r.choiceStrategy}|${r.propStrategy}`;
  const comboGroups: Record<string, SimulationResult[]> = {};
  results.forEach(r => {
    if (!comboGroups[comboKey(r)]) comboGroups[comboKey(r)] = [];
    comboGroups[comboKey(r)].push(r);
  });

  Object.entries(comboGroups).sort().forEach(([key, rs]) => {
    const [cs, ps] = key.split('|');
    const surviveRate = ((rs.filter(r => r.survived).length / rs.length) * 100).toFixed(0);
    console.log(
      `${cs.padEnd(16)}  ${ps.padEnd(16)}  ${String(rs.length).padStart(2)}  ${(surviveRate + '%').padStart(5)}  ${String(avg(rs.map(r => r.finalHealth))).padStart(5)}  ${String(avg(rs.map(r => r.finalPopularity))).padStart(5)}  ${String(avg(rs.map(r => r.finalPrestige))).padStart(5)}  ${String(avg(rs.map(r => r.finalFavor))).padStart(5)}  ${String(avg(rs.map(r => r.finalRisk))).padStart(5)}  ${String(avg(rs.map(r => r.totalHealthDrain))).padStart(5)}  ${String(avg(rs.map(r => r.totalHealthRecovered))).padStart(5)}  ${String(avg(rs.map(r => r.gardenUses))).padStart(5)}  ${String(avg(rs.map(r => r.equippedDays))).padStart(5)}  ${String(avg(rs.map(r => r.eventsProcessed))).padStart(5)}`
    );
  });

  // ====== 2. 按选择策略汇总 ======
  console.log(`\n────── 按选择策略汇总 ──────\n`);
  console.log(`选择策略          组数  存活率   均健康 均人缘 均影响 均上司 均风险  均衰减 均恢复`);

  const csGroups: Record<string, SimulationResult[]> = {};
  results.forEach(r => {
    if (!csGroups[r.choiceStrategy]) csGroups[r.choiceStrategy] = [];
    csGroups[r.choiceStrategy].push(r);
  });

  Object.entries(csGroups).sort().forEach(([cs, rs]) => {
    const surviveRate = ((rs.filter(r => r.survived).length / rs.length) * 100).toFixed(0);
    console.log(
      `${cs.padEnd(16)}  ${String(rs.length).padStart(3)}  ${(surviveRate + '%').padStart(5)}  ${String(avg(rs.map(r => r.finalHealth))).padStart(5)}  ${String(avg(rs.map(r => r.finalPopularity))).padStart(5)}  ${String(avg(rs.map(r => r.finalPrestige))).padStart(5)}  ${String(avg(rs.map(r => r.finalFavor))).padStart(5)}  ${String(avg(rs.map(r => r.finalRisk))).padStart(5)}  ${String(avg(rs.map(r => r.totalHealthDrain))).padStart(5)}  ${String(avg(rs.map(r => r.totalHealthRecovered))).padStart(5)}`
    );
  });

  // ====== 3. 按道具策略汇总 ======
  console.log(`\n────── 按道具策略汇总 ──────\n`);
  console.log(`道具策略           组数  存活率   均健康 均人缘 均影响 均上司 均风险  均衰减 均恢复 装备天`);

  const psGroups: Record<string, SimulationResult[]> = {};
  results.forEach(r => {
    if (!psGroups[r.propStrategy]) psGroups[r.propStrategy] = [];
    psGroups[r.propStrategy].push(r);
  });

  Object.entries(psGroups).sort().forEach(([ps, rs]) => {
    const surviveRate = ((rs.filter(r => r.survived).length / rs.length) * 100).toFixed(0);
    console.log(
      `${ps.padEnd(16)}  ${String(rs.length).padStart(3)}  ${(surviveRate + '%').padStart(5)}  ${String(avg(rs.map(r => r.finalHealth))).padStart(5)}  ${String(avg(rs.map(r => r.finalPopularity))).padStart(5)}  ${String(avg(rs.map(r => r.finalPrestige))).padStart(5)}  ${String(avg(rs.map(r => r.finalFavor))).padStart(5)}  ${String(avg(rs.map(r => r.finalRisk))).padStart(5)}  ${String(avg(rs.map(r => r.totalHealthDrain))).padStart(5)}  ${String(avg(rs.map(r => r.totalHealthRecovered))).padStart(5)}  ${String(avg(rs.map(r => r.equippedDays))).padStart(5)}`
    );
  });

  // ====== 4. 结局分布 ======
  console.log(`\n────── 结局分布 ──────`);
  const endingCounts: Record<string, number> = {};
  results.forEach(r => {
    endingCounts[r.ending] = (endingCounts[r.ending] || 0) + 1;
  });
  Object.entries(endingCounts).sort((a, b) => b[1] - a[1]).forEach(([end, count]) => {
    console.log(`  ${end}: ${count} (${pct(count, TOTAL_RUNS)})`);
  });

  // ====== 5. 死亡原因分析 ======
  const deaths = results.filter(r => !r.survived);
  if (deaths.length > 0) {
    console.log(`\n────── 死亡分析 (${deaths.length}组, ${pct(deaths.length, TOTAL_RUNS)}) ──────`);
    const causeCounts: Record<string, SimulationResult[]> = {};
    deaths.forEach(d => {
      if (d.deathCause) {
        if (!causeCounts[d.deathCause]) causeCounts[d.deathCause] = [];
        causeCounts[d.deathCause].push(d);
      }
    });
    Object.entries(causeCounts).sort((a, b) => b[1].length - a[1].length).forEach(([cause, ds]) => {
      const avgDay = avg(ds.map(d => d.deathDay ?? 0));
      console.log(`  ${cause}: ${ds.length}组 (${pct(ds.length, deaths.length)}), 平均死亡日 ${avgDay}`);
      // 找出该死亡原因最多的选择策略
      const byCS: Record<string, number> = {};
      ds.forEach(d => { byCS[d.choiceStrategy] = (byCS[d.choiceStrategy] || 0) + 1; });
      const topCS = Object.entries(byCS).sort((a, b) => b[1] - a[1])[0];
      const byPS: Record<string, number> = {};
      ds.forEach(d => { byPS[d.propStrategy] = (byPS[d.propStrategy] || 0) + 1; });
      const topPS = Object.entries(byPS).sort((a, b) => b[1] - a[1])[0];
      console.log(`    └─ 最多: ${topCS[0]}(${topCS[1]}组) × ${topPS[0]}(${topPS[1]}组)`);
    });
  }

  // ====== 6. 按选择策略的结局分布 ======
  console.log(`\n────── 选择策略 × 结局 交叉 ──────`);
  Object.entries(csGroups).sort().forEach(([cs, rs]) => {
    const endingMap: Record<string, number> = {};
    rs.forEach(r => { endingMap[r.ending] = (endingMap[r.ending] || 0) + 1; });
    const endingStr = Object.entries(endingMap)
      .sort((a, b) => b[1] - a[1])
      .map(([e, c]) => `${e}:${pct(c, rs.length)}`)
      .join(' ');
    console.log(`  ${cs.padEnd(16)} ${endingStr}`);
  });

  console.log(`\n`);
}

run();
