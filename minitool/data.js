// 小工具静态数据（面向 Chrome 61 / ES2017 基线）
// 说明：本文件为纯数据，挂到 window.GAME_DATA，供 main.js 读取。
window.GAME_DATA = {
  config: {
    TOTAL_DAYS: 28,
    TOTAL_WEEKS: 4,
    MAX_STAT: 100,
    MIN_STAT: 0,
    CONQUEST_THRESHOLD: 60,
    DUAL_THRESHOLD: 105,
    MODIFIER_DURATION_DAYS: 7,
    BASE_HEALTH_DRAIN: 1,
    RISK_DECAY_INTERVAL: 1,
    INITIAL_STATS: { health: 100, popularity: 50, prestige: 30, favor: 35, risk: 0 }
  },

  statLabels: {
    health: { name: '肺部健康', color: '#DCAE96', icon: '🫁' },
    popularity: { name: '职场人缘', color: '#FF8C69', icon: '👥' },
    prestige: { name: '名望影响力', color: '#6C91B2', icon: '⚡' },
    favor: { name: '上司满意', color: '#7CB518', icon: '👔' },
    risk: { name: 'HR风险', color: '#D9534F', icon: '⚠️' }
  },

  modifiers: [
    { name: '梅雨', description: '潮湿的天气让人胸闷气短。冲突减少了，但影响力也更难建立了。', icon: '🌧️', multipliers: { healthChange: 0.8, popularityChange: 1.0, prestigeChange: 0.6, favorChange: 0.9, riskChange: 0.5 } },
    { name: '大检', description: '人事大检查期间，任何冲突都会被放大。烟雾少了，但风险高了。', icon: '📋', multipliers: { healthChange: 0.9, popularityChange: 0.8, prestigeChange: 0.7, favorChange: 0.7, riskChange: 2.0 } },
    { name: '裁员', description: '公司人心惶惶，所有人都小心翼翼。人际往来变得异常困难。', icon: '📉', multipliers: { healthChange: 1.0, popularityChange: 0.5, prestigeChange: 0.5, favorChange: 0.4, riskChange: 1.3 } },
    { name: '酷暑', description: '炎热的天气让人烦躁，但敢于发声的人也更容易被记住。', icon: '☀️', multipliers: { healthChange: 1.3, popularityChange: 0.7, prestigeChange: 1.5, favorChange: 0.8, riskChange: 1.2 } },
    { name: '项目冲刺', description: '全公司都在赶项目，业绩压力大，但也更容易获得领导认可。', icon: '🚀', multipliers: { healthChange: 1.2, popularityChange: 0.6, prestigeChange: 1.3, favorChange: 1.4, riskChange: 0.8 } }
  ],

  props: [
    { id: 'mask', name: '口罩', icon: '😷', description: '戴上N95口罩过滤二手烟，略显突兀但有效', protection: 2, equipCost: { popularity: -2, risk: 1 }, flavor: '你默默戴上口罩。同事们投来异样的目光，但你不在乎。' },
    { id: 'fan', name: '小风扇', icon: '🌬️', description: '桌面小风扇吹走烟雾，低调不惹人注意', protection: 2, equipCost: { popularity: -1, favor: -2, risk: 2 }, flavor: '小风扇呼呼转动，烟雾被吹散。没人觉得有什么不对。' },
    { id: 'watergun', name: '水枪', icon: '🔫', description: '用水枪浇灭烟头，效果显著但会得罪人', protection: 5, equipCost: { popularity: -5, favor: -3, risk: 7 }, flavor: '噗——水枪精准命中烟头。办公室里鸦雀无声，然后炸开了锅。' },
    { id: 'gasmask', name: '防毒面具', icon: '☠️', description: '军用级防毒面具，极致防护但像疯了一样', protection: 7, equipCost: { popularity: -8, favor: -5, risk: 8 }, dailyCost: { popularity: -1 }, flavor: '你戴上防毒面具走进办公室。李总手里的茶杯掉在地上。全场寂静。' }
  ],

  npcDefs: {
    wang: { name: '苏辰', nickname: '小苏', title: '技术部', portraitColor: '#7CB518', affinity: 40 },
    chen: { name: '陈文彬', nickname: '陈哥', title: 'HR', portraitColor: '#FF8C69', affinity: 45 },
    li: { name: '李婉宁', nickname: '李总', title: '副总经理', portraitColor: '#6C91B2', affinity: 35 },
    zhou: { name: '周雨桐', nickname: '小周', title: '技术部', portraitColor: '#E07B39', affinity: 60 },
    zhao: { name: '赵德柱', nickname: '老赵', title: '市场部', portraitColor: '#8B6F5E', affinity: 15 }
  },

  npcBios: {
    wang: {
      intro: '技术部程序员，和你差不多年纪。坐你斜对面，每天被隔壁工位的烟熏得咳嗽不止，却从不敢开口说什么。胆小，但不是没有想法——他偷偷写了一个戒烟打卡小程序，一直藏在文件夹里，等一个对的时机。',
      quote: '前辈，以后我跟着你干。',
      persona: '藏着戒烟小程序、从不敢开口的程序员'
    },
    chen: {
      intro: 'HR部门的老员工，在这家公司待了十二年。他总喜欢泡一壶陈皮茶，说对肺好。十年前他试着推动过禁烟，一个人写提案、找领导，最后不了了之。没有人记得他做过这件事，但他自己一天都没忘记。',
      quote: '有些话，我一个人说了十年没人听。也许两个人才有分量。',
      persona: '十年前提过禁烟、独自扛了十二年的HR'
    },
    li: {
      intro: '公司副总经理，也是会议室里烟瘾最大的人。她不是一个坏人——她比谁都清楚吸烟的害处，却比谁都更难戒掉。她在会议上驳斥过你，也在背地里替你挡过刀。你只需要一个机会，让她相信你所做的不是为了斗倒谁，而是为了所有人。',
      quote: '那个小林确实不懂事，但说得也不全错。',
      persona: '烟瘾最重、却比谁都懂你的女上司'
    },
    zhou: {
      intro: '技术部程序员，短发，语速很快，做事从不计算后果。她是那种看见不对就要说、看见不公就要冲的人。这样的人在职场上注定受伤——但她出现的那一刻，你会突然想起，自己本来也是这样的人。',
      quote: null,
      persona: '看见不公就冲上去的直性子程序员'
    },
    zhao: {
      intro: '市场部老员工，在公司待了十五年。他是吸烟区最固定的面孔之一，工位烟灰缸永远满着。你提出禁烟之后，他第一个跳出来冷嘲热讽——不是因为你错了，而是你让他觉得自己的习惯受到了审判。但他也会在某一天悄悄收起烟灰缸，换上一盒尼古丁贴片。改变不总是出于认同，有时候只是因为医生对一个人说了四个字：肺有结节。',
      quote: '看什么看，医生说我肺有结节。',
      persona: '吸烟区最固定的面孔，直到医生说肺有结节'
    }
  },

  // 养成式花园：种下花籽，几天后盛开收成（专属图标：同色系底圈 + 白描花形）
  plants: [
    { id: 'mint', name: '薄荷', svg: "<svg viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><circle cx='18' cy='18' r='16' fill='#EDF5E0'/><path d='M18 30V13' stroke='#6B5B45' stroke-width='1.6' stroke-linecap='round' fill='none'/><g fill='#6FA614'><ellipse cx='12.6' cy='26' rx='4.6' ry='2.3' transform='rotate(-30 12.6 26)'/><ellipse cx='23.4' cy='26' rx='4.6' ry='2.3' transform='rotate(30 23.4 26)'/><ellipse cx='12.6' cy='20.5' rx='3.7' ry='1.9' transform='rotate(-30 12.6 20.5)'/><ellipse cx='23.4' cy='20.5' rx='3.7' ry='1.9' transform='rotate(30 23.4 20.5)'/><ellipse cx='12.8' cy='15.5' rx='2.7' ry='1.4' transform='rotate(-30 12.8 15.5)'/><ellipse cx='23.2' cy='15.5' rx='2.7' ry='1.4' transform='rotate(30 23.2 15.5)'/></g></svg>", daysToGrow: 2, harvest: { health: 12, risk: -6 }, desc: '清热去燥，护肺降险', flavor: '你摘下一把薄荷，泡了杯茶。喉咙里那股呛人的烟味，终于散了一点。' },
    { id: 'gardenia', name: '栀子花', svg: "<svg viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><circle cx='18' cy='18' r='16' fill='#FBF1E2'/><g fill='#FFFFFF' stroke='#8B7355' stroke-width='1.1'><ellipse cx='18' cy='11.5' rx='3.1' ry='5'/><ellipse cx='23.6' cy='14.75' rx='3.1' ry='5' transform='rotate(60 23.6 14.75)'/><ellipse cx='23.6' cy='21.25' rx='3.1' ry='5' transform='rotate(120 23.6 21.25)'/><ellipse cx='18' cy='24.5' rx='3.1' ry='5' transform='rotate(180 18 24.5)'/><ellipse cx='12.4' cy='21.25' rx='3.1' ry='5' transform='rotate(240 12.4 21.25)'/><ellipse cx='12.4' cy='14.75' rx='3.1' ry='5' transform='rotate(300 12.4 14.75)'/></g><circle cx='18' cy='18' r='2.8' fill='#D4A574'/></svg>", daysToGrow: 4, harvest: { popularity: 10, favor: 4 }, desc: '清香淡雅，广结人缘', flavor: '栀子花开了，香气飘满阳台。你想起陈哥那杯陈皮茶，也该请他闻闻。' },
    { id: 'orchid', name: '兰花', svg: "<svg viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><circle cx='18' cy='18' r='16' fill='#E6EEF5'/><g fill='#6C91B2'><ellipse cx='18' cy='11' rx='3' ry='4.2'/><ellipse cx='12' cy='14.5' rx='2.9' ry='4' transform='rotate(-45 12 14.5)'/><ellipse cx='24' cy='14.5' rx='2.9' ry='4' transform='rotate(45 24 14.5)'/></g><path d='M18 17c0 4.6-2.8 8.6-3 8.6-.2 0-3-4-3-8.6 0-1.6 1.3-2.9 3-2.9s3 1.3 3 2.9Z' fill='#5B7FA3'/><circle cx='18' cy='15' r='1.7' fill='#D4A574'/></svg>", daysToGrow: 5, harvest: { prestige: 10, favor: 4 }, desc: '高洁清雅，声名远扬', flavor: '兰花盛开。你想起林则徐案头也摆着一盆，君子如兰，不急不躁。' }
  ],

  gardenEvents: [
    { id: 'ge_zhou', text: '小周路过，瞥见你阳台上的花："你这花养得真好，能教我两招吗？"', npcAffect: { zhou: 3 } },
    { id: 'ge_chen', text: '陈哥端着陈皮茶，看着你的花出神："我也养过一盆栀子花，后来……送人了。"', npcAffect: { chen: 3 } },
    { id: 'ge_butterfly', text: '一只蝴蝶落在刚开的花上，翅膀轻轻颤动。你忽然觉得，有些坚持是值得的。', stat: { prestige: 2 } },
    { id: 'ge_note', text: '你在花盆下发现一张泛黄的纸条，上面写着："种花如做人，急不得。"', stat: { favor: 2 } },
    { id: 'ge_rain', text: '夜里下了一场雨。清晨，叶子上挂满水珠，格外精神。', stat: { popularity: 2 } }
  ],

  gardenConfig: { plotCount: 2, eventChance: 0.3 },

  endings: {
    success_full: {
      id: 'success_full',
      title: '海晏河清',
      subtitle: '提案通过，公司正式禁烟',
      description: '年会上，你站在台上，一字一句地读完提案。\n\n投票结果出来的那一刻，会议厅安静了。\n\n禁烟令正式生效。\n\n第二天，吸烟区被拆除。陈哥送了你一盆新的栀子花。小苏把那个工具改成了“戒烟打卡社区”，居然真的帮几个人戒了烟。\n\n李总在电梯里遇见你，咳嗽了两声，说：“小林，谢了。”\n\n你看着窗外，阳光正好。\n\n这世上没有白走的路，也没有白说的话。',
      moodColor: '#B2AC88',
      isHidden: false
    },
    success_partial: {
      id: 'success_partial',
      title: '寸进',
      subtitle: '吸烟区迁移，禁烟未全通过',
      description: '提案没有全票通过。\n\n但吸烟区被移到了楼下的露天平台。\n\n从此，你很少再在电梯里闻到烟味。偶尔路过楼下，看到几个人站在那里，像是做错了什么的孩子。\n\n你阳台上的栀子花开了一整季。\n\n小林，你没有输。',
      moodColor: '#DCAE96',
      isHidden: false
    },
    failure_ignored: {
      id: 'failure_ignored',
      title: '孤鸣',
      subtitle: '提案无人响应',
      description: '你念完提案的那一刻，会议厅里是漫长的沉默。\n\n没有人反对，也没有人支持。\n\n散会后，你一个人站在空荡荡的会议厅。烟味还在。\n\n你突然想起，林则徐当年离开北京时的感觉。\n\n有些仗，你打了，但还没赢。\n\n但你知道，你不是在为自己打。',
      moodColor: '#8A8A8A',
      isHidden: false
    },
    sickbed: {
      id: 'sickbed',
      title: '病榻长叹',
      subtitle: '身体先撑不住了',
      description: '肺部的疼痛让你再也撑不住了。\n\n躺在病床上，你听到窗外有人在争论禁烟的事。\n\n不是你发起的。但有人开始了。\n\n你闭上眼睛，轻轻地笑了。\n\n有些东西，种下了，就会长。',
      moodColor: '#6C91B2',
      isHidden: false
    },
    fired_rigid: {
      id: 'fired_rigid',
      title: '太刚则折',
      subtitle: '被辞退的斗士',
      description: 'HR的通知来得很快。\n\n你收拾工位的时候，小苏冲过来，眼眶红了。\n\n“前辈，你教会我的东西，我不会忘。”\n\n你拍拍他的肩。\n\n离开写字楼的那一刻，你回头看了一眼。\n\n你不是输了。你只是换了一个战场。',
      moodColor: '#D9534F',
      isHidden: false
    },
    laid_off: {
      id: 'laid_off',
      title: '安全第一',
      subtitle: '被优化的理想主义者',
      description: '裁员名单上有你的名字。\n\n不是你不够好。是你太不“安全”。\n\n深夜，你收到陈哥的消息：“别灰心，下一个地方，可能是对的地方。”\n\n你看着阳台上的栀子花，把它装进了行李箱。\n\n下一站，还不知道在哪。\n\n但你知道，你还会继续。',
      moodColor: '#FF8C69',
      isHidden: false
    },
    lone_wolf: {
      id: 'lone_wolf',
      title: '独行侠',
      subtitle: '一个人，也做到了',
      description: '没有盟友，没有人帮忙说话。\n\n你一个人，用数据、用逻辑、用不妥协的语气，让所有人无话可说。\n\n提案通过了。\n\n散会后，没有人来祝贺你。\n\n你一个人走出会议厅，夜风很凉。\n\n但你知道，有些路，本来就是一个人的。\n\n够了。',
      moodColor: '#7CB518',
      isHidden: true
    },
    perfect_triumph: {
      id: 'perfect_triumph',
      title: '天下无烟',
      subtitle: '完美通关·薪火相传',
      description: '年会上，李总第一个站起来支持你。\n\n陈哥拿出了他整理的法务资料。\n\n小苏打开了他的戒烟打卡社区，数据显示，公司吸烟率下降了67%。\n\n全票通过。\n\n会后，你们四个人在阳台上，喝着茶，看着城市的灯火。\n\n李总掐灭了人生的最后一支烟。\n\n陈哥说：“我在这家公司十二年，第一次觉得做了件有意义的事。”\n\n小苏笑了：“前辈，以后我跟着你干。”\n\n你看着远处的天际线，想起了虎门。\n\n有些火焰，灭了。有些火焰，刚刚点燃。',
      moodColor: '#B2AC88',
      isHidden: true
    }
  }
};
