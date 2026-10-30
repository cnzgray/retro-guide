# AGENTS.md

单文件离线攻略页（掌机上手边查）。四条硬约束：

- **产物单文件**：交付物是 `index.html`，由 `src/` 生成，零外链，`file://` 直接能开。
- **不手改产物**：改数据动 `src/games/*.js`，改结构动 `src/shell.html`，然后 `node tools/build.mjs`。CI 跑 `--check`，产物与源码不一致会红。
- **进度键不能动**：章节 id 永不改名、不删除，中途插章用新 id，只改 `n`；收集项按位置存进度，只能追加到组尾。`src/progress.lock.json` 记录现状，变更时 `--check` 会红，确认后跑 `node tools/build.mjs --lock`（它拒绝删除章节 id）。
- **译名在 `src/names.js`，按游戏分表**：正文写 `克雷斯（<i class='jp'>クレス</i>）`。校对发现实际用词不同，跑 `node tools/build.mjs --rename 旧=新 --game <游戏 id>`，正文、译名表、进度快照一次改完。

## 改内容

1. `src/games/*.js`，一个游戏一个文件，`export default { ... }`，字段见 `README.md`。
2. `build()` 切游戏时整体重渲染；勾选只走 `renderProgress / renderToc / updateNext` 局部更新——改成整页重绘会让滚动位置跳动。
3. 时限要素（过了就没的事件）写进 `warn[]`，渲染成黄色 `.warn`；这是本页核心价值，别降级成普通步骤。
4. 主题色只动 CSS 变量：`body` 是默认主题（缩小帽），其余每作一个 `body[data-game="<id>"]` 块。新增游戏时，数据文件、译名表、主题块、页脚和 `LICENSE-CONTENT.md` 的署名都要补，缺了 `--check` 会红。
5. `node tools/build.mjs` 生成 `index.html`，源码与产物一起提交。

完成标准：`node tools/build.mjs --check` 与 `node --test tests/build.test.mjs` 都退出 0；起 `python3 -m http.server 8765` 后确认各作章节数与 `src/progress.lock.json` 一致、搜中文名命中、勾选后刷新仍保留、切换后 `--acc` 正确、窄屏（≤420px）无横向溢出、页脚在各作下都可见。

## 新增一作

1. 新建 `src/games/<id>.js`，`id` 用小写英文；章节 id 用 `<首字母><序号>`，从 1 连续。
2. `src/shell.html` 加一段 `body[data-game="<id>"]` 主题变量，`THEME_BG` 加同 id 的底色。
3. `tools/build.mjs` 的 `ORDER` 决定标签页顺序，不写就排在末尾。
4. 人名进 `src/names.js`；道具名、术名没有可靠中文就用日文灰字，别臆造。

## 内容红线

- 不放游戏本体、ROM、汉化补丁、官方截图或攻略本扫描。
- 正文是公开攻略的中文重述，来源署名见页脚与 `LICENSE-CONTENT.md`；改写时保持重述，不整段照译。
- 新增章节/条目前先查证，查不到就空着——宁缺不编。

## 发布

`git push` 到 `main` 后 CI 先跑 `--check`，通过才由 GitHub Actions 部署 Pages，且只发布 `index.html`；校验失败时线上保持上一个版本。

## 深入

- `docs/HANDOFF.md`：设计取舍、已知风险、待办（译名对齐优先级最高）。
- `README.md`：字段模型、主题变量、构建与验证、Pages 发布。
- `src/shell.html`：CSS 与全部渲染逻辑；数据占位符是 `/* __GAMES__ */`。
