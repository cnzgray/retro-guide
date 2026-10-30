#!/usr/bin/env node
// 把 src/ 拼成单文件 index.html。
//   node tools/build.mjs              生成 index.html
//   node tools/build.mjs --check      只校验（CI 用），产物不一致或有问题时退出 1
//   node tools/build.mjs --rename A=B --game <id>  把该游戏的中文名 A 改为 B，同步 src/names.js 与进度快照
//   node tools/build.mjs --lock       确认进度键变更，更新 src/progress.lock.json（章节 id 只增不删）
//   node tools/build.mjs --verbose    额外打印译名覆盖率与存疑清单
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { basename, join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { NAMES } from "../src/names.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHELL = join(ROOT, "src/shell.html");
const GAMES_DIR = join(ROOT, "src/games");
const NAMES_PATH = join(ROOT, "src/names.js");
const LOCK_PATH = join(ROOT, "src/progress.lock.json");
const LICENSE_PATH = join(ROOT, "LICENSE-CONTENT.md");
const OUT = join(ROOT, "index.html");
const PLACEHOLDER = "/* __GAMES__ */";
// 用 body 默认主题的游戏，不需要 data-game 主题块
const DEFAULT_GAME = "minish";
const JP = (n) => `<i class='jp'>${n}</i>`;

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const fail = (m) => { console.error(m); process.exit(2); };
const isStr = (v) => typeof v === "string" && v.trim() !== "";
const isStrArr = (v) => Array.isArray(v) && v.every(isStr);

function walkStrings(value, path, visit) {
  if (typeof value === "string") visit(value, path);
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walkStrings(v, `${path}.${k}`, visit);
  }
}

function gameFiles() {
  return readdirSync(GAMES_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort()
    .map((f) => join(GAMES_DIR, f));
}

async function readGame(path) {
  const src = readFileSync(path, "utf8");
  const m = src.match(/^export default\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!m) throw new Error(`${path}: 需要以 "export default { ... }" 形式导出`);
  try {
    return { path, body: m[1], data: (await import(pathToFileURL(path).href)).default };
  } catch (e) {
    throw new Error(`${path}: 数据无法解析 —— ${e.message}`);
  }
}

// 结构校验：读真实数据而不是匹配源码文本。id 只要求唯一且前缀一致（进度键不随顺序变），n 负责显示顺序
function validate(name, g, problems) {
  const bad = (m) => problems.push(`${name}: ${m}`);
  for (const k of ["id", "title", "sub", "short", "tabs"]) if (!isStr(g[k])) bad(`缺少字段 ${k}`);
  if (g.id !== basename(name, ".js")) bad(`id=${g.id} 与文件名不一致`);
  if (!Number.isInteger(g.order)) bad("order 必须是整数（标签页顺序）");
  if (!/^#[0-9a-f]{6}$/i.test(g.accent)) bad("accent 必须是 #rrggbb（标签圆点色）");
  for (const k of ["metas", "intro", "sources"]) if (!isStrArr(g[k]) || !g[k].length) bad(`${k} 必须是非空字符串数组`);
  if (g.unverified !== undefined && !isStrArr(g.unverified)) bad("unverified 必须是字符串数组");
  for (const k of ["chapters", "qa", "checks", "bosses"]) {
    if (!Array.isArray(g[k])) return bad(`${k} 必须是数组`);
  }
  if (!g.chapters.length) bad("chapters 不能为空");

  const prefix = String(g.chapters[0]?.id)[0];
  const seen = new Set();
  g.chapters.forEach((c, i) => {
    const at = `${c.id ?? `第 ${i + 1} 章`}`;
    if (!/^[a-z]\d+$/.test(c.id)) bad(`${at}: id 必须是 <字母><数字>`);
    else if (c.id[0] !== prefix) bad(`${at}: id 前缀应为 ${prefix}`);
    if (seen.has(c.id)) bad(`章节 id 重复 —— ${c.id}`);
    seen.add(c.id);
    if (c.n !== i + 1) bad(`${at}: n=${c.n}，应为 ${i + 1}`);
    for (const k of ["title", "area", "goal"]) if (!isStr(c[k])) bad(`${at}: 缺少字段 ${k}`);
    if (!isStrArr(c.steps) || !c.steps.length) bad(`${at}: steps 必须是非空字符串数组`);
    if (!isStrArr(c.items)) bad(`${at}: items 必须是字符串数组`);
    if (c.warn !== undefined && !isStrArr(c.warn)) bad(`${at}: warn 必须是字符串数组`);
    if (c.tip !== undefined && !isStr(c.tip)) bad(`${at}: tip 必须是字符串`);
    if (c.boss !== undefined && !(isStr(c.boss?.name) && isStr(c.boss?.tip))) bad(`${at}: boss 需要 name 与 tip`);
  });
  g.qa.forEach((q, i) => { if (!isStr(q.q) || !isStr(q.a)) bad(`qa[${i}] 需要 q 与 a`); });
  g.checks.forEach((c, i) => { if (!isStr(c.t) || !isStrArr(c.items)) bad(`checks[${i}] 需要 t 与 items`); });
  g.bosses.forEach((b, i) => { if (!isStr(b.n) || !isStr(b.s) || !isStr(b.t)) bad(`bosses[${i}] 需要 n、s、t`); });

  // 这些字段渲染时走 esc()，写标签会把 HTML 源码直接显示给玩家
  const plain = [g.title, g.short, g.tabs, ...g.chapters.flatMap((c) => [c.title, c.area, ...(c.items || [])]),
    ...g.checks.flatMap((c) => [c.t, ...(c.items || [])]), ...g.qa.map((q) => q.q), ...g.bosses.flatMap((b) => [b.n, b.s])];
  plain.forEach((text) => { if (/<\/?[a-z]/i.test(text)) bad(`转义字段不能写 HTML 标签：${text}`); });

  walkStrings(g, g.id, (text, path) => {
    for (const tag of ["b", "i"]) {
      const open = text.match(new RegExp(`<${tag}[ >]`, "g"))?.length ?? 0;
      const close = text.match(new RegExp(`</${tag}>`, "g"))?.length ?? 0;
      if (open !== close) bad(`${path}: <${tag}> 标签未闭合`);
    }
  });
}

// 新游戏要改的外壳位置：缺一处页面仍能跑，只是主题错，所以由构建兜底
function shellIssues(shell, ids) {
  const issues = [];
  for (const id of ids) {
    if (id !== DEFAULT_GAME && !shell.includes(`body[data-game="${id}"]`)) issues.push(`${id}: src/shell.html 缺少主题 body[data-game="${id}"]`);
  }
  return issues;
}

// 来源署名手写在页脚和许可文件里，这里只保证新游戏不会漏掉
function sourceIssues(shell, games) {
  const footer = shell.slice(shell.indexOf('<footer class="sitefoot">'));
  const license = readFileSync(LICENSE_PATH, "utf8");
  return games.flatMap(({ data: g }) => (g.sources || []).flatMap((s) => [
    ...(footer.includes(s) ? [] : [`${g.id}: 页脚缺少来源署名「${s}」`]),
    ...(license.includes(s) ? [] : [`${g.id}: LICENSE-CONTENT.md 缺少来源署名「${s}」`]),
  ]));
}

function htmlIssues(html) {
  const issues = [];
  if (/(?:src|href|action)\s*=\s*["']?(?:https?:)?\/\/|url\(\s*["']?(?:https?:)?\/\/|@import/i.test(html))
    issues.push("产物里出现外链资源，违反零外链约束");
  if (!/<link rel="icon"[^>]+href="data:image\/svg\+xml,/.test(html)) issues.push("产物缺少内联 favicon");
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  if (!scripts.length) issues.push("产物里没有内联脚本");
  for (const [, code] of scripts) {
    try {
      new vm.Script(code);
    } catch (e) {
      issues.push(`产物内联脚本语法错误：${e.message}`);
    }
  }
  return issues;
}

// 进度键快照：章节进度按 id 存，收集清单按「组序号-项序号」存，两者都不能悄悄错位
function snapshot(games) {
  return Object.fromEntries(games.map(({ data: g }) => [g.id, {
    chapters: Object.fromEntries((g.chapters || []).map((c) => [c.id, { title: c.title, warn: (c.warn || []).length }])),
    checks: (g.checks || []).map((grp) => grp.items || []),
  }]));
}

function lockIssues(lock, next) {
  const gone = [], drift = [];
  for (const [id, was] of Object.entries(lock)) {
    const now = next[id];
    if (!now) { gone.push(`${id}: 整个游戏被移除`); continue; }
    for (const [cid, c] of Object.entries(was.chapters)) {
      const cur = now.chapters[cid];
      if (!cur) { gone.push(`${id}: 章节 id ${cid} 消失，玩家进度会丢`); continue; }
      if (cur.title !== c.title) drift.push(`${id}: ${cid} 标题「${c.title}」→「${cur.title}」，确认没有换成别的章节`);
      if (cur.warn !== c.warn) drift.push(`${id}: ${cid} 的 warn 数 ${c.warn} → ${cur.warn}，确认没有丢时限要素`);
    }
    was.checks.forEach((items, gi) => items.forEach((item, i) => {
      if (now.checks[gi]?.[i] !== item) drift.push(`${id}: 收集项 ${gi}-${i}「${item}」变了，只能追加到组尾，否则玩家勾选错位`);
    }));
    for (const cid of Object.keys(now.chapters)) if (!was.chapters[cid]) drift.push(`${id}: 新章节 ${cid} 未登记`);
    now.checks.forEach((items, gi) => {
      if (items.length > (was.checks[gi]?.length ?? 0)) drift.push(`${id}: 收集清单第 ${gi} 组有新增项未登记`);
    });
  }
  for (const id of Object.keys(next)) if (!lock[id]) drift.push(`${id}: 新游戏未登记`);
  return { gone, drift };
}

// 译名校验：配对写法「中文（<i class='jp'>日文</i>）」里的中文必须以 names.js 的译名结尾
function nameIssues(game, body, verbose) {
  const issues = [];
  const notes = [];
  const names = NAMES[game];
  if (!names) return [`${game}: src/names.js 缺少该游戏的译名表`];
  for (const [jp, cn] of Object.entries(names)) {
    const tag = JP(jp);
    let idx = 0, paired = 0, bare = 0;
    while ((idx = body.indexOf(tag, idx)) !== -1) {
      const before = body.slice(Math.max(0, idx - 60), idx);
      if (before.endsWith("（")) {
        const plain = before.slice(0, -1).replace(/<[^>]*>/g, "");
        const tail = (plain.match(/[\u4e00-\u9fff]{1,12}$/) || [""])[0];
        if (tail.endsWith(cn)) paired++;
        else issues.push(`${game}: 译名不一致：${jp} 前的中文是「${tail || "空"}」，names.js 里是「${cn}」`);
      } else bare++;
      idx += tag.length;
    }
    if (bare) notes.push(`${game}: ${jp} 有 ${bare} 处不是「中文（日文）」配对写法`);
    if (!paired && !bare && !body.includes(cn)) notes.push(`${game}: ${jp} 在正文中未出现，names.js 可清理`);
  }
  if (verbose) notes.forEach((n) => console.log("提示：" + n));
  return issues;
}

// 中文没有词边界：把本作译名表里更长的名字一起匹配并跳过，免得改「雷斯」时碰到「克雷斯」
function replaceName(text, oldCn, newCn, longer) {
  const pattern = new RegExp([...longer, oldCn].join("|"), "g");
  const contexts = [];
  const out = text.replace(pattern, (m, offset) => {
    if (m !== oldCn) return m;
    contexts.push(text.slice(Math.max(0, offset - 6), offset + m.length + 6).replace(/\s+/g, " "));
    return newCn;
  });
  return { out, contexts };
}

function rename(game, oldCn, newCn) {
  const names = NAMES[game];
  const file = join(GAMES_DIR, `${game}.js`);
  if (!names || !existsSync(file)) fail(`没有游戏 ${game}`);
  const taken = Object.values(names).includes(newCn);
  if (taken) fail(`「${newCn}」已是 ${game} 译名表里的其他名字`);
  const longer = Object.values(names).filter((cn) => cn !== oldCn && cn.includes(oldCn)).sort((a, b) => b.length - a.length);

  const { out, contexts } = replaceName(readFileSync(file, "utf8"), oldCn, newCn, longer);
  if (!contexts.length) fail(`${game} 正文里没有「${oldCn}」`);
  writeFileSync(file, out);

  const namesSrc = readFileSync(NAMES_PATH, "utf8");
  const start = namesSrc.indexOf(`  ${game}: {`);
  const end = namesSrc.indexOf("\n  },", start);
  const block = namesSrc.slice(start, end).split(`: "${oldCn}"`).join(`: "${newCn}"`);
  writeFileSync(NAMES_PATH, namesSrc.slice(0, start) + block + namesSrc.slice(end));

  // 改译名不是换内容，进度快照跟着改，免得每次都要 --lock
  if (existsSync(LOCK_PATH)) {
    const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8"));
    if (lock[game]) lock[game] = JSON.parse(replaceName(JSON.stringify(lock[game]), oldCn, newCn, longer).out);
    writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + "\n");
  }
  contexts.slice(0, 5).forEach((c) => console.log(`  …${c}…`));
  console.log(`--rename：${game} 替换 ${contexts.length} 处「${oldCn}」→「${newCn}」`);
}

async function build() {
  const problems = [];
  const files = gameFiles();
  if (!files.length) throw new Error("src/games/ 下没有游戏文件");

  const parsed = await Promise.all(files.map((f) => readGame(f)));
  parsed.forEach((g) => validate(g.path.slice(ROOT.length + 1), g.data, problems));
  const ids = parsed.map((g) => g.data.id);
  ids.forEach((id, i) => { if (ids.indexOf(id) !== i) problems.push(`游戏 id 重复 —— ${id}`); });
  parsed.sort((a, b) => a.data.order - b.data.order);

  const data = parsed.map((g) => g.body).join(",\n");
  const shell = readFileSync(SHELL, "utf8");
  if (!shell.includes(PLACEHOLDER)) throw new Error(`src/shell.html 缺少占位符 ${PLACEHOLDER}`);
  const html = shell.replace(PLACEHOLDER, () => data);

  parsed.forEach((g) => problems.push(...nameIssues(g.data.id, g.body, has("--verbose"))));
  problems.push(...shellIssues(shell, ids), ...sourceIssues(shell, parsed), ...htmlIssues(html));
  if (has("--verbose")) parsed.forEach(({ data: g }) => (g.unverified || []).forEach((u) => console.log(`存疑：${g.id}: ${u}`)));

  const next = snapshot(parsed);
  const lock = existsSync(LOCK_PATH) ? JSON.parse(readFileSync(LOCK_PATH, "utf8")) : null;
  const { gone, drift } = lock ? lockIssues(lock, next) : { gone: [], drift: ["缺少 src/progress.lock.json：跑 `node tools/build.mjs --lock`"] };

  return { html, problems, games: files.length, next, gone, drift };
}

const renameArg = args.find((a) => a.startsWith("--rename"));
if (renameArg) {
  const raw = renameArg.includes("=") ? renameArg.slice(renameArg.indexOf("=") + 1) : args[args.indexOf(renameArg) + 1];
  const parts = (raw || "").split("=");
  const game = has("--game") ? args[args.indexOf("--game") + 1] : "";
  if (parts.length !== 2 || !parts[0] || !parts[1] || !game) fail("用法：node tools/build.mjs --rename 旧译名=新译名 --game <游戏 id>");
  rename(game, parts[0], parts[1]);
  process.exit(0);
}

const { html, problems, games, next, gone, drift } = await build();

if (has("--lock")) {
  [...problems, ...gone].forEach((p) => console.error(p));
  if (problems.length || gone.length) {
    console.error("✗ 未更新 progress.lock.json：先修复上面的问题（章节 id 不能删除）");
    process.exit(1);
  }
  writeFileSync(LOCK_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log(`✓ 已更新 progress.lock.json：确认 ${drift.length} 条变更`);
  process.exit(0);
}

problems.push(...gone, ...drift);
if (gone.length || drift.length) problems.push("进度键有变更：确认不影响玩家进度后跑 `node tools/build.mjs --lock`（章节 id 不能删除）");
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
