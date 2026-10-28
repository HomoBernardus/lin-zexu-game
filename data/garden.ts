import { PlantConfig, GardenEvent } from '@/types/game';

// 养成式花园：种下花籽，几天后盛开收成，不同花给不同加成。
// 专属图标采用同色系底圈 + 白描花形，与全游戏暖色纸墨风格一致。
const MINT_SVG = "<svg viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><circle cx='18' cy='18' r='16' fill='#EDF5E0'/><path d='M18 30V13' stroke='#6B5B45' stroke-width='1.6' stroke-linecap='round' fill='none'/><g fill='#6FA614'><ellipse cx='12.6' cy='26' rx='4.6' ry='2.3' transform='rotate(-30 12.6 26)'/><ellipse cx='23.4' cy='26' rx='4.6' ry='2.3' transform='rotate(30 23.4 26)'/><ellipse cx='12.6' cy='20.5' rx='3.7' ry='1.9' transform='rotate(-30 12.6 20.5)'/><ellipse cx='23.4' cy='20.5' rx='3.7' ry='1.9' transform='rotate(30 23.4 20.5)'/><ellipse cx='12.8' cy='15.5' rx='2.7' ry='1.4' transform='rotate(-30 12.8 15.5)'/><ellipse cx='23.2' cy='15.5' rx='2.7' ry='1.4' transform='rotate(30 23.2 15.5)'/></g></svg>";

const GARDENIA_SVG = "<svg viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><circle cx='18' cy='18' r='16' fill='#FBF1E2'/><g fill='#FFFFFF' stroke='#8B7355' stroke-width='1.1'><ellipse cx='18' cy='11.5' rx='3.1' ry='5'/><ellipse cx='23.6' cy='14.75' rx='3.1' ry='5' transform='rotate(60 23.6 14.75)'/><ellipse cx='23.6' cy='21.25' rx='3.1' ry='5' transform='rotate(120 23.6 21.25)'/><ellipse cx='18' cy='24.5' rx='3.1' ry='5' transform='rotate(180 18 24.5)'/><ellipse cx='12.4' cy='21.25' rx='3.1' ry='5' transform='rotate(240 12.4 21.25)'/><ellipse cx='12.4' cy='14.75' rx='3.1' ry='5' transform='rotate(300 12.4 14.75)'/></g><circle cx='18' cy='18' r='2.8' fill='#D4A574'/></svg>";

const ORCHID_SVG = "<svg viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><circle cx='18' cy='18' r='16' fill='#E6EEF5'/><g fill='#6C91B2'><ellipse cx='18' cy='11' rx='3' ry='4.2'/><ellipse cx='12' cy='14.5' rx='2.9' ry='4' transform='rotate(-45 12 14.5)'/><ellipse cx='24' cy='14.5' rx='2.9' ry='4' transform='rotate(45 24 14.5)'/></g><path d='M18 17c0 4.6-2.8 8.6-3 8.6-.2 0-3-4-3-8.6 0-1.6 1.3-2.9 3-2.9s3 1.3 3 2.9Z' fill='#5B7FA3'/><circle cx='18' cy='15' r='1.7' fill='#D4A574'/></svg>";

export const plants: PlantConfig[] = [
  {
    id: 'mint',
    name: '薄荷',
    svg: MINT_SVG,
    daysToGrow: 2,
    harvest: { health: 12, risk: -6 },
    desc: '清热去燥，护肺降险',
    flavor: '你摘下一把薄荷，泡了杯茶。喉咙里那股呛人的烟味，终于散了一点。',
  },
  {
    id: 'gardenia',
    name: '栀子花',
    svg: GARDENIA_SVG,
    daysToGrow: 4,
    harvest: { popularity: 10, favor: 4 },
    desc: '清香淡雅，广结人缘',
    flavor: '栀子花开了，香气飘满阳台。你想起陈哥那杯陈皮茶，也该请他闻闻。',
  },
  {
    id: 'orchid',
    name: '兰花',
    svg: ORCHID_SVG,
    daysToGrow: 5,
    harvest: { prestige: 10, favor: 4 },
    desc: '高洁清雅，声名远扬',
    flavor: '兰花盛开。你想起林则徐案头也摆着一盆，君子如兰，不急不躁。',
  },
];

// 收成时偶尔触发的花园小事件（30% 概率），给一点惊喜。
export const gardenEvents: GardenEvent[] = [
  {
    id: 'ge_zhou',
    text: '小周路过，瞥见你阳台上的花："你这花养得真好，能教我两招吗？"',
    npcAffect: { zhou: 3 },
  },
  {
    id: 'ge_chen',
    text: '陈哥端着陈皮茶，看着你的花出神："我也养过一盆栀子花，后来……送人了。"',
    npcAffect: { chen: 3 },
  },
  {
    id: 'ge_butterfly',
    text: '一只蝴蝶落在刚开的花上，翅膀轻轻颤动。你忽然觉得，有些坚持是值得的。',
    stat: { prestige: 2 },
  },
  {
    id: 'ge_note',
    text: '你在花盆下发现一张泛黄的纸条，上面写着："种花如做人，急不得。"',
    stat: { favor: 2 },
  },
  {
    id: 'ge_rain',
    text: '夜里下了一场雨。清晨，叶子上挂满水珠，格外精神。',
    stat: { popularity: 2 },
  },
];

export const PLOT_COUNT = 2;
export const GARDEN_EVENT_CHANCE = 0.3;
