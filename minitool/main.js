// 林则徐 · 都市销烟录 —— 小工具原生版本
// 面向 Chrome 61 / ES2017 基线：不使用可选链、空值合并、对象展开、模块语法、内联脚本。
// 交互统一走事件委托（data-action），整页重渲染，无任何内联事件处理器。

(function () {
  'use strict';

  // ===== 常量引用 =====
  var DATA = window.GAME_DATA;
  var EVENTS = window.EVENTS;
  var CONFIG = DATA.config;
  var STAT_LABELS = DATA.statLabels;
  var MODIFIERS = DATA.modifiers;
  var PROP_DEFS = DATA.props;
  var NPC_DEFS = DATA.npcDefs;
  var NPC_BIOS = DATA.npcBios;
  var ENDINGS = DATA.endings;

  var STORAGE_KEY = 'linzexu-game-storage';
  var SAVE_VERSION = 4;
  var STAT_KEYS = ['health', 'popularity', 'prestige', 'favor', 'risk'];
  var NPC_ORDER = ['wang', 'chen', 'li', 'zhou', 'zhao'];
  var MAIN_NPC_ORDER = ['wang', 'chen', 'li'];
  var PHASE_MAP = { morning: '晨', noon: '午', afternoon: '暮', evening: '晚', night: '夜' };
  var WEEK_NAMES = ['', '第一周', '第二周', '第三周', '第四周'];
  var PLANTS = DATA.plants;
  var GARDEN_EVENTS = DATA.gardenEvents;
  var GARDEN_CONFIG = DATA.gardenConfig;

  // ===== 运行时状态 =====
  var state = null;

  var ui = {
    showSplash: true,
    splashStep: 0,
    mobileTab: null,
    selectedNpc: null,
    gardenMessage: null,
    propMessage: null,
    notification: null
  };

  var appEl = null;
  var toastEl = null;
  var toastTimer = null;
  var gardenTimer = null;
  var propTimer = null;

  // ===== 工具函数 =====
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function findProp(id) {
    for (var i = 0; i < PROP_DEFS.length; i++) {
      if (PROP_DEFS[i].id === id) return PROP_DEFS[i];
    }
    return null;
  }

  function findPlant(id) {
    for (var i = 0; i < PLANTS.length; i++) {
      if (PLANTS[i].id === id) return PLANTS[i];
    }
    return null;
  }

  function effectText(delta) {
    var parts = [];
    if (delta.health) parts.push((delta.health > 0 ? '+' : '') + delta.health + ' 健康');
    if (delta.popularity) parts.push((delta.popularity > 0 ? '+' : '') + delta.popularity + ' 人缘');
    if (delta.prestige) parts.push((delta.prestige > 0 ? '+' : '') + delta.prestige + ' 名望');
    if (delta.favor) parts.push((delta.favor > 0 ? '+' : '') + delta.favor + ' 满意');
    if (delta.risk) parts.push((delta.risk > 0 ? '+' : '') + delta.risk + ' 风险');
    return parts.join(' / ');
  }

  function findEvent(id) {
    for (var i = 0; i < EVENTS.length; i++) {
      if (EVENTS[i].id === id) return EVENTS[i];
    }
    return null;
  }

  // ===== 核心游戏逻辑（忠实移植自 lib/gameLogic.ts + hooks/useGameState.ts） =====
  function clamp(v) {
    return Math.min(CONFIG.MAX_STAT, Math.max(CONFIG.MIN_STAT, v));
  }

  function applyDelta(stats, delta, modifier) {
    var multipliers = (modifier && modifier.multipliers) || {
      healthChange: 1, popularityChange: 1, prestigeChange: 1, favorChange: 1, riskChange: 1
    };
    delta = delta || {};
    var newStats = {
      health: stats.health,
      popularity: stats.popularity,
      prestige: stats.prestige,
      favor: stats.favor,
      risk: stats.risk
    };
    if (delta.health !== undefined) newStats.health = clamp(stats.health + Math.round(delta.health * multipliers.healthChange));
    if (delta.popularity !== undefined) newStats.popularity = clamp(stats.popularity + Math.round(delta.popularity * multipliers.popularityChange));
    if (delta.prestige !== undefined) newStats.prestige = clamp(stats.prestige + Math.round(delta.prestige * multipliers.prestigeChange));
    if (delta.favor !== undefined) newStats.favor = clamp(stats.favor + Math.round(delta.favor * multipliers.favorChange));
    if (delta.risk !== undefined) newStats.risk = clamp(stats.risk + Math.round(delta.risk * multipliers.riskChange));
    return newStats;
  }

  function cloneNPC(npc) {
    return {
      id: npc.id,
      name: npc.name,
      nickname: npc.nickname,
      title: npc.title,
      affinity: npc.affinity,
      prestigePath: npc.prestigePath,
      popularityPath: npc.popularityPath,
      isConquered: npc.isConquered,
      unlockedEvents: npc.unlockedEvents,
      portraitColor: npc.portraitColor
    };
  }

  function updateNPCAffinity(npcs, affects) {
    var newNpcs = {};
    for (var i = 0; i < NPC_ORDER.length; i++) {
      var id = NPC_ORDER[i];
      newNpcs[id] = cloneNPC(npcs[id]);
    }
    // 小苏：同龄人 (7:3)
    if (affects.wang !== undefined) {
      newNpcs.wang.affinity = clamp(newNpcs.wang.affinity + affects.wang);
      if (affects.wang > 0) {
        newNpcs.wang.popularityPath = clamp(newNpcs.wang.popularityPath + Math.round(affects.wang * 0.7));
        newNpcs.wang.prestigePath = clamp(newNpcs.wang.prestigePath + Math.round(affects.wang * 0.3));
      }
    }
    // 陈哥：中立HR (5:5)
    if (affects.chen !== undefined) {
      newNpcs.chen.affinity = clamp(newNpcs.chen.affinity + affects.chen);
      if (affects.chen > 0) {
        newNpcs.chen.popularityPath = clamp(newNpcs.chen.popularityPath + Math.round(affects.chen * 0.5));
        newNpcs.chen.prestigePath = clamp(newNpcs.chen.prestigePath + Math.round(affects.chen * 0.5));
      }
    }
    // 李总：上级 (3:7)
    if (affects.li !== undefined) {
      newNpcs.li.affinity = clamp(newNpcs.li.affinity + affects.li);
      if (affects.li > 0) {
        newNpcs.li.popularityPath = clamp(newNpcs.li.popularityPath + Math.round(affects.li * 0.3));
        newNpcs.li.prestigePath = clamp(newNpcs.li.prestigePath + Math.round(affects.li * 0.7));
      }
    }
    // 小周：非核心NPC
    if (affects.zhou !== undefined) {
      newNpcs.zhou.affinity = clamp(newNpcs.zhou.affinity + affects.zhou);
    }
    return newNpcs;
  }

  function checkNPCConquest(npc) {
    var isSinglePath = npc.prestigePath >= CONFIG.CONQUEST_THRESHOLD ||
                       npc.popularityPath >= CONFIG.CONQUEST_THRESHOLD;
    var isDualPath = npc.prestigePath + npc.popularityPath >= CONFIG.DUAL_THRESHOLD;
    return isSinglePath || isDualPath;
  }

  function calculateSupport(s) {
    var support = 20;
    support += s.stats.prestige * 0.25;
    support += s.stats.popularity * 0.25;

    var liEffective = s.npcs.li.isConquered && s.activeFlags.indexOf('li_data_meeting') !== -1;
    var n = 0;
    if (s.npcs.wang.isConquered) n++;
    if (s.npcs.chen.isConquered) n++;
    if (liEffective) n++;
    support += n * 12;

    if (s.activeFlags.indexOf('wang_app_created') !== -1) support += 10;
    if (s.activeFlags.indexOf('chen_law_aid') !== -1) support += 8;
    if (s.activeFlags.indexOf('chen_reconciled') !== -1) support += 6;
    if (s.activeFlags.indexOf('li_endorsement') !== -1) support += 15;

    var diff = Math.abs(s.stats.prestige - s.stats.popularity);
    if (diff > 50) {
      support -= s.stats.prestige > s.stats.popularity ? 8 : 5;
    }
    return Math.round(support);
  }

  function conqueredCount(s) {
    var n = 0;
    if (s.npcs.wang.isConquered) n++;
    if (s.npcs.chen.isConquered) n++;
    if (s.npcs.li.isConquered) n++;
    return n;
  }

  function determineEnding(s) {
    if (s.stats.health <= 0) return 'sickbed';
    if (s.stats.risk >= 100) return 'fired_rigid';
    if (s.stats.favor <= 0) return 'laid_off';

    var support = calculateSupport(s);
    var n = conqueredCount(s);

    if (n === 3 && support >= 115) return 'perfect_triumph';
    if (s.stats.prestige >= 55 && s.stats.popularity <= 45) return 'lone_wolf';
    if (support >= 65 && n >= 2) return 'success_full';
    if (support >= 40 && n >= 1) return 'success_partial';
    return 'failure_ignored';
  }

  function getRandomModifier() {
    return MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
  }

  function getHealthDrainBonus(modifier) {
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

  function getAffinityColor(conquered, affinity) {
    if (conquered) return '#8B7355';
    if (affinity >= 70) return '#6B9C6E';
    if (affinity >= 40) return '#D4956A';
    return '#9B8B7A';
  }

  // ===== 状态初始化 / 持久化 =====
  function makeInitialNPCs() {
    var npcs = {};
    for (var i = 0; i < NPC_ORDER.length; i++) {
      var id = NPC_ORDER[i];
      var def = NPC_DEFS[id];
      npcs[id] = {
        id: id,
        name: def.name,
        nickname: def.nickname,
        title: def.title,
        affinity: def.affinity,
        prestigePath: 0,
        popularityPath: 0,
        isConquered: false,
        unlockedEvents: [],
        portraitColor: def.portraitColor
      };
    }
    return npcs;
  }

  function freshGarden() {
    var plots = [];
    for (var i = 0; i < GARDEN_CONFIG.plotCount; i++) plots.push({ plant: null, plantedDay: 0 });
    return { plots: plots, harvested: 0 };
  }

  function freshState() {
    var init = CONFIG.INITIAL_STATS;
    return {
      day: 1,
      week: 1,
      stats: {
        health: init.health,
        popularity: init.popularity,
        prestige: init.prestige,
        favor: init.favor,
        risk: init.risk
      },
      npcs: makeInitialNPCs(),
      weeklyModifier: null,
      modifierRemainingDays: 0,
      butterflyLog: [],
      activeFlags: [],
      completedEvents: [],
      inventory: { mask: true, fan: false, watergun: false, gasmask: false },
      equippedProp: null,
      garden: freshGarden(),
      gameOver: false,
      ending: null
    };
  }

  function initializeGame() {
    state = freshState();
    state.weeklyModifier = getRandomModifier();
    state.modifierRemainingDays = CONFIG.MODIFIER_DURATION_DAYS;
    saveState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: SAVE_VERSION,
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
        garden: state.garden
      }));
    } catch (e) {
      // 忽略存储异常（隐私模式等）
    }
  }

  function loadState() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    if (!raw) return null;
    var saved = null;
    try { saved = JSON.parse(raw); } catch (e) { return null; }
    if (!saved || typeof saved !== 'object') return null;
    if (saved.version !== SAVE_VERSION) return null; // 丢弃旧版本存档（天数/事件结构变更）

    var base = freshState();

    var npcs = {};
    for (var i = 0; i < NPC_ORDER.length; i++) {
      var id = NPC_ORDER[i];
      var def = NPC_DEFS[id];
      var savedNpc = (saved.npcs && saved.npcs[id]) || {};
      npcs[id] = {
        id: id,
        name: def.name,
        nickname: def.nickname,
        title: def.title,
        affinity: savedNpc.affinity !== undefined ? savedNpc.affinity : def.affinity,
        prestigePath: savedNpc.prestigePath !== undefined ? savedNpc.prestigePath : 0,
        popularityPath: savedNpc.popularityPath !== undefined ? savedNpc.popularityPath : 0,
        isConquered: savedNpc.isConquered !== undefined ? savedNpc.isConquered : false,
        unlockedEvents: savedNpc.unlockedEvents || [],
        portraitColor: def.portraitColor
      };
    }

    var inventory = { mask: true, fan: false, watergun: false, gasmask: false };
    if (saved.inventory) inventory = Object.assign(inventory, saved.inventory);

    var stats = { health: base.stats.health, popularity: base.stats.popularity, prestige: base.stats.prestige, favor: base.stats.favor, risk: base.stats.risk };
    if (saved.stats) stats = Object.assign(stats, saved.stats);

    var garden = freshGarden();
    if (saved.garden) {
      if (saved.garden.plots) garden.plots = saved.garden.plots;
      if (saved.garden.harvested !== undefined) garden.harvested = saved.garden.harvested;
    }

    return {
      day: saved.day !== undefined ? saved.day : base.day,
      week: saved.week !== undefined ? saved.week : base.week,
      stats: stats,
      npcs: npcs,
      weeklyModifier: saved.weeklyModifier !== undefined ? saved.weeklyModifier : base.weeklyModifier,
      modifierRemainingDays: 0,
      butterflyLog: saved.butterflyLog || [],
      activeFlags: saved.activeFlags || [],
      completedEvents: saved.completedEvents || [],
      inventory: inventory,
      equippedProp: saved.equippedProp !== undefined ? saved.equippedProp : null,
      garden: garden,
      gameOver: false,
      ending: null
    };
  }

  // ===== 状态变更（action） =====
  function applyChoice(choice, event) {
    if (state.gameOver) return;

    var newStats = applyDelta(state.stats, choice.delta, state.weeklyModifier);
    var newNpcs = choice.npcAffect ? updateNPCAffinity(state.npcs, choice.npcAffect) : state.npcs;

    var conqueredNpcs = [];
    for (var i = 0; i < NPC_ORDER.length; i++) {
      var key = NPC_ORDER[i];
      if (!newNpcs[key].isConquered && checkNPCConquest(newNpcs[key])) {
        newNpcs[key].isConquered = true;
        conqueredNpcs.push(key);
      }
    }

    var newFlags = state.activeFlags.slice();
    if (choice.butterflyFlag) newFlags.push(choice.butterflyFlag);

    var newCompletedEvents = state.completedEvents.concat([event.id]);

    var newInventory = Object.assign({}, state.inventory);
    var acquiredProp = null;
    if (choice.propReward && !state.inventory[choice.propReward]) {
      newInventory[choice.propReward] = true;
      acquiredProp = choice.propReward;
    }

    var notification = null;
    if (acquiredProp) {
      var propDef = findProp(acquiredProp);
      if (propDef) {
        notification = { type: 'prop', icon: propDef.icon, title: '获得新道具', message: propDef.name + ' — ' + propDef.description };
      }
    } else if (conqueredNpcs.length > 0) {
      var npcKey = conqueredNpcs[0];
      var npc = newNpcs[npcKey];
      notification = { type: 'npc', icon: '🤝', title: '攻略成功', message: npc.nickname + '（' + npc.title + '）已成为你的盟友' };
    }

    var newButterflyLog = state.butterflyLog;
    if (choice.butterflyFlag) {
      newButterflyLog = state.butterflyLog.concat([{ eventId: event.id, choiceId: choice.id, flag: choice.butterflyFlag, day: state.day }]);
    }

    state.stats = newStats;
    state.npcs = newNpcs;
    state.inventory = newInventory;
    state.butterflyLog = newButterflyLog;
    state.activeFlags = newFlags;
    state.completedEvents = newCompletedEvents;

    if (notification) {
      ui.notification = notification;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        ui.notification = null;
        renderToast();
      }, 3000);
    }
  }

  function nextDay() {
    if (state.gameOver) return;

    var newDay = state.day + 1;
    var newWeek = state.week;
    var newModifier = state.weeklyModifier;
    var newRemainingDays = state.modifierRemainingDays - 1;

    if (newDay > 7 && newDay <= 14) newWeek = 2;
    else if (newDay > 14 && newDay <= 21) newWeek = 3;
    else if (newDay > 21 && newDay <= 28) newWeek = 4;
    else if (newDay > 28) newWeek = 5;

    if (newDay === 8 || newDay === 15 || newDay === 22) {
      newModifier = getRandomModifier();
      newRemainingDays = CONFIG.MODIFIER_DURATION_DAYS;
    }

    var equipped = state.equippedProp ? findProp(state.equippedProp) : null;
    var protection = equipped ? equipped.protection : 0;
    var bonus = getHealthDrainBonus(newModifier);
    var healthDrain = Math.max(0, CONFIG.BASE_HEALTH_DRAIN + bonus - protection);

    var newStats = {
      health: state.stats.health,
      popularity: state.stats.popularity,
      prestige: state.stats.prestige,
      favor: state.stats.favor,
      risk: state.stats.risk
    };
    newStats.health = Math.max(0, newStats.health - healthDrain);

    if (equipped && equipped.dailyCost) {
      var costDelta = equipped.dailyCost;
      if (costDelta.popularity) newStats.popularity = Math.max(0, newStats.popularity + costDelta.popularity);
      if (costDelta.favor) newStats.favor = Math.max(0, newStats.favor + costDelta.favor);
      if (costDelta.risk) newStats.risk = Math.min(100, newStats.risk + costDelta.risk);
    }

    if (newDay % CONFIG.RISK_DECAY_INTERVAL === 0) {
      newStats.risk = Math.max(0, newStats.risk - 1);
    }

    var gameOver = newStats.health <= 0 || newStats.risk >= 100 || newStats.favor <= 0;

    state.day = newDay;
    state.week = newWeek;
    state.stats = newStats;
    state.weeklyModifier = newModifier;
    state.modifierRemainingDays = newRemainingDays;
    state.gameOver = gameOver;

    // 自然结束（第 29 天起）
    if (!state.gameOver && state.day >= 29) {
      state.gameOver = true;
    }
  }

  function plant(plotIndex, plantType) {
    if (state.gameOver) return;
    var plot = state.garden.plots[plotIndex];
    if (!plot || plot.plant) return;
    var plantDef = findPlant(plantType);
    if (!plantDef) return;

    var newPlots = state.garden.plots.slice();
    newPlots[plotIndex] = { plant: plantType, plantedDay: state.day };
    state.garden = { plots: newPlots, harvested: state.garden.harvested };
  }

  function harvest(plotIndex) {
    if (state.gameOver) return null;
    var plot = state.garden.plots[plotIndex];
    if (!plot || !plot.plant) return null;
    var plantDef = findPlant(plot.plant);
    if (!plantDef) return null;
    if (state.day - plot.plantedDay < plantDef.daysToGrow) return null;

    var newStats = applyDelta(state.stats, plantDef.harvest, null);
    var newNpcs = state.npcs;
    var message = plantDef.flavor;

    if (Math.random() < GARDEN_CONFIG.eventChance) {
      var evt = GARDEN_EVENTS[Math.floor(Math.random() * GARDEN_EVENTS.length)];
      if (evt.stat) newStats = applyDelta(newStats, evt.stat, null);
      if (evt.npcAffect) newNpcs = updateNPCAffinity(newNpcs, evt.npcAffect);
      message = evt.text;
    }

    var newPlots = state.garden.plots.slice();
    newPlots[plotIndex] = { plant: null, plantedDay: 0 };
    state.garden = { plots: newPlots, harvested: state.garden.harvested + 1 };
    state.stats = newStats;
    state.npcs = newNpcs;
    return message;
  }

  function equipProp(propType) {
    if (state.gameOver) return;
    if (!state.inventory[propType]) return;
    if (state.equippedProp === propType) return;
    var prop = findProp(propType);
    if (!prop) return;

    var newStats = {
      health: state.stats.health,
      popularity: state.stats.popularity,
      prestige: state.stats.prestige,
      favor: state.stats.favor,
      risk: state.stats.risk
    };

    // 先卸下当前装备（退回其装备代价）
    if (state.equippedProp) {
      var prev = findProp(state.equippedProp);
      if (prev) {
        newStats.popularity = newStats.popularity - (prev.equipCost.popularity || 0);
        newStats.favor = newStats.favor - (prev.equipCost.favor || 0);
        newStats.risk = newStats.risk - (prev.equipCost.risk || 0);
      }
    }

    // 扣除新装备代价
    newStats = applyDelta(newStats, prop.equipCost, null);

    var gameOver = newStats.health <= 0 || newStats.risk >= 100 || newStats.favor <= 0;

    state.stats = newStats;
    state.equippedProp = propType;
    state.gameOver = gameOver;
  }

  function unequipProp() {
    if (!state.equippedProp) return;
    state.equippedProp = null;
  }

  // ===== 事件可用性 =====
  function eventIsAvailable(e) {
    var cond = e.conditions;
    if (cond && cond.requiresFlag) {
      for (var i = 0; i < cond.requiresFlag.length; i++) {
        if (state.activeFlags.indexOf(cond.requiresFlag[i]) === -1) return false;
      }
    }
    return true;
  }

  function currentEvent() {
    for (var i = 0; i < EVENTS.length; i++) {
      var e = EVENTS[i];
      if (e.day === state.day && eventIsAvailable(e) && state.completedEvents.indexOf(e.id) === -1) {
        return e;
      }
    }
    return null;
  }

  // ===== 交互处理（事件委托） =====
  function onChoose(choiceId, eventId) {
    var event = findEvent(eventId);
    if (!event) return;
    var choice = null;
    for (var i = 0; i < event.choices.length; i++) {
      if (event.choices[i].id === choiceId) { choice = event.choices[i]; break; }
    }
    if (!choice) return;

    applyChoice(choice, event);
    saveState();
    render();
  }

  function onPlant(plotIndex, plantType) {
    plant(plotIndex, plantType);
    ui.gardenMessage = null;
    saveState();
    render();
  }

  function onHarvest(plotIndex) {
    var message = harvest(plotIndex);
    if (message === null) return;
    ui.gardenMessage = message;
    saveState();
    render();
    if (gardenTimer) clearTimeout(gardenTimer);
    gardenTimer = setTimeout(function () {
      ui.gardenMessage = null;
      render();
    }, 2600);
  }

  function onToggleProp(propType) {
    if (state.gameOver) return;
    if (!state.inventory[propType]) return;
    if (state.equippedProp === propType) {
      unequipProp();
      ui.propMessage = '已卸下';
    } else {
      equipProp(propType);
      var prop = findProp(propType);
      ui.propMessage = prop ? prop.flavor : null;
    }
    saveState();
    render();
    if (propTimer) clearTimeout(propTimer);
    propTimer = setTimeout(function () {
      ui.propMessage = null;
      render();
    }, 2500);
  }

  function onOpenNpc(id) {
    ui.selectedNpc = id;
    render();
  }

  function onCloseNpc() {
    ui.selectedNpc = null;
    render();
  }

  function onTab(id) {
    ui.mobileTab = (ui.mobileTab === id) ? null : id;
    render();
  }

  function onRestart() {
    initializeGame();
    ui.showSplash = true;
    ui.splashStep = 0;
    ui.mobileTab = null;
    ui.selectedNpc = null;
    ui.gardenMessage = null;
    ui.propMessage = null;
    ui.notification = null;
    render();
  }

  // ===== 渲染：各面板 HTML 片段 =====
  function renderDashboard() {
    var html = '<div class="card">';
    if (state.weeklyModifier) {
      html += '<div class="modifier-box">' +
        '<span class="modifier-icon">' + state.weeklyModifier.icon + '</span>' +
        '<div><div class="modifier-name">' + esc(state.weeklyModifier.name) + '</div>' +
        '<p class="modifier-desc">' + esc(state.weeklyModifier.description) + '</p></div>' +
        '</div>';
    }
    for (var i = 0; i < STAT_KEYS.length; i++) {
      var key = STAT_KEYS[i];
      var cfg = STAT_LABELS[key];
      var value = state.stats[key];
      var width = Math.min(value, 100);
      html += '<div class="stat-row">' +
        '<div class="stat-row-head">' +
        '<span class="stat-row-label"><span class="stat-icon">' + cfg.icon + '</span>' + esc(cfg.name) + '</span>' +
        '<span class="stat-row-value">' + value + '</span>' +
        '</div>' +
        '<div class="stat-bar-wrap"><div class="stat-bar" style="width:' + width + '%;background-color:' + cfg.color + ';"></div></div>' +
        '</div>';
    }
    html += '<div class="day-progress">' +
      '<span>第 ' + state.day + ' / ' + CONFIG.TOTAL_DAYS + ' 天</span>' +
      '<span>第 ' + state.week + ' / ' + CONFIG.TOTAL_WEEKS + ' 周</span>' +
      '</div>';
    var conqueredGoal = conqueredCount(state);
    var supportGoal = calculateSupport(state);
    var goalPct = Math.min(Math.round(supportGoal / 65 * 100), 100);
    html += '<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid #F0E8DD;">' +
      '<div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#8B7355;">' +
      '<span style="font-weight:600;">通关目标</span>' +
      '<span>已攻略 ' + conqueredGoal + '/2 · 支持率 ' + supportGoal + '/65</span>' +
      '</div>' +
      '<div style="margin-top:0.4rem;height:0.4rem;background:#F0E8DD;border-radius:999px;overflow:hidden;">' +
      '<div style="height:100%;border-radius:999px;background:#7CB518;width:' + goalPct + '%;"></div>' +
      '</div>' +
      '<p style="font-size:0.7rem;color:#C4B8A8;margin-top:0.25rem;">推动禁烟：攻略 2 位同事，支持率 ≥65</p>' +
      '</div>';
    html += '</div>';
    return html;
  }

  function npcRowHtml(id) {
    var npc = state.npcs[id];
    var avatarBg = hexToRgba(npc.portraitColor, 0.09);
    var valueColor = getAffinityColor(npc.isConquered, npc.affinity);
    var letter = npc.name.charAt(0);

    var rightHtml;
    if (id === 'zhou' && state.activeFlags.indexOf('zhou_fired') !== -1) {
      rightHtml = '<div class="npc-value" style="color:#C46B5D;">已离职</div>';
    } else if (npc.isConquered) {
      rightHtml = '<div class="npc-value" style="color:#8B7355;">✓ 已攻略</div>';
    } else {
      rightHtml = '<div class="npc-value" style="color:' + valueColor + ';">' + npc.affinity + '</div>';
      if (MAIN_NPC_ORDER.indexOf(id) !== -1) {
        rightHtml += '<div class="npc-path">影响力 ' + npc.prestigePath + '/' + CONFIG.CONQUEST_THRESHOLD + ' · 人缘 ' + npc.popularityPath + '/' + CONFIG.CONQUEST_THRESHOLD + '</div>';
      }
    }

    return '<button class="npc-row" data-action="npc-open" data-npc="' + id + '">' +
      '<div class="npc-left">' +
      '<div class="npc-avatar" style="background-color:' + avatarBg + ';color:' + npc.portraitColor + ';">' + esc(letter) + '</div>' +
      '<div><div class="npc-name">' + esc(npc.nickname) + '</div><div class="npc-role">' + esc(npc.title) + '</div></div>' +
      '</div>' +
      '<div class="npc-right">' + rightHtml + '</div>' +
      '</button>';
  }

  function npcModalHtml(id) {
    var npc = state.npcs[id];
    var bio = NPC_BIOS[id];
    var avatarBg = hexToRgba(npc.portraitColor, 0.09);
    var valueColor = getAffinityColor(npc.isConquered, npc.affinity);
    var valueText = npc.isConquered ? '已攻略' : '好感 ' + npc.affinity;

    var html = '<div class="modal-backdrop" data-action="close-npc">';
    html += '<div class="modal" data-action="noop">';
    html += '<div class="modal-head">';
    html += '<div class="modal-avatar" style="background-color:' + avatarBg + ';color:' + npc.portraitColor + ';">' + esc(npc.name.charAt(0)) + '</div>';
    html += '<div><div class="modal-name">' + esc(npc.name) + '</div><div class="modal-role">' + esc(npc.nickname) + ' · ' + esc(npc.title) + '</div></div>';
    html += '<div class="modal-value" style="color:' + valueColor + ';">' + esc(valueText) + '</div>';
    html += '</div>';
    html += '<div class="modal-persona">' + esc(bio.persona || '') + '</div>';
    html += '<p class="modal-intro">' + esc(bio.intro) + '</p>';
    if (bio.quote) {
      html += '<div class="modal-quote"><p>"' + esc(bio.quote) + '"</p></div>';
    }
    html += '<button class="modal-close" data-action="close-npc">收起</button>';
    html += '</div></div>';
    return html;
  }

  function renderNpcStatus() {
    var html = '<div class="card">';
    html += '<h3 class="panel-title">同事关系</h3>';
    for (var i = 0; i < MAIN_NPC_ORDER.length; i++) {
      html += npcRowHtml(MAIN_NPC_ORDER[i]);
    }
    html += '<div class="npc-divider"></div>';
    html += npcRowHtml('zhou');
    html += npcRowHtml('zhao');
    html += '</div>';
    if (ui.selectedNpc) html += npcModalHtml(ui.selectedNpc);
    return html;
  }

  function gardenPlotHtml(index) {
    var plot = state.garden.plots[index];
    if (!plot || !plot.plant) {
      var html = '<div class="garden-plot">' +
        '<div class="garden-plot-label">空花盆 · 种点什么</div>' +
        '<div class="garden-seeds">';
      for (var i = 0; i < PLANTS.length; i++) {
        var p = PLANTS[i];
        html += '<button class="garden-seed" data-action="plant" data-plot="' + index + '" data-plant="' + p.id + '">' +
          '<span class="garden-seed-icon">' + p.svg + '</span>' +
          '<span class="garden-seed-name">' + esc(p.name) + '</span>' +
          '<span class="garden-seed-meta">' + p.daysToGrow + '天 · ' + esc(effectText(p.harvest)) + '</span>' +
          '</button>';
      }
      html += '</div></div>';
      return html;
    }

    var plantDef = findPlant(plot.plant);
    var ready = state.day - plot.plantedDay >= plantDef.daysToGrow;
    var remaining = plantDef.daysToGrow - (state.day - plot.plantedDay);
    var progress = ready ? 100 : Math.min(100, Math.round((state.day - plot.plantedDay) / plantDef.daysToGrow * 100));

    var html = '<div class="garden-plot">';
    html += '<div class="garden-row">' +
      '<span class="garden-flower' + (ready ? '' : ' dim') + '">' + plantDef.svg + '</span>' +
      '<div class="garden-info">' +
      '<div class="garden-plot-head">' +
      '<span class="garden-plot-name">' + esc(plantDef.name) + '</span>' +
      '<span class="garden-plot-state">' + (ready ? '盛开 · 可收成' : '还需 ' + remaining + ' 天') + '</span>' +
      '</div>' +
      '<div class="garden-desc">' + esc(plantDef.desc) + '</div>';
    if (!ready) {
      html += '<div class="garden-progress"><div class="garden-progress-bar" style="width:' + progress + '%;"></div></div>';
    } else {
      html += '<button class="garden-harvest" data-action="harvest" data-plot="' + index + '">收成 · ' + esc(effectText(plantDef.harvest)) + '</button>';
    }
    html += '</div></div></div>';
    return html;
  }

  function renderGarden() {
    var html = '<div class="card">';
    html += '<div class="garden-title-row">' +
      '<h3 class="panel-title">精神后花园</h3>' +
      '<span class="garden-harvested">已收成 ' + state.garden.harvested + ' 次</span>' +
      '</div>';
    html += '<p class="garden-subtitle">种下花籽，几日盛开。收成可补气养神，偶尔还会遇见故人。</p>';
    for (var i = 0; i < state.garden.plots.length; i++) {
      html += gardenPlotHtml(i);
    }
    html += '<div class="garden-feedback' + (ui.gardenMessage ? ' ok' : '') + '">';
    if (ui.gardenMessage) {
      html += esc(ui.gardenMessage);
    } else {
      html += '空盆即种 · 花开即收 · 细水长流';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function propCardHtml(prop, owned, equipped) {
    var cls = 'prop-button';
    if (equipped) cls += ' equipped';
    if (!owned) cls += ' locked';

    var html = '<button class="' + cls + '" data-action="equip" data-prop="' + prop.id + '"' + (owned ? '' : ' disabled') + '>';
    if (!owned) {
      html += '<span class="prop-lock">🔒</span>';
    }
    if (equipped) {
      html += '<span class="prop-equip-badge">✓</span>';
    }
    html += '<span class="prop-icon' + (owned ? '' : ' grayscale') + '">' + prop.icon + '</span>';
    html += '<span class="prop-name">' + esc(prop.name) + '</span>';
    html += '<span class="prop-desc">' + esc(prop.description.slice(0, 12)) + '...</span>';
    if (equipped) {
      html += '<span class="prop-status equipped">● 装备中</span>';
    } else if (owned) {
      html += '<span class="prop-status available">点击装备</span>';
    } else {
      html += '<span class="prop-status locked">尚未获得</span>';
    }
    html += '</button>';
    return html;
  }

  function renderPropPanel() {
    var currentProp = state.equippedProp ? findProp(state.equippedProp) : null;

    var html = '<div class="card">';
    html += '<div class="prop-head">';
    html += '<h3 class="panel-title" style="margin-bottom:0;">防身利器</h3>';
    if (currentProp) {
      html += '<span class="prop-equipped-badge">' + currentProp.icon + ' 防护 ' + currentProp.protection + '/天</span>';
    }
    html += '</div>';

    html += '<div class="prop-grid">';
    for (var i = 0; i < PROP_DEFS.length; i++) {
      var prop = PROP_DEFS[i];
      var owned = state.inventory[prop.id];
      var equipped = state.equippedProp === prop.id;
      html += propCardHtml(prop, owned, equipped);
    }
    html += '</div>';

    var min = currentProp ? Math.max(0, 3 - currentProp.protection) : 3;
    var max = currentProp ? Math.max(0, 6 - currentProp.protection) : 6;
    var drainText = (min === max) ? '-' + min : '-' + min + ' ~ -' + max;
    var drainCls;
    if (state.stats.health < 30) drainCls = 'bad';
    else if (state.stats.health < 60) drainCls = 'mid';
    else drainCls = 'good';

    html += '<div class="prop-drain">';
    html += '<div class="prop-drain-head">' +
      '<span>今日健康衰减估算</span>' +
      '<span class="prop-drain-value ' + drainCls + '">' + drainText + '</span>' +
      '</div>';
    if (ui.propMessage) {
      html += '<p class="prop-feedback">' + esc(ui.propMessage) + '</p>';
    } else if (state.equippedProp) {
      html += '<p class="prop-hint">' + esc(currentProp.description) + '</p>';
    } else {
      html += '<p class="prop-hint">选择已获得的道具装备，降低每日健康衰减</p>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function panelContentHtml(id) {
    if (id === 'dashboard') return renderDashboard();
    if (id === 'npcs') return renderNpcStatus();
    if (id === 'garden') return renderGarden();
    if (id === 'props') return renderPropPanel();
    return '';
  }

  function mobilePanelsHtml() {
    var tabs = [
      { id: 'dashboard', icon: '📊' },
      { id: 'npcs', icon: '👥' },
      { id: 'garden', icon: '🌸' },
      { id: 'props', icon: '🛡️' }
    ];
    var html = '<div class="mobile-tabs">';
    for (var i = 0; i < tabs.length; i++) {
      var active = (ui.mobileTab === tabs[i].id) ? ' active' : '';
      html += '<button class="mobile-tab' + active + '" data-action="tab" data-tab="' + tabs[i].id + '">' + tabs[i].icon + '</button>';
    }
    html += '</div>';
    html += '<div class="mobile-panel' + (ui.mobileTab ? ' open' : '') + '">';
    html += panelContentHtml(ui.mobileTab);
    html += '</div>';
    return html;
  }

  function desktopPanelsHtml() {
    return '<div class="desktop-panels">' +
      '<div class="animate-fade-in">' + renderDashboard() + '</div>' +
      '<div class="animate-fade-in">' + renderNpcStatus() + '</div>' +
      '<div class="animate-fade-in">' + renderGarden() + '</div>' +
      '<div class="animate-fade-in">' + renderPropPanel() + '</div>' +
      '</div>';
  }

  function eventCardHtml(event) {
    var html = '<div class="event-card">';
    html += '<div class="event-meta">' +
      '<span class="week-label">' + esc(WEEK_NAMES[event.week]) + '</span>' +
      '<span class="sep">·</span>' +
      '<span>第 ' + event.day + ' 天</span>' +
      '<span class="sep">·</span>' +
      '<span>' + esc(PHASE_MAP[event.phase] || event.phase) + '</span>' +
      '</div>';
    html += '<h2 class="event-title">' + esc(event.title) + '</h2>';
    html += '<p class="event-desc">' + esc(event.description) + '</p>';
    html += '<div class="choice-list">';
    for (var i = 0; i < event.choices.length; i++) {
      var c = event.choices[i];
      html += '<button class="choice-button" data-action="choose" data-event="' + esc(event.id) + '" data-choice="' + esc(c.id) + '">' + esc(c.text) + '</button>';
    }
    html += '</div></div>';
    return html;
  }

  function noEventHtml() {
    return '<div class="event-card text-center" style="padding-top:2.5rem;padding-bottom:2.5rem;">' +
      '<h2 class="event-title">今日无事，岁月静好</h2>' +
      '<p class="event-desc">除了工作，没什么特别的事发生。休息一下也是必要的。</p>' +
      '<button class="btn-primary" data-action="skip-day">下一天</button>' +
      '</div>';
  }

  function gameHtml() {
    var event = currentEvent();
    var html = '<div class="game-container">';
    html += '<header class="game-header">' +
      '<h1 class="game-title">林则徐 · 都市销烟录</h1>' +
      '<p class="game-subtitle">28天 · 决定一家公司的命运</p>' +
      '</header>';
    html += '<div class="main-grid">';
    html += '<section class="event-col"><div class="animate-fade-in">' +
      (event ? eventCardHtml(event) : noEventHtml()) +
      '</div></section>';
    html += '<aside class="aside-col">' +
      mobilePanelsHtml() +
      desktopPanelsHtml() +
      '</aside>';
    html += '</div>';
    html += '<footer class="game-footer">刚者易折，柔者难立。唯有刚柔并济，方能销烟革新。</footer>';
    html += '</div>';
    return html;
  }

  function splashHtml() {
    if (ui.splashStep === 0) {
      return '<div class="splash">' +
        '<div class="splash-inner animate-fade-in">' +
        '<h1 class="splash-title">林则徐</h1>' +
        '<p class="splash-subtitle">都市销烟录</p>' +
        '<p class="splash-tagline">刚者易折，柔者难立<br>唯有刚柔并济，方能销烟革新</p>' +
        '<button class="btn-primary" data-action="start-splash">开始游戏</button>' +
        '</div></div>';
    }
    var html = '<div class="splash">';
    html += '<div class="splash-inner animate-fade-in">';
    html += '<p class="splash-prologue">序</p>';
    html += '<div class="splash-narrative">';
    html += '<p>我姓林，一家不大不小的公司里一个不起眼的白领。</p>';
    html += '<p>每天挤地铁打卡，坐在格子间里写文档、开周会、凑绩效。隔壁工位的同事一根接一根地抽烟，会议室里永远飘着灰蒙蒙的雾——二手烟熏得我眼睛发酸、胸口发闷，可大家都是这么过的。</p>';
    html += '<p>直到那天晚上，我做了一个很长很长的梦。</p>';
    html += '<p>梦里有个穿朝服的人站在虎门海滩上，身后是一箱箱被砸碎的鸦片，海风把他的袍角吹得猎猎作响。他转过身来，我透过那张脸看到了和我一模一样的灵魂。</p>';
    html += '<p>醒来之后我就知道，有些事不能再等了。</p>';
    html += '<p>四周后就是公司年终大会。我要在那之前，从我身边做起，把这片灰色的雾赶出去。不是为了什么伟大的理想——只是觉得，<strong>上辈子做过的事，这辈子没道理袖手旁观。</strong></p>';
    html += '</div>';
    html += '<button class="btn-primary" data-action="enter-game">进入游戏</button>';
    html += '</div></div>';
    return html;
  }

  function endingHtml() {
    var endingType = determineEnding(state);
    var ending = ENDINGS[endingType];
    var supportPct = Math.floor(state.stats.prestige * 0.25 + state.stats.popularity * 0.25 + 20);
    var conquered = conqueredCount(state);
    var paras = ending.description.split('\n\n');

    var html = '<div class="ending-screen">';
    html += '<div class="ending-inner">';
    html += '<div class="ending-head">' +
      '<h1 class="ending-title">' + esc(ending.title) + '</h1>' +
      '<p class="ending-subtitle">' + esc(ending.subtitle) + '</p>' +
      '</div>';
    html += '<div class="ending-card">';
    for (var i = 0; i < paras.length; i++) {
      html += '<p>' + esc(paras[i]) + '</p>';
    }
    html += '</div>';
    html += '<div class="ending-stats">' +
      '<div class="ending-stat"><div class="num">' + supportPct + '%</div><div class="label">最终支持率</div></div>' +
      '<div class="ending-stat"><div class="num">' + conquered + '/3</div><div class="label">攻略同事</div></div>' +
      '<div class="ending-stat"><div class="num">' + state.activeFlags.length + '</div><div class="label">蝴蝶效应</div></div>' +
      '</div>';
    html += '<div class="ending-restart"><button class="btn-primary" data-action="restart">开始新游戏</button></div>';
    html += '</div></div>';
    return html;
  }

  function loadingHtml() {
    return '<div class="loader-wrap"><div><div class="loader"></div><p class="loader-text">加载中...</p></div></div>';
  }

  function toastHtml(notification) {
    return '<div class="toast-inner">' +
      '<span class="toast-icon">' + notification.icon + '</span>' +
      '<div>' +
      '<p class="toast-title">' + esc(notification.title) + '</p>' +
      '<p class="toast-msg">' + esc(notification.message) + '</p>' +
      '</div>' +
      '</div>';
  }

  // ===== 顶层渲染 =====
  function render() {
    if (!appEl) return;
    if (!state) {
      appEl.innerHTML = loadingHtml();
      renderToast();
      return;
    }
    if (state.gameOver) {
      appEl.innerHTML = endingHtml();
      renderToast();
      return;
    }
    if (ui.showSplash) {
      appEl.innerHTML = splashHtml();
      renderToast();
      return;
    }
    appEl.innerHTML = gameHtml();
    renderToast();
  }

  function renderToast() {
    if (!toastEl) return;
    if (ui.notification) {
      toastEl.innerHTML = toastHtml(ui.notification);
      toastEl.className = 'toast show';
    } else {
      toastEl.className = 'toast';
    }
  }

  // ===== 事件委托 =====
  function handleAction(action, el) {
    switch (action) {
      case 'start-splash':
        ui.splashStep = 1;
        render();
        break;
      case 'enter-game':
        ui.showSplash = false;
        render();
        break;
      case 'choose':
        onChoose(el.getAttribute('data-choice'), el.getAttribute('data-event'));
        break;
      case 'skip-day':
        nextDay();
        saveState();
        render();
        break;
      case 'plant':
        onPlant(parseInt(el.getAttribute('data-plot'), 10), el.getAttribute('data-plant'));
        break;
      case 'harvest':
        onHarvest(parseInt(el.getAttribute('data-plot'), 10));
        break;
      case 'equip':
        onToggleProp(el.getAttribute('data-prop'));
        break;
      case 'npc-open':
        onOpenNpc(el.getAttribute('data-npc'));
        break;
      case 'close-npc':
        onCloseNpc();
        break;
      case 'tab':
        onTab(el.getAttribute('data-tab'));
        break;
      case 'restart':
        onRestart();
        break;
      case 'noop':
        break;
    }
  }

  document.addEventListener('click', function (e) {
    var node = e.target;
    while (node && node !== document) {
      if (node.getAttribute && node.hasAttribute('data-action')) {
        var action = node.getAttribute('data-action');
        if (action === 'noop') return; // 阻止冒泡到遮罩层
        handleAction(action, node);
        return;
      }
      node = node.parentNode;
    }
  });

  // ===== 启动 =====
  function boot() {
    appEl = document.getElementById('app');
    toastEl = document.getElementById('toast');
    var saved = loadState();
    if (saved) {
      state = saved;
    } else {
      initializeGame();
    }
    ui.showSplash = true;
    ui.splashStep = 0;
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
