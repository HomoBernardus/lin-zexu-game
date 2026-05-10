import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, GameEvent, Choice, WeeklyModifier, PropType, GameNotification } from '@/types/game';
import { GAME_CONFIG } from '@/lib/constants';
import { getRandomModifier } from '@/data/weeklyModifiers';
import { props as propDefs } from '@/data/props';
import { applyDelta, updateNPCAffinity, checkNPCConquest } from '@/lib/gameLogic';

function getHealthDrainBonus(modifier: WeeklyModifier | null): number {
  if (!modifier) return 0;
  switch (modifier.name) {
    case '梅雨': return 3;
    case '大检': return 2;
    case '裁员': return 4;
    case '酷暑': return 3;
    case '项目冲刺': return 1;
    default: return 0;
  }
}

interface GameStore extends GameState {
  notification: GameNotification | null;
  // Actions
  initializeGame: () => void;
  applyChoice: (choice: Choice, event: GameEvent) => void;
  nextDay: () => void;
  gardenAction: (actionType: 'prune' | 'water' | 'meditate') => void;
  equipProp: (propType: PropType) => void;
  unequipProp: () => void;
  clearNotification: () => void;
  saveGame: () => void;
  loadGame: (saveData: GameState) => void;
  resetGame: () => void;
}

const initialStats = { ...GAME_CONFIG.INITIAL_STATS };
const initialNPCs = {
  wang: {
    id: 'wang' as const,
    name: '王',
    nickname: '小王',
    title: '技术部',
    affinity: GAME_CONFIG.INITIAL_NPCS.wang.affinity,
    prestigePath: GAME_CONFIG.INITIAL_NPCS.wang.prestigePath,
    popularityPath: GAME_CONFIG.INITIAL_NPCS.wang.popularityPath,
    isConquered: false,
    unlockedEvents: [],
    portraitColor: '#7CB518',
  },
  chen: {
    id: 'chen' as const,
    name: '陈',
    nickname: '陈哥',
    title: 'HR',
    affinity: GAME_CONFIG.INITIAL_NPCS.chen.affinity,
    prestigePath: GAME_CONFIG.INITIAL_NPCS.chen.prestigePath,
    popularityPath: GAME_CONFIG.INITIAL_NPCS.chen.popularityPath,
    isConquered: false,
    unlockedEvents: [],
    portraitColor: '#FF8C69',
  },
  li: {
    id: 'li' as const,
    name: '李',
    nickname: '李总',
    title: '副总经理',
    affinity: GAME_CONFIG.INITIAL_NPCS.li.affinity,
    prestigePath: GAME_CONFIG.INITIAL_NPCS.li.prestigePath,
    popularityPath: GAME_CONFIG.INITIAL_NPCS.li.popularityPath,
    isConquered: false,
    unlockedEvents: [],
    portraitColor: '#6C91B2',
  },
  zhou: {
    id: 'zhou' as const,
    name: '周',
    nickname: '小周',
    title: '技术部',
    affinity: 60,
    prestigePath: 0,
    popularityPath: 0,
    isConquered: false,
    unlockedEvents: [],
    portraitColor: '#E07B39',
  },
  zhao: {
    id: 'zhao' as const,
    name: '赵',
    nickname: '老赵',
    title: '市场部',
    affinity: 15,
    prestigePath: 0,
    popularityPath: 0,
    isConquered: false,
    unlockedEvents: [],
    portraitColor: '#8B6F5E',
  },
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      day: 1,
      week: 1,
      stats: initialStats,
      npcs: initialNPCs,
      weeklyModifier: null,
      modifierRemainingDays: 0,
      butterflyLog: [],
      activeFlags: [],
      completedEvents: [],
      inventory: { mask: true, fan: false, watergun: false, gasmask: false },
      equippedProp: null,
      gardenUsedToday: false,
      gameOver: false,
      ending: null,
      notification: null,

      // 初始化游戏
      initializeGame: () => {
        const modifier = getRandomModifier();
        set({
          day: 1,
          week: 1,
          stats: { ...initialStats },
          npcs: JSON.parse(JSON.stringify(initialNPCs)),
          weeklyModifier: modifier,
          modifierRemainingDays: GAME_CONFIG.MODIFIER_DURATION_DAYS,
          butterflyLog: [],
          activeFlags: [],
          completedEvents: [],
          inventory: { mask: true, fan: false, watergun: false, gasmask: false },
          equippedProp: null,
          gardenUsedToday: false,
          gameOver: false,
          ending: null,
          notification: null,
        });
      },

      // 应用选择
      applyChoice: (choice, event) => {
        const state = get();
        if (state.gameOver) return;

        // 应用数值变化
        const newStats = applyDelta(state.stats, choice.delta, state.weeklyModifier);

        // 更新NPC好感度
        const newNpcs = choice.npcAffect
          ? updateNPCAffinity(state.npcs, choice.npcAffect)
          : state.npcs;

        // 检查NPC是否攻略成功 + 记录新攻略
        let updatedNpcs = { ...newNpcs };
        const conqueredNpcs: string[] = [];
        Object.keys(updatedNpcs).forEach((key) => {
          const npcKey = key as keyof typeof updatedNpcs;
          if (!updatedNpcs[npcKey].isConquered && checkNPCConquest(updatedNpcs[npcKey])) {
            updatedNpcs[npcKey].isConquered = true;
            conqueredNpcs.push(npcKey);
          }
        });

        // 记录蝴蝶效应
        const newFlags = [...state.activeFlags];
        if (choice.butterflyFlag) {
          newFlags.push(choice.butterflyFlag);
        }

        // 记录完成的事件
        const newCompletedEvents = [...state.completedEvents, event.id];

        // 道具奖励
        const newInventory = { ...state.inventory };
        let acquiredProp: PropType | null = null;
        if (choice.propReward && !state.inventory[choice.propReward]) {
          newInventory[choice.propReward] = true;
          acquiredProp = choice.propReward;
        }

        // 生成通知
        let notification: GameNotification | null = null;
        if (acquiredProp) {
          const propDef = propDefs.find(p => p.id === acquiredProp);
          if (propDef) {
            notification = {
              type: 'prop',
              icon: propDef.icon,
              title: '获得新道具',
              message: `${propDef.name} — ${propDef.description}`,
            };
          }
        } else if (conqueredNpcs.length > 0) {
          const npcKey = conqueredNpcs[0];
          const npc = updatedNpcs[npcKey as keyof typeof updatedNpcs];
          notification = {
            type: 'npc',
            icon: '🤝',
            title: '攻略成功',
            message: `${npc.nickname}（${npc.title}）已成为你的盟友`,
          };
        }

        set({
          stats: newStats,
          npcs: updatedNpcs,
          inventory: newInventory,
          notification,
          butterflyLog: choice.butterflyFlag
            ? [...state.butterflyLog, { eventId: event.id, choiceId: choice.id, flag: choice.butterflyFlag, day: state.day }]
            : state.butterflyLog,
          activeFlags: newFlags,
          completedEvents: newCompletedEvents,
        });
      },

      // 下一天
      nextDay: () => {
        const state = get();
        if (state.gameOver) return;

        let newDay = state.day + 1;
        let newWeek = state.week;
        let newModifier = state.weeklyModifier;
        let newRemainingDays = state.modifierRemainingDays - 1;

        // 更新周数
        if (newDay > 7 && newDay <= 14) newWeek = 2;
        else if (newDay > 14 && newDay <= 21) newWeek = 3;
        else if (newDay > 21 && newDay <= 28) newWeek = 4;
        else if (newDay > 28) newWeek = 5;

        // 周一更换关键词
        if (newDay === 8 || newDay === 15 || newDay === 22) {
          newModifier = getRandomModifier();
          newRemainingDays = GAME_CONFIG.MODIFIER_DURATION_DAYS;
        }

        // 健康衰减：基础5 + 周关键词加成 - 道具防护
        const equipped = state.equippedProp
          ? propDefs.find(p => p.id === state.equippedProp)
          : null;
        const protection = equipped?.protection ?? 0;
        const bonus = getHealthDrainBonus(newModifier);
        const healthDrain = Math.max(0, GAME_CONFIG.BASE_HEALTH_DRAIN + bonus - protection);

        const newStats = { ...state.stats };
        newStats.health = Math.max(0, newStats.health - healthDrain);

        // 装备道具的每日消耗
        if (equipped?.dailyCost) {
          const costDelta = equipped.dailyCost;
          if (costDelta.popularity) newStats.popularity = Math.max(0, newStats.popularity + costDelta.popularity);
          if (costDelta.favor) newStats.favor = Math.max(0, newStats.favor + costDelta.favor);
          if (costDelta.risk) newStats.risk = Math.min(100, newStats.risk + costDelta.risk);
        }

        // 检查游戏结束条件
        const gameOver = newStats.health <= 0 ||
                        newStats.risk >= 100 ||
                        newStats.favor <= 0;

        set({
          day: newDay,
          week: newWeek,
          stats: newStats,
          weeklyModifier: newModifier,
          modifierRemainingDays: newRemainingDays,
          gardenUsedToday: false,
          gameOver,
        });
      },

      // 后花园活动
      gardenAction: (actionType) => {
        const state = get();
        if (state.gameOver || state.gardenUsedToday) return;
        let delta = { health: 0, popularity: 0, prestige: 0, favor: 0, risk: 0 };
        
        switch (actionType) {
          case 'prune':
            delta = { health: 5, popularity: 2, prestige: 0, favor: 0, risk: -2 };
            break;
          case 'water':
            delta = { health: 5, popularity: 0, prestige: 0, favor: 0, risk: -3 };
            break;
          case 'meditate':
            delta = { health: 3, popularity: 5, prestige: 3, favor: 1, risk: -1 };
            break;
        }
        
        const newStats = applyDelta(state.stats, delta, null);
        set({ stats: newStats, gardenUsedToday: true });
      },

      // 装备道具
      equipProp: (propType) => {
        const state = get();
        if (state.gameOver) return;
        if (!state.inventory[propType]) return;
        if (state.equippedProp === propType) return;

        const prop = propDefs.find(p => p.id === propType);
        if (!prop) return;

        // 先卸下当前装备
        let newStats = { ...state.stats };
        if (state.equippedProp) {
          const prev = propDefs.find(p => p.id === state.equippedProp);
          if (prev) {
            newStats = {
              ...newStats,
              popularity: newStats.popularity - (prev.equipCost.popularity ?? 0),
              favor: newStats.favor - (prev.equipCost.favor ?? 0),
              risk: newStats.risk - (prev.equipCost.risk ?? 0),
            };
          }
        }

        // 扣除新装备代价
        newStats = applyDelta(newStats, prop.equipCost, null);

        const gameOver = newStats.health <= 0 ||
                        newStats.risk >= 100 ||
                        newStats.favor <= 0;

        set({ stats: newStats, equippedProp: propType, gameOver });
      },

      // 卸下道具
      unequipProp: () => {
        const state = get();
        if (!state.equippedProp) return;
        set({ equippedProp: null });
      },

      // 清除通知
      clearNotification: () => set({ notification: null }),

      // 存档
      saveGame: () => {
        const state = get();
        localStorage.setItem('linzexu_save', JSON.stringify({
          version: '1.0',
          timestamp: Date.now(),
          state: {
            day: state.day,
            week: state.week,
            stats: state.stats,
            npcs: state.npcs,
            weeklyModifier: state.weeklyModifier,
            modifierRemainingDays: state.modifierRemainingDays,
            butterflyLog: state.butterflyLog,
            activeFlags: state.activeFlags,
            completedEvents: state.completedEvents,
          }
        }));
      },

      // 读档
      loadGame: (saveState) => {
        set({
          day: saveState.day,
          week: saveState.week,
          stats: saveState.stats,
          npcs: saveState.npcs,
          weeklyModifier: saveState.weeklyModifier,
          modifierRemainingDays: saveState.modifierRemainingDays,
          butterflyLog: saveState.butterflyLog,
          activeFlags: saveState.activeFlags,
          completedEvents: saveState.completedEvents,
          gameOver: false,
          ending: null,
        });
      },

      // 重置游戏
      resetGame: () => {
        get().initializeGame();
      },
    }),
    {
      name: 'linzexu-game-storage',
      partialize: (state) => ({
        day: state.day,
        week: state.week,
        stats: state.stats,
        npcs: state.npcs,
        weeklyModifier: state.weeklyModifier,
        butterflyLog: state.butterflyLog,
        activeFlags: state.activeFlags,
        completedEvents: state.completedEvents,
        inventory: state.inventory,
        equippedProp: state.equippedProp,
        gardenUsedToday: state.gardenUsedToday,
      }),
    }
  )
);