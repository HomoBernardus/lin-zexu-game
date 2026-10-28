// 游戏核心类型定义

export type StatKey = 'health' | 'popularity' | 'prestige' | 'favor' | 'risk';

export interface GameStats {
  health: number;      // 肺部健康 0-100
  popularity: number;  // 职场人缘 0-100
  prestige: number;    // 名望影响力 0-100
  favor: number;       // 上司满意 0-100
  risk: number;        // HR风险 0-100
}

export interface NPCBio {
  intro: string;
  quote: string | null;
  persona: string; // 一句话人设
}

export interface NPC {
  id: 'wang' | 'chen' | 'li' | 'zhou' | 'zhao';
  name: string;
  nickname: string;
  title: string;
  affinity: number;      // 综合好感 0-100
  prestigePath: number;  // 影响力线攻略进度
  popularityPath: number; // 人缘线攻略进度
  isConquered: boolean;
  unlockedEvents: string[];
  portraitColor: string;
}

// 道具系统
export type PropType = 'mask' | 'fan' | 'watergun' | 'gasmask';

export interface PropConfig {
  id: PropType;
  name: string;
  icon: string;
  description: string;
  protection: number;
  equipCost: Partial<ChoiceDelta>;
  dailyCost?: Partial<ChoiceDelta>;
  flavor: string;
}

export interface ChoiceDelta {
  health?: number;
  popularity?: number;
  prestige?: number;
  favor?: number;
  risk?: number;
}

// 养成式花园
export type PlantType = 'mint' | 'gardenia' | 'orchid';

export interface PlantConfig {
  id: PlantType;
  name: string;
  svg: string;          // 专属图标（SVG，含同色系底圈）
  daysToGrow: number;
  harvest: ChoiceDelta; // 收成奖励
  desc: string;         // 一句话说明
  flavor: string;       // 收成文案
}

export interface GardenPlot {
  plant: PlantType | null;
  plantedDay: number; // 种下的天数（day 值）
}

export interface GardenEvent {
  id: string;
  text: string;
  npcAffect?: { wang?: number; chen?: number; li?: number; zhou?: number };
  stat?: ChoiceDelta;
}

export interface GardenState {
  plots: GardenPlot[];
  harvested: number; // 累计收成次数
}

export interface Choice {
  id: string;
  text: string;
  delta: ChoiceDelta;
  npcAffect?: {
    wang?: number;
    chen?: number;
    li?: number;
    zhou?: number;
  };
  butterflyFlag?: string;
  requiresFlag?: string;  // 需要某个蝴蝶效应才能解锁
  propReward?: PropType;  // 选择后获得的道具
}

export interface GameEvent {
  id: string;
  day: number;
  week: number;
  phase: 'morning' | 'noon' | 'afternoon' | 'evening';
  title: string;
  description: string;
  choices: Choice[];
  isConditional?: boolean;
  condition?: {
    npcId?: string;
    minAffinity?: number;
    flag?: string;
  };
}

export interface WeeklyModifier {
  name: string;
  description: string;
  icon: string;
  multipliers: {
    healthChange: number;
    popularityChange: number;
    prestigeChange: number;
    favorChange: number;
    riskChange: number;
  };
}

export interface ButterflyRecord {
  eventId: string;
  choiceId: string;
  flag: string;
  day: number;
}

export interface GameState {
  day: number;
  week: number;
  stats: GameStats;
  npcs: {
    wang: NPC;
    chen: NPC;
    li: NPC;
    zhou: NPC;
    zhao: NPC;
  };
  weeklyModifier: WeeklyModifier | null;
  modifierRemainingDays: number;
  butterflyLog: ButterflyRecord[];
  activeFlags: string[];
  completedEvents: string[];
  inventory: Record<PropType, boolean>;
  equippedProp: PropType | null;
  gameOver: boolean;
  garden: GardenState;
  ending: string | null;
}

export interface GameNotification {
  type: 'prop' | 'npc';
  icon: string;
  title: string;
  message: string;
}

export interface GameSave {
  version: string;
  timestamp: number;
  state: GameState;
}

// 结局类型
export type EndingType = 
  | 'success_full'
  | 'success_partial'
  | 'failure_ignored'
  | 'sickbed'
  | 'fired_rigid'
  | 'laid_off'
  | 'lone_wolf'
  | 'perfect_triumph';

export interface Ending {
  id: EndingType;
  title: string;
  subtitle: string;
  description: string;
  moodColor: string;
  isHidden: boolean;
}