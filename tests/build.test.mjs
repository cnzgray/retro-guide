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
const SHELL = "src/shell.html";

function sandbox(t) {
  const dir = mkdtempSync(join(tmpdir(), "guide-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const p of ["src", "tools", "index.html", "LICENSE-CONTENT.md"]) cpSync(join(ROOT, p), join(dir, p), { recursive: true });
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
  return { run, edit, read: (file) => readFileSync(join(dir, file), "utf8") };
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

test("数据语法错误", (t) => {
  assertFails(t, ETERNIA, (s) => s.replace('goal:"追上法拉', "goal:追上法拉"), /数据无法解析/);
});

test("外壳内联脚本语法错误", (t) => {
  assertFails(t, SHELL, (s) => s.replace('const KEY="retroGuide.v1";', "const KEY=;"), /内联脚本语法错误/);
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
  assertFails(t, SHELL, (s) => s.replace("*{box-sizing", "a{background:url(https://example.com/x.png)}\n  *{box-sizing"), /外链/);
});

test("favicon 必须内联", (t) => {
  assertFails(t, SHELL, (s) => s.replace(/<link rel="icon"[^>]*>\n/, ""), /缺少内联 favicon/);
});

test("主题缺失", (t) => {
  assertFails(t, SHELL, (s) => s.replace('body[data-game="eternia"]', 'body[data-game="nope"]'), /缺少主题/);
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
