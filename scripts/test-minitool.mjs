// 最小运行时测试：在 Node 中模拟 window/document/localStorage，跑通小工具整局游戏，
// 用于捕获运行时错误与逻辑死循环。仅供本地校验，不参与打包。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const minitool = path.join(root, "minitool");

const appEl = { innerHTML: "", className: "" };
const toastEl = { innerHTML: "", className: "" };
const handlers = {};

globalThis.window = {};
globalThis.document = {
  readyState: "complete",
  getElementById(id) {
    return id === "app" ? appEl : id === "toast" ? toastEl : null;
  },
  addEventListener(type, fn) {
    handlers[type] = fn;
  },
};

const store = new Map();
globalThis.localStorage = {
  getItem(k) {
    return store.has(k) ? store.get(k) : null;
  },
  setItem(k, v) {
    store.set(k, String(v));
  },
  removeItem(k) {
    store.delete(k);
  },
};

for (const f of ["data.js", "events.js", "main.js"]) {
  const code = fs.readFileSync(path.join(minitool, f), "utf8");
  new Function(code)();
}

function el(attrs) {
  return {
    getAttribute(name) {
      return attrs[name] !== undefined ? attrs[name] : null;
    },
    hasAttribute(name) {
      return attrs[name] !== undefined;
    },
    parentNode: null,
  };
}

function click(attrs) {
  if (!handlers.click) throw new Error("click handler not registered");
  handlers.click({ target: el(attrs) });
}

let error = null;
try {
  // 启动后应显示开场画面
  if (appEl.innerHTML.indexOf("林则徐") === -1) {
    throw new Error("启动后未渲染开场画面");
  }
  console.log("✓ 开场画面渲染正常");

  // 进入序章
  click({ "data-action": "start-splash" });
  if (appEl.innerHTML.indexOf("序") === -1) {
    throw new Error("进入序章失败");
  }
  console.log("✓ 序章渲染正常");

  // 进入游戏
  click({ "data-action": "enter-game" });
  if (appEl.innerHTML.indexOf("第 1 天") === -1 && appEl.innerHTML.indexOf("今日无事") === -1) {
    throw new Error("进入游戏主界面失败");
  }
  console.log("✓ 进入游戏主界面");

  // 循环跑完整局
  let steps = 0;
  while (steps < 5000) {
    const html = appEl.innerHTML;

    // 回归守卫：不应再出现「一天结束」插页
    if (html.indexOf("这一天结束了") !== -1) {
      throw new Error("出现不应有的「一天结束」插页");
    }

    if (html.indexOf("ending-screen") !== -1 || html.indexOf("开始新游戏") !== -1) {
      console.log("✓ 到达结局画面，共经历 " + steps + " 步");
      break;
    }

    // 优先点击选项
    const choiceRe = /data-action="choose" data-event="([^"]+)" data-choice="([^"]+)"/;
    const choiceMatch = html.match(choiceRe);
    if (choiceMatch) {
      click({
        "data-action": "choose",
        "data-event": choiceMatch[1],
        "data-choice": choiceMatch[2],
      });
      steps++;
      continue;
    }

    // 无事件时点「下一天」
    if (html.indexOf('data-action="skip-day"') !== -1) {
      click({ "data-action": "skip-day" });
      steps++;
      continue;
    }

    throw new Error("无法推进游戏，HTML 缺少可点击动作\n" + html.slice(0, 500));
  }

  if (steps >= 5000) {
    throw new Error("游戏循环超过 5000 步仍未结束，可能存在死循环");
  }

  // 检查存档已写入
  if (!store.has("linzexu-game-storage")) {
    throw new Error("游戏过程中未写入存档");
  }
  console.log("✓ 存档已写入（" + store.get("linzexu-game-storage").length + " 字符）");
} catch (e) {
  error = e;
}

if (error) {
  console.error("✗ 测试失败：" + error.message);
  console.error(error.stack);
  process.exit(1);
} else {
  console.log("全部通过 ✓");
}
