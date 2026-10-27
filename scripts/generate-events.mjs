// 从 data/events/*.json 生成 minitool/events.js（纯静态 JS，无需运行于小工具内）。
// 用法：node scripts/generate-events.mjs  （在项目根目录执行）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "minitool");

const weeks = ["week1", "week2", "week3", "week4"];
const all = [];
for (const name of weeks) {
  const file = path.join(root, "data", "events", name + ".json");
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  const week = doc.week;
  for (const event of doc.events) {
    // 与 data/events/index.ts 的 addWeek 一致：给每个事件补上 week 字段
    all.push(Object.assign({}, event, { week }));
  }
}

const js = "// 由 scripts/generate-events.mjs 自动生成，请勿手改。\nwindow.EVENTS = " + JSON.stringify(all) + ";\n";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "events.js"), js, "utf8");
console.log("Wrote " + all.length + " events -> " + path.join(outDir, "events.js"));
