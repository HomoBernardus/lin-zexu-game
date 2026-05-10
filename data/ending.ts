import { Ending } from '@/types/game';

export const endings: Record<string, Ending> = {
  success_full: {
    id: 'success_full',
    title: '海晏河清',
    subtitle: '提案通过，公司正式禁烟',
    description: `年会上，你站在台上，一字一句地读完提案。

投票结果出来的那一刻，会议厅安静了。

禁烟令正式生效。

第二天，吸烟区被拆除。陈哥送了你一盆新的栀子花。小王把那个工具改成了“戒烟打卡社区”，居然真的帮几个人戒了烟。

李总在电梯里遇见你，咳嗽了两声，说：“小林，谢了。”

你看着窗外，阳光正好。

这世上没有白走的路，也没有白说的话。`,
    moodColor: '#B2AC88',
    isHidden: false,
  },
  success_partial: {
    id: 'success_partial',
    title: '寸进',
    subtitle: '吸烟区迁移，禁烟未全通过',
    description: `提案没有全票通过。

但吸烟区被移到了楼下的露天平台。

从此，你很少再在电梯里闻到烟味。偶尔路过楼下，看到几个人站在那里，像是做错了什么的孩子。

你阳台上的栀子花开了一整季。

小林，你没有输。`,
    moodColor: '#DCAE96',
    isHidden: false,
  },
  failure_ignored: {
    id: 'failure_ignored',
    title: '孤鸣',
    subtitle: '提案无人响应',
    description: `你念完提案的那一刻，会议厅里是漫长的沉默。

没有人反对，也没有人支持。

散会后，你一个人站在空荡荡的会议厅。烟味还在。

你突然想起，林则徐当年离开北京时的感觉。

有些仗，你打了，但还没赢。

但你知道，你不是在为自己打。`,
    moodColor: '#8A8A8A',
    isHidden: false,
  },
  sickbed: {
    id: 'sickbed',
    title: '病榻长叹',
    subtitle: '身体先撑不住了',
    description: `肺部的疼痛让你再也撑不住了。

躺在病床上，你听到窗外有人在争论禁烟的事。

不是你发起的。但有人开始了。

你闭上眼睛，轻轻地笑了。

有些东西，种下了，就会长。`,
    moodColor: '#6C91B2',
    isHidden: false,
  },
  fired_rigid: {
    id: 'fired_rigid',
    title: '太刚则折',
    subtitle: '被辞退的斗士',
    description: `HR的通知来得很快。

你收拾工位的时候，小王冲过来，眼眶红了。

“哥/姐，你教会我的东西，我不会忘。”

你拍拍他的肩。

离开写字楼的那一刻，你回头看了一眼。

你不是输了。你只是换了一个战场。`,
    moodColor: '#D9534F',
    isHidden: false,
  },
  laid_off: {
    id: 'laid_off',
    title: '安全第一',
    subtitle: '被优化的理想主义者',
    description: `裁员名单上有你的名字。

不是你不够好。是你太不“安全”。

深夜，你收到陈哥的消息：“别灰心，下一个地方，可能是对的地方。”

你看着阳台上的栀子花，把它装进了行李箱。

下一站，还不知道在哪。

但你知道，你还会继续。`,
    moodColor: '#FF8C69',
    isHidden: false,
  },
  lone_wolf: {
    id: 'lone_wolf',
    title: '独行侠',
    subtitle: '一个人，也做到了',
    description: `没有盟友，没有人帮忙说话。

你一个人，用数据、用逻辑、用不妥协的语气，让所有人无话可说。

提案通过了。

散会后，没有人来祝贺你。

你一个人走出会议厅，夜风很凉。

但你知道，有些路，本来就是一个人的。

够了。`,
    moodColor: '#7CB518',
    isHidden: true,
  },
  perfect_triumph: {
    id: 'perfect_triumph',
    title: '天下无烟',
    subtitle: '完美通关·薪火相传',
    description: `年会上，李总第一个站起来支持你。

陈哥拿出了他整理的法务资料。

小王打开了他的戒烟打卡社区，数据显示，公司吸烟率下降了67%。

全票通过。

会后，你们四个人在阳台上，喝着茶，看着城市的灯火。

李总掐灭了人生的最后一支烟。

陈哥说：“我在这家公司十二年，第一次觉得做了件有意义的事。”

小王笑了：“姐，以后我跟着你干。”

你看着远处的天际线，想起了虎门。

有些火焰，灭了。有些火焰，刚刚点燃。`,
    moodColor: '#B2AC88',
    isHidden: true,
  },
};