# AGENTS.md

多文件离线攻略页（掌机上手边查）。四条硬约束：

- **产物是多文件目录**：交付物是 `index.html` + `assets/` + `games/`，由 `src/` 生成，零外链；拷机时三样一起拷，`file://` 在 Chrome/Edge 可直接打开。
- **不手改产物**：改结构动 `src/shell.html`，改样式动 `src/app.css`，改渲染动 `src/app.js`，改数据动 `src/games/*.js`，然后 `node tools/build.mjs`。CI 跑 `--check`，任一产物与源码不一致会红。
- **进度键不能动**：章节 id 永不改名、不删除，中途插章用新 id，只改 `n`；收集项按位置存进度，只能追加到组尾；任务按任务 id 存进度，id 只增不删。`src/progress.lock.json` 记录现状，变更时 `--check` 会红，确认后跑 `node tools/build.mjs --lock`（它拒绝删除章节 id 和任务 id）。
- **译名在 `src/names.js`，按游戏分表**：正文写 `克雷斯（<i class='jp'>クレス</i>）`。校对发现实际用词不同，跑 `node tools/build.mjs --rename 旧=新 --game <游戏 id>`，正文、译名表、进度快照一次改完。

## 改内容

1. `src/games/*.js`，一个游戏一个文件，`export default { ... }`，字段见 `README.md`。构建把它包装成 `games/<id>.js` 经典脚本，挂到 `window.RETRO_GAMES`。
2. `build()` 切游戏时整体重渲染；勾选章节/收集项/任务只做局部更新——改成整页重绘会让滚动位置跳动。
3. 时限要素（过了就没的事件）写进 `warn[]`，渲染成黄色 `.warn`；异度之刃的任务期限写进任务的 `d`，渲染成「期限：…」。这是本页核心价值，别降级成普通步骤。
4. 主题色只动数据里的 `theme` 对象：构建生成 `assets/themes.css`，默认游戏写 `:root`，其余写 `body[data-game="<id>"]`；不要回 `src/app.css` 加逐作主题块，也不要再维护 `accent`。新增游戏时，数据文件、`theme`、译名表、页脚和 `LICENSE-CONTENT.md` 的署名都要补，缺了 `--check` 会红。
5. 异度之刃的任务表在 `quests[]`：`t` 限时、`x` 二选一组（同组正好 2 条）、`s` 剧情、`ns2` NS2 新增、`v` 译名待核、`d` 期限、`m/e/f` 金钱/EXP/评价、`rw` 奖励道具数组。限时任务必须有 `d`；勾一条二选一会自动锁另一条。奖励显示在每条任务下方，并参与搜索。
6. 异度之刃的物品表在 `catalog[]`（`t` 类型、`items:[{n,p,a}]`），小技巧在 `tips[]`（`{t,a}`）。物品与技巧不参与进度键，不进 `progress.lock.json`；改完跑构建和 `--check` 即可。
7. `node tools/build.mjs` 生成 `index.html` + `assets/` + `games/`，源码与产物一起提交。

完成标准：`node tools/build.mjs --check` 与 `node --test tests/build.test.mjs` 都退出 0；起 `python3 -m http.server 8765` 后确认各作章节数与 `src/progress.lock.json` 一致、异度之刃任务表 481 条 / 17 区域 / 130 限时 / 25 组二选一、全物品 1504 件 / 7 类、小技巧 18 张、搜中文名/物品名命中、勾选后刷新仍保留、二选一锁定生效、切换后 `--acc` 正确、窄屏（≤420px）无横向溢出、页脚在各作下都可见；再把 `index.html` + `assets/` + `games/` 拷到别处，用 `file://` 打开确认能正常加载。

## 新增一作

1. 新建 `src/games/<id>.js`，`id` 用小写英文；章节 id 用 `<首字母><序号>`，从 1 连续。
2. 在数据里写 `theme:{...}`，包含 `--bg`/`--panel`/`--acc`/`--a04`… 全套变量；构建会生成 `assets/themes.css`，不要改 `src/app.css` 或 `src/shell.html` 加逐作主题块。
3. 在 `src/games/index.js` 的 `GAME_IDS` 数组里加上新 id；数组顺序就是标签页顺序。文件存在但没进索引，`--check` 会报「未在 src/games/index.js 中登记」。
4. 人名进 `src/names.js`；道具名、术名没有可靠中文就用日文灰字，别臆造。
5. 有大量任务的游戏（如异度之刃）把任务写进 `quests[]`，按区域分组，任务 id 用稳定的数字或字符串；二选一用同一个 `x` 值，并在两条任务上都写 `x`。物品多就写 `catalog[]`（按类型分组），技巧多就写 `tips[]`；两者不参与进度键。

## 内容红线

- 不放游戏本体、ROM、汉化补丁、官方截图或攻略本扫描。
- 正文是公开攻略的中文重述，来源署名见页脚与 `LICENSE-CONTENT.md`；改写时保持重述，不整段照译。
- 新增章节/条目前先查证，查不到就空着——宁缺不编。

## 发布

`git push` 到 `main` 后 CI 先跑 `--check`，通过才由 GitHub Actions 部署 Pages，发布 `index.html` + `assets/` + `games/`；校验失败时线上保持上一个版本。

## 深入

- `docs/HANDOFF.md`：设计取舍、已知风险、待办（译名对齐优先级最高）。
- `README.md`：字段模型、主题变量、构建与验证、Pages 发布。
- `src/shell.html`：骨架；`src/app.css`：样式；`src/app.js`：全部渲染逻辑；数据占位符是 `<!-- __GAME_SCRIPTS__ -->`。
- `src/games/index.js`：构建期游戏注册表 `GAME_IDS`；浏览器端对应 `games/index.js` 的 `window.RETRO_GAME_IDS`。
