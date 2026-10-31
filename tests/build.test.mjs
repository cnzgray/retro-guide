// 故障注入回归：在临时副本里改坏源码，确认 --check 给出对应的报错（而不只是产物漂移）
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ETERNIA = "src/games/eternia.js";
const XENOBLADE = "src/games/xenoblade.js";
const APP_CSS = "src/app.css";
const APP_JS = "src/app.js";
const SHELL = "src/shell.html";

function sandbox(t) {
  const dir = mkdtempSync(join(tmpdir(), "guide-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const p of ["src", "tools", "index.html", "assets", "games", "LICENSE-CONTENT.md"]) cpSync(join(ROOT, p), join(dir, p), { recursive: true });
  const run = (...args) => {
    const r = spawnSync("node", ["tools/build.mjs", ...args], { cwd: dir, encoding: "utf8" });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  const edit = (file, fn) => {
    const path = join(dir, file);
    const before = readFileSync(path, "utf8");
    const after = fn(before);
    assert.notEqual(after, before, `注入未生效：${file}`);
    writeFileSync(path, after);
  };
  const write = (file, content) => writeFileSync(join(dir, file), content);
  return { run, edit, read: (file) => readFileSync(join(dir, file), "utf8"), write };
}

function assertFails(t, file, fn, expected) {
  const { run, edit } = sandbox(t);
  edit(file, fn);
  const { code, out } = run("--check");
  assert.equal(code, 1, out);
  assert.match(out, expected);
}

test("当前源码通过校验", (t) => {
  const { code, out } = sandbox(t).run("--check");
  assert.equal(code, 0, out);
});

test("游戏文件未进索引", (t) => {
  const { run, write } = sandbox(t);
  write("src/games/orphan.js", 'export default { id:"orphan" };\n');
  const { code, out } = run("--check");
  assert.equal(code, 1, out);
  assert.match(out, /src\/games\/orphan\.js 未在 src\/games\/index\.js 中登记/);
});

test("数据语法错误", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace('goal:"追上法拉', "goal:追上法拉"), /数据无法解析/);
});

test("app.js 语法错误", (t) => {
  assertFails(t, APP_JS, (s) => s.replace('const KEY="retroGuide.v1";', "const KEY=;"), /src\/app\.js 语法错误/);
});

test("章节写法带空格时校验不失效", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace('{id:"e2",n:2', '{id: "e1", n: 2'), /章节 id 重复/);
});

test("缺 steps", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace(/steps:\[[\s\S]*?\],\n\s+items/, "items"), /e1: steps 必须是非空字符串数组/);
});

test("未闭合 jp 标签", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace("メルディ</i>", "メルディ"), /<i> 标签未闭合/);
});

test("外链：单引号 script", (t) => {
  assertFails(t, SHELL, (s) => s.replace("</head>", "<script src='https://cdn.example.com/x.js'></script></head>"), /外链/);
});

test("外链：CSS url()", (t) => {
  assertFails(t, APP_CSS, (s) => s.replace("*{box-sizing", "a{background:url(https://example.com/x.png)}\n  *{box-sizing"), /外链/);
});

test("favicon 必须内联", (t) => {
  assertFails(t, SHELL, (s) => s.replace(/<link rel="icon"[^>]*>\n/, ""), /缺少内联 favicon/);
});

test("主题变量缺失", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace('"--acc":"#b48cff",', ""), /theme 缺少变量 --acc/);
});

test("脚本占位符缺失", (t) => {
  assertFails(t, SHELL, (s) => s.replace("<!-- __GAME_SCRIPTS__ -->", ""), /缺少游戏脚本占位符/);
});

test("多文件产物漂移", (t) => {
  assertFails(t, APP_CSS, (s) => s + "\n/* drift */\n", /产物与 src\/ 不一致/);
});

test("任务 id 重复", (t) => {
  assertFails(t, XENOBLADE, (s) => s.replace('{id:13,n:"恋爱成就·男性篇"', '{id:12,n:"恋爱成就·男性篇"'), /任务 id 重复/);
});

test("二选一组不是 2 条", (t) => {
  assertFails(t, XENOBLADE, (s) => s.replace('"恋爱成就·男性篇",g:"阿道夫",t:1,x:"c9-1"', '"恋爱成就·男性篇",g:"阿道夫",t:1'), /二选一组 c9-1 必须有 2 条任务/);
});

test("限时任务缺期限", (t) => {
  assertFails(t, XENOBLADE, (s) => s.replace('"服药时间",g:"奥尔嘉",t:1,d:"第５章 离开逃生艇营地前"', '"服药时间",g:"奥尔嘉",t:1'), /任务 116 是限时任务，需要 d/);
});

test("物品类型重复", (t) => {
  assertFails(t, XENOBLADE, (s) => s.replace('{t:"武器",items:[', '{t:"收藏品",items:['), /类型重复/);
});

test("小技巧缺字段", (t) => {
  assertFails(t, XENOBLADE, (s) => s.replace(',w:"轻"}', ',w:"超重"}'), /\.w 必须是 轻\/中\/重\/机/);
  assertFails(t, XENOBLADE, (s) => s.replace('{t:"普攻自动，战技取消后摇",a:"普通攻击是自动的；放战技可以取消普攻后摇。走位到侧面或背面再放战技，伤害更高。"}', '{t:"普攻自动，战技取消后摇"}'), /tips\[0\] 需要 t 与 a/);
});

test("warn 被清空", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace(/warn:\[.*\],/, "warn:[],"), /e1 的 warn 数/);
});

test("章节标题被换", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace(/(\{id:"e1",n:1,title:")[^"]*/, "$1别的章节"), /e1 标题/);
});

test("收集项中途插入", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace('"水 · 温蒂妮', '"新项","水 · 温蒂妮'), /只能追加到组尾/);
});

test("章节 id 改名：check 失败，--lock 也拒绝", (t) => {
  const { run, edit } = sandbox(t);
  edit(ETERNIA, (s) => s.replace('{id:"e3",n:3', '{id:"e30",n:3'));
  assert.match(run("--check").out, /e3 消失/);
  const lock = run("--lock");
  assert.equal(lock.code, 1, lock.out);
});

test("中途插入章节：用新 id，已有 id 不动", (t) => {
  const { run, edit } = sandbox(t);
  edit(ETERNIA, (s) =>
    s
      .replace(/\{id:"e(\d+)",n:(\d+)/g, (m, id, n) => (+n >= 4 ? `{id:"e${id}",n:${+n + 1}` : m))
      .replace('{id:"e4",n:5', '{id:"e20",n:4,title:"新章",area:"某地",goal:"目标",steps:["一步"],items:[]},\n    {id:"e4",n:5'));
  assert.match(run("--check").out, /新章节 e20 未登记/);
  assert.equal(run("--lock").code, 0);
  assert.equal(run().code, 0);
  const { code, out } = run("--check");
  assert.equal(code, 0, out);
});

test("转义字段里的标签", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace('"收藏图鉴（コレクター図鑑）"', "\"收藏图鉴（<i class='jp'>コレクター図鑑</i>）\""), /转义字段不能写 HTML 标签/);
});

test("来源未署名", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace('"QiQoe"', '"未署名来源"'), /页脚缺少来源署名/);
});

test("--rename 必须指定游戏", (t) => {
  assert.equal(sandbox(t).run("--rename", "敏特=敏朵").code, 2);
});

test("--rename 不碰更长的名字和其他游戏", (t) => {
  const { run, read } = sandbox(t);
  assert.equal(run("--rename", "雷斯=莱斯", "--game", "eternia").code, 0);
  assert.match(read("src/games/topx.js"), /克雷斯/);
  assert.equal(run("--rename", "温蒂妮=水精灵", "--game", "topx").code, 0);
  assert.match(read("src/games/eternia.js"), /温蒂妮/);
  assert.match(read("src/names.js"), /eternia: \{[\s\S]*"ウンディーネ": "温蒂妮"/);
});

test("--rename 没有命中时报错且不改文件", (t) => {
  const { run, read } = sandbox(t);
  const before = read("src/names.js");
  assert.equal(run("--rename", "不存在=新名", "--game", "topx").code, 2);
  assert.equal(read("src/names.js"), before);
});

test("--rename 同步进度快照", (t) => {
  const { run } = sandbox(t);
  assert.equal(run("--rename", "敏特=敏朵", "--game", "topx").code, 0);
  assert.equal(run().code, 0);
  const { code, out } = run("--check");
  assert.equal(code, 0, out);
});

test("catalogMeta 的筛选必须对应分组", (t) => {
  assertFails(t, "src/games/pokopia.js", (s) => s.replace('"海底栖息地"', '"不存在的分组"'), /catalogMeta\.filters 没有对应分组/);
});
