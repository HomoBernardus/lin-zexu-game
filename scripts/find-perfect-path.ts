/**
 * 找一条能到达隐藏结局「天下无烟（perfect_triumph）」的路径，并验证其对周关键词的稳健性。
 * 花园采用养成式模型（种下→生长→收成），收成收益不受周关键词影响。
 * 运行：npx tsx scripts/find-perfect-path.ts
 */
import { GameStats, GameEvent, Choice, WeeklyModifier } from '../types/game';
import { applyDelta, updateNPCAffinity, checkNPCConquest, calculateSupport, determineEnding, clamp } from '../lib/gameLogic';
import { GAME_CONFIG } from '../lib/constants';
import week1Data from '../data/events/week1.json';
import week2Data from '../data/events/week2.json';
import week3Data from '../data/events/week3.json';
import week4Data from '../data/events/week4.json';

const addWeek = (events: Record<string, unknown>[], week: number): GameEvent[] =>
  events.map(e => ({ ...e, week } as unknown as GameEvent));

const ALL_EVENTS: GameEvent[] = [
  ...addWeek(week1Data.events, 1),
  ...addWeek(week2Data.events, 2),
  ...addWeek(week3Data.events, 3),
  ...addWeek(week4Data.events, 4),
];

const SUPPORT_FLAGS = ['wang_app_created', 'chen_law_aid', 'chen_reconciled', 'li_endorsement', 'li_data_meeting'];
const HELPER_FLAGS = ['helped_wang_coding', 'wang_coffee_invite', 'chen_friendly', 'chen_sharing_past'];

// 养成式花园（与 data/garden.ts 一致）
type PlantId = 'mint' | 'gardenia' | 'orchid';
const PLANTS: { id: PlantId; daysToGrow: number; harvest: Partial<GameStats> }[] = [
  { id: 'mint', daysToGrow: 2, harvest: { health: 12, risk: -6 } },
  { id: 'gardenia', daysToGrow: 4, harvest: { popularity: 10, favor: 4 } },
  { id: 'orchid', daysToGrow: 5, harvest: { prestige: 10, favor: 4 } },
];

const ALL_MODIFIERS: WeeklyModifier[] = [
  { name: '梅雨', description: '', icon: '', multipliers: { healthChange: 0.8, popularityChange: 1.0, prestigeChange: 0.6, favorChange: 0.9, riskChange: 0.5 } },
  { name: '大检', description: '', icon: '', multipliers: { healthChange: 0.9, popularityChange: 0.8, prestigeChange: 0.7, favorChange: 0.7, riskChange: 2.0 } },
  { name: '裁员', description: '', icon: '', multipliers: { healthChange: 1.0, popularityChange: 0.5, prestigeChange: 0.5, favorChange: 0.4, riskChange: 1.3 } },
  { name: '酷暑', description: '', icon: '', multipliers: { healthChange: 1.3, popularityChange: 0.7, prestigeChange: 1.5, favorChange: 0.8, riskChange: 1.2 } },
  { name: '项目冲刺', description: '', icon: '', multipliers: { healthChange: 1.2, popularityChange: 0.6, prestigeChange: 1.3, favorChange: 1.4, riskChange: 0.8 } },
];

const neutralModifier: WeeklyModifier = {
  name: '无', description: '', icon: '',
  multipliers: { healthChange: 1, popularityChange: 1, prestigeChange: 1, favorChange: 1, riskChange: 1 },
};

const initialNpcs = {
  wang: { id: 'wang' as const, name: '苏辰', nickname: '小苏', title: '技术部', affinity: 40, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#7CB518' },
  chen: { id: 'chen' as const, name: '陈文彬', nickname: '陈哥', title: 'HR', affinity: 45, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#FF8C69' },
  li: { id: 'li' as const, name: '李婉宁', nickname: '李总', title: '副总经理', affinity: 35, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#6C91B2' },
  zhou: { id: 'zhou' as const, name: '周雨桐', nickname: '小周', title: '技术部', affinity: 60, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#E07B39' },
  zhao: { id: 'zhao' as const, name: '赵德柱', nickname: '老赵', title: '市场部', affinity: 15, prestigePath: 0, popularityPath: 0, isConquered: false, unlockedEvents: [], portraitColor: '#8B6F5E' },
};

type GardenPlot = { plant: PlantId | null; plantedDay: number };

const PHASE_LABEL: Record<string, string> = { morning: '晨', noon: '午', afternoon: '暮', evening: '晚', night: '夜' };
const PHASE_ORDER = ['morning', 'noon', 'afternoon', 'evening', 'night'];

function freshPlots(): GardenPlot[] {
  return [{ plant: null, plantedDay: 0 }, { plant: null, plantedDay: 0 }];
}

// 花园日常：收成已开花的，空盆补种（薄荷保命，栀子/兰花补人缘名望）
function stepGarden(plots: GardenPlot[], stats: GameStats, day: number): string[] {
  const log: string[] = [];
  for (const plot of plots) {
    if (plot.plant) {
      const def = PLANTS.find(p => p.id === plot.plant)!;
      if (day - plot.plantedDay >= def.daysToGrow) {
        for (const k of Object.keys(def.harvest) as (keyof GameStats)[]) {
          stats[k] = clamp(stats[k] + (def.harvest[k] as number));
        }
        log.push(`${plot.plant}@D${day}`);
        plot.plant = null;
        plot.plantedDay = 0;
      }
    } else {
      let type: PlantId = 'mint';
      if (stats.health >= 55 && stats.risk <= 55) {
        type = stats.popularity <= stats.prestige ? 'gardenia' : 'orchid';
      }
      plot.plant = type;
      plot.plantedDay = day;
      log.push(`种${type}@D${day}`);
    }
  }
  return log;
}

function freshState() {
  return {
    stats: { ...GAME_CONFIG.INITIAL_STATS },
    npcs: JSON.parse(JSON.stringify(initialNpcs)) as typeof initialNpcs,
    flags: [] as string[],
    completed: [] as string[],
    plots: freshPlots(),
    gardenLog: [] as string[],
  };
}

function applyChoice(state: ReturnType<typeof freshState>, choice: Choice, modifier: WeeklyModifier) {
  state.stats = applyDelta(state.stats, choice.delta, modifier);
  if (choice.npcAffect) state.npcs = updateNPCAffinity(state.npcs, choice.npcAffect) as typeof initialNpcs;
  (Object.keys(state.npcs) as Array<keyof typeof state.npcs>).forEach(k => {
    if (!state.npcs[k].isConquered && checkNPCConquest(state.npcs[k])) state.npcs[k].isConquered = true;
  });
  if (choice.butterflyFlag) state.flags.push(choice.butterflyFlag);
}

function scoreState(stats: GameStats, npcs: typeof initialNpcs, flags: string[]): number {
  const main = ['wang', 'chen', 'li'] as const;
  let conquered = 0, pathSum = 0;
  for (const k of main) {
    if (npcs[k].isConquered) conquered++;
    pathSum += npcs[k].prestigePath + npcs[k].popularityPath;
  }
  let s = conquered * 1000000 + pathSum * 500;
  for (const f of SUPPORT_FLAGS) if (flags.includes(f)) s += 200000;
  for (const f of HELPER_FLAGS) if (flags.includes(f)) s += 20000;
  s += (stats.prestige + stats.popularity) * 300;
  s -= Math.abs(stats.prestige - stats.popularity) * 400;
  s -= stats.risk * 200;
  s += stats.favor * 100;
  s += stats.health * 50;
  return s;
}

function buildPlan(): { event: GameEvent; choice: Choice }[] {
  const state = freshState();
  const plan: { event: GameEvent; choice: Choice }[] = [];
  const byDay = new Map<number, GameEvent[]>();
  for (const e of ALL_EVENTS) {
    if (!byDay.has(e.day)) byDay.set(e.day, []);
    byDay.get(e.day)!.push(e);
  }

  for (let day = 1; day <= GAME_CONFIG.TOTAL_DAYS; day++) {
    const events = (byDay.get(day) || []).sort((a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase));
    for (const event of events) {
      const cond = (event as unknown as Record<string, unknown>).conditions as { requiresFlag?: string[] } | undefined;
      if (cond?.requiresFlag && !cond.requiresFlag.every(f => state.flags.includes(f))) continue;
      const choices = event.choices.filter(c => !c.requiresFlag || state.flags.includes(c.requiresFlag));
      if (choices.length === 0) continue;

      let best: Choice | null = null;
      let bestScore = -Infinity;
      let bestStats = state.stats, bestNpcs = state.npcs;
      for (const choice of choices) {
        const tmp = { stats: state.stats, npcs: JSON.parse(JSON.stringify(state.npcs)), flags: [...state.flags], completed: [], plots: freshPlots(), gardenLog: [] };
        applyChoice(tmp, choice, neutralModifier);
        const sc = scoreState(tmp.stats, tmp.npcs, tmp.flags);
        if (sc > bestScore) { bestScore = sc; best = choice; bestStats = tmp.stats; bestNpcs = tmp.npcs; }
      }
      applyChoice(state, best!, neutralModifier);
      state.completed.push(event.id);
      plan.push({ event, choice: best! });
    }
    // 花园 → 衰减 → 风险
    state.gardenLog.push(...stepGarden(state.plots, state.stats, day));
    state.stats.health = clamp(state.stats.health - GAME_CONFIG.BASE_HEALTH_DRAIN);
    state.stats.risk = clamp(state.stats.risk - 1);
  }
  return plan;
}

function replay(plan: { event: GameEvent; choice: Choice }[], modifier: WeeklyModifier) {
  const state = freshState();
  let day = 0;
  for (const step of plan) {
    const event = step.event;
    const cond = (event as unknown as Record<string, unknown>).conditions as { requiresFlag?: string[] } | undefined;
    if (cond?.requiresFlag && !cond.requiresFlag.every(f => state.flags.includes(f))) continue;
    if (event.day !== day) {
      day = event.day;
      state.gardenLog.push(...stepGarden(state.plots, state.stats, day));
      state.stats.health = clamp(state.stats.health - GAME_CONFIG.BASE_HEALTH_DRAIN);
      state.stats.risk = clamp(state.stats.risk - 1);
    }
    applyChoice(state, step.choice, modifier);
  }
  const gameState = {
    day: 28, week: 4, stats: state.stats, npcs: state.npcs,
    weeklyModifier: modifier, modifierRemainingDays: 0, butterflyLog: [],
    activeFlags: state.flags, completedEvents: state.completed,
    inventory: { mask: true, fan: false, watergun: false, gasmask: false },
    equippedProp: null, garden: { plots: state.plots, harvested: 0 }, gameOver: false, ending: null as string | null,
  };
  return { ending: determineEnding(gameState), support: calculateSupport(gameState), stats: state.stats, npcs: state.npcs, flags: state.flags, gardenLog: state.gardenLog };
}

// ---- 主流程 ----
const plan = buildPlan();

console.log('===== 贪心路径（中性关键词 + 养成花园）=====');
for (const step of plan) {
  console.log(`第${step.event.day}天·${PHASE_LABEL[step.event.phase]}「${step.event.title}」→「${step.choice.text}」`);
}
console.log(`\n共 ${plan.length} 个事件选择`);

console.log('\n===== 稳健性验证（固定路径 × 各关键词恒定）=====');
for (const mod of ALL_MODIFIERS) {
  const r = replay(plan, mod);
  const sum = r.stats.prestige + r.stats.popularity;
  const diff = Math.abs(r.stats.prestige - r.stats.popularity);
  console.log(
    `${mod.name.padEnd(4)} → 结局 ${r.ending.padEnd(16)} 支持率 ${String(r.support).padStart(3)} | 声望 ${String(r.stats.prestige).padStart(3)} 人缘 ${String(r.stats.popularity).padStart(3)} (和${sum}, 差${diff}) 健康${r.stats.health} 满意${r.stats.favor} 风险${r.stats.risk}`
  );
}

console.log('\n===== 花园记录（示例：薄荷保命 / 栀子兰花补数值）=====');
const neutral = replay(plan, neutralModifier);
console.log(neutral.gardenLog.join('  '));
