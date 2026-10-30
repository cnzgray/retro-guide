# AGENTS.md

单文件离线攻略页（掌机上手边查）。四条硬约束：

- **产物单文件**：交付物是 `index.html`，由 `src/` 生成，零外链，`file://` 直接能开。
- **不手改产物**：改数据动 `src/games/*.js`，改结构动 `src/shell.html`，然后 `node tools/build.mjs`。CI 跑 `--check`，产物与源码不一致会红。
- **章节 id 是进度键**：`c1`–`c16`、`t1`–`t23` 永不改名。构建只校验 id 连续不重复，校验不出“换了别的 id 再重排”——那等于清空玩家进度。
- **译名只在 `src/names.js`**：正文写 `克雷斯（<i class='jp'>クレス</i>）`。校对发现实际用词不同，跑 `node tools/build.mjs --rename 旧=新`，正文与译名表一次改完。

## 改内容

1. `src/games/minish.js` / `topx.js`，一个游戏一个文件，`export default { ... }`，字段见 `README.md`。
2. `build()` 切游戏时整体重渲染；勾选只走 `renderProgress / renderToc / updateNext` 局部更新——改成整页重绘会让滚动位置跳动。
3. 时限要素（过了就没的事件）写进 `warn[]`，渲染成黄色 `.warn`；这是本页核心价值，别降级成普通步骤。
4. 主题色只动两组 CSS 变量：`body`（缩小帽 `#56dd91` / `#ffc861`）与 `body[data-game="topx"]`（幻想传说 `#849cff` / `#ffcf70`）。
5. `node tools/build.mjs` 生成 `index.html`，源码与产物一起提交。

完成标准：`node tools/build.mjs --check` 退出 0；起 `python3 -m http.server 8765` 后确认两作章节数 16 / 23、搜中文名命中、勾选后刷新仍保留、切换后 `--acc` 正确、窄屏（≤420px）无横向溢出、页脚在两作下都可见。

## 内容红线

- 不放游戏本体、ROM、汉化补丁、官方截图或攻略本扫描。
- 正文是公开攻略的中文重述，来源署名见页脚与 `LICENSE-CONTENT.md`；改写时保持重述，不整段照译。
- 新增章节/条目前先查证，查不到就空着——宁缺不编。

## 发布

`git push` 到 `main` 后约 1 分钟 GitHub Pages 自动重建（`main` / root，产物 `index.html` 已在仓库根）。

## 深入

- `docs/HANDOFF.md`：设计取舍、已知风险、待办（译名对齐优先级最高）。
- `README.md`：字段模型、主题变量、构建与验证、Pages 发布。
- `src/shell.html`：CSS 与全部渲染逻辑；数据占位符是 `/* __GAMES__ */`。
