#!/usr/bin/env node
// 把 src/ 拼成单文件 index.html。
//   node tools/build.mjs              生成 index.html
//   node tools/build.mjs --check      只校验（CI 用），产物不一致或有问题时退出 1
//   node tools/build.mjs --rename A=B 正文中文名 A 全量改为 B，并同步 src/names.js
//   node tools/build.mjs --verbose    额外打印译名覆盖率提示
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { NAMES } from "../src/names.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHELL = join(ROOT, "src/shell.html");
const GAMES_DIR = join(ROOT, "src/games");
const NAMES_PATH = join(ROOT, "src/names.js");
const OUT = join(ROOT, "index.html");
const PLACEHOLDER = "/* __GAMES__ */";
const JP = (n) => `<i class='jp'>${n}</i>`;

const args = process.argv.slice(2);
const has = (f) => args.includes(f);

function gameFiles() {
  return readdirSync(GAMES_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort()
    .map((f) => join(GAMES_DIR, f));
}

function readGame(path) {
  const src = readFileSync(path, "utf8");
  const m = src.match(/^export default\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!m) throw new Error(`${path}: 需要以 "export default { ... }" 形式导出`);
  return { path, body: m[1] };
}

// 结构校验：章节 id 必须是 <字母><序号> 且从 1 连续，n 与顺序一致、不重复
function validate(name, body, problems) {
  const chapters = [...body.matchAll(/\{id:"([a-z]\d+)",n:(\d+)/g)].map((m) => ({ id: m[1], n: +m[2] }));
  if (!chapters.length) return;
  const prefix = chapters[0].id[0];
  chapters.forEach((c, i) => {
    if (c.id !== `${prefix}${i + 1}`) problems.push(`${name}: 章节 id 不连续 —— 第 ${i + 1} 个是 ${c.id}`);
    if (c.n !== i + 1) problems.push(`${name}: ${c.id} 的 n=${c.n}，应为 ${i + 1}`);
  });
  chapters.map((c) => c.id).forEach((id, i, all) => {
    if (all.indexOf(id) !== i) problems.push(`${name}: 章节 id 重复 —— ${id}`);
  });
  if (/<i class='jp'>$/.test(body)) problems.push(`${name}: 存在未闭合的 <i class='jp'>`);
}

// 译名校验：配对写法「中文（<i class='jp'>日文</i>）」里的中文必须以 names.js 的译名结尾
function nameIssues(body, verbose) {
  const issues = [];
  const notes = [];
  for (const [jp, cn] of Object.entries(NAMES)) {
    const tag = JP(jp);
    let idx = 0, paired = 0, bare = 0;
    while ((idx = body.indexOf(tag, idx)) !== -1) {
      const before = body.slice(Math.max(0, idx - 60), idx);
      if (before.endsWith("（")) {
        const plain = before.slice(0, -1).replace(/<[^>]*>/g, "");
        const tail = (plain.match(/[\u4e00-\u9fff]{1,12}$/) || [""])[0];
        if (tail.endsWith(cn)) paired++;
        else issues.push(`译名不一致：${jp} 前的中文是「${tail || "空"}」，names.js 里是「${cn}」`);
      } else bare++;
      idx += tag.length;
    }
    if (bare) notes.push(`${jp} 有 ${bare} 处不是「中文（日文）」配对写法`);
    if (!paired && !bare) notes.push(`${jp} 在正文中未出现，names.js 可清理`);
  }
  if (verbose) notes.forEach((n) => console.log("提示：" + n));
  return issues;
}

function rename(oldCn, newCn) {
  let hits = 0;
  for (const p of gameFiles()) {
    const src = readFileSync(p, "utf8");
    const next = src.split(oldCn).join(newCn);
    if (next !== src) {
      hits += src.split(oldCn).length - 1;
      writeFileSync(p, next);
    }
  }
  let namesSrc = readFileSync(NAMES_PATH, "utf8");
  for (const [jp, cn] of Object.entries(NAMES)) {
    if (cn === oldCn) {
      namesSrc = namesSrc.replace(`"${jp}": "${oldCn}"`, `"${jp}": "${newCn}"`);
      console.log(`names.js：${jp} → ${newCn}`);
    }
  }
  writeFileSync(NAMES_PATH, namesSrc);
  console.log(`--rename：正文替换 ${hits} 处「${oldCn}」→「${newCn}」`);
}

function build() {
  const problems = [];
  const files = gameFiles();
  if (!files.length) throw new Error("src/games/ 下没有游戏文件");

  const bodies = files.map((f) => {
    const g = readGame(f);
    validate(f.slice(ROOT.length + 1), g.body, problems);
    return g.body;
  });

  const data = bodies.join(",\n");
  const shell = readFileSync(SHELL, "utf8");
  if (!shell.includes(PLACEHOLDER)) throw new Error(`src/shell.html 缺少占位符 ${PLACEHOLDER}`);
  const html = shell.replace(PLACEHOLDER, () => data);

  problems.push(...nameIssues(data, has("--verbose")));
  if (/<(?:script|img|link|iframe)[^>]+(?:src|href)="https?:/i.test(html))
    problems.push("产物里出现外链资源，违反零外链约束");

  return { html, problems, games: files.length };
}

const renameArg = args.find((a) => a.startsWith("--rename"));
if (renameArg) {
  const raw = renameArg.includes("=") ? renameArg.slice(renameArg.indexOf("=") + 1) : args[args.indexOf(renameArg) + 1];
  const parts = (raw || "").split("=");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    console.error("用法：node tools/build.mjs --rename 旧译名=新译名");
    process.exit(2);
  }
  rename(parts[0], parts[1]);
  process.exit(0);
}

const { html, problems, games } = build();
problems.forEach((p) => console.error(p));
const bytes = Buffer.byteLength(html);

if (has("--check")) {
  let current = "";
  try {
    current = readFileSync(OUT, "utf8");
  } catch {}
  const drift = current !== html;
  if (drift) console.error("index.html 与 src/ 不一致：跑 `node tools/build.mjs` 重新生成");
  const fail = problems.length > 0 || drift;
  console.log(`${fail ? "✗" : "✓"} check：${games} 个游戏，${bytes} 字节，问题 ${problems.length} 条，漂移 ${drift ? "有" : "无"}`);
  process.exit(fail ? 1 : 0);
}

if (problems.length) {
  console.error(`✗ 构建中止：${problems.length} 条问题`);
  process.exit(1);
}
writeFileSync(OUT, html);
console.log(`✓ 生成 index.html：${games} 个游戏，${bytes} 字节`);
