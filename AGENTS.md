# AGENTS.md

多文件离线攻略页（手边设备上边玩边查）。四条硬约束：

- **产物是多文件目录**：交付物是 `index.html` + `assets/` + `games/`，由 `src/` 生成，零外链；拷机时三样一起拷，`file://` 在 Chrome/Edge 可直接打开。
- **不手改产物**：改结构动 `src/shell.html`，改样式动 `src/app.css`，改渲染动 `src/app.js`，改数据动 `src/games/*.js`，然后 `node tools/build.mjs`。CI 跑 `--check`，任一产物与源码不一致会红。
- **进度键不能动**：章节 id 永不改名、不删除，中途插章用新 id，只改 `n`；收集项按位置存进度，只能追加到组尾；任务按任务 id 存进度，牵绊对话按牵绊 id 存进度，NPC 按 NPC id 存进度，id 都只增不删。`src/progress.lock.json` 记录现状，变更时 `--check` 会红，确认后跑 `node tools/build.mjs --lock`（它拒绝删除章节 id、任务 id、牵绊 id 和 NPC id）。
- **译名在 `src/names.js`，按游戏分表**：正文写 `克雷斯（<i class='jp'>クレス</i>）`。校对发现实际用词不同，跑 `node tools/build.mjs --rename 旧=新 --game <游戏 id>`，正文、译名表、进度快照一次改完。

## 改内容

1. `src/games/*.js`，一个游戏一个文件，`export default { ... }`，字段见 `README.md`。构建把它包装成 `games/<id>.js` 经典脚本，挂到 `window.RETRO_GAMES`。
2. `build()` 切游戏时整体重渲染；勾选章节/收集项/任务/牵绊/NPC 只做局部更新——改成整页重绘会让滚动位置跳动。
3. 时限要素（过了就没的事件）写进 `warn[]`，渲染成黄色 `.warn`；异度之刃的任务期限写进任务的 `d`，渲染成「期限：…」。这是本页核心价值，别降级成普通步骤。
4. 主题色只动数据里的 `theme` 对象：构建生成 `assets/themes.css`，默认游戏写 `:root`，其余写 `body[data-game="<id>"]`；不要回 `src/app.css` 加逐作主题块，也不要再维护 `accent`。新增游戏时，数据文件、`theme`、译名表、页脚和 `LICENSE-CONTENT.md` 的署名都要补，缺了 `--check` 会红。
5. 异度之刃的任务表在 `quests[]`：`t` 限时、`x` 二选一组（同组正好 2 条）、`s` 剧情、`ns2` NS2 新增、`v` 译名待核、`d` 期限、`m/e/f` 金钱/EXP/评价、`rw` 奖励道具数组。限时任务必须有 `d`；勾一条二选一会自动锁另一条。奖励显示在每条任务下方，并参与搜索。 `c` 是接取条件（委托人/作息/地点/评价值/第 X 章后/前置任务），`o` 是目标清单，`xi` 是二选一分支的后续影响说明（选这条能接或会消失的任务）。三者都在任务卡显示并参与搜索。任务页会按 `c` 的「前置任务」自动锁定后置任务，前置完成（「或」分支任一完成）后自动解锁；已完成的任务不锁，二选一锁定照旧。相连未来的 43 条支线在 `fvQuests[]`，勾选独立记进度，不计入主任务统计。
6. 异度之刃的牵绊对话在 `bonds[]`，按区域分组，条目 `{id,n,loc,chars,pts,unlock,night,req,alt}`：`id` 只增不删、`chars` 正好两人、`pts` 只用 500/1000/2000/3000/5000、`night` 标仅夜间、`req` 写殖民地6 复兴限制、`alt` 写另一版本。组上的 `warn` 渲染成区域黄框；`bondMeta` 管标题、页签、角色筛选表 `chars`、说明与脚注；`chars` 必须覆盖每条牵绊的两个人名，否则 `--check` 红。牵绊进度存 `state.bonds`，并进 `progress.lock.json`。
7. 异度之刃的 NPC 表在 `npcs[]`，按区域分组，条目 `{id,n,race,sex,age,jobs,schedules,gifts,tradeCount,tradeMax,tradeTop,variant}`：`id` 只增不删；同一 NPC 的多条作息写进 `schedules[{a,l,t}]`，不要拆成多个 id；`race` 和每个 `schedules[].a` 必须出现在 `npcMeta.races/areas` 里，否则 `--check` 红。NPC 进度存 `state.npcs`，并进 `progress.lock.json`。
8. 异度之刃的物品表在 `catalog[]`（`t` 类型、`items:[{n,p,a,u,w}]`；`u` 武器专属角色、`w` 防具重量 轻/中/重/机，角色筛选按钮与能力规则在 `catalogUsers[]`），小技巧在 `tips[]`（`{t,a}`）。物品与技巧不参与进度键，不进 `progress.lock.json`；改完跑构建和 `--check` 即可。
9. `node tools/build.mjs` 生成 `index.html` + `assets/` + `games/`，源码与产物一起提交。

完成标准：`node tools/build.mjs --check` 与 `node --test tests/build.test.mjs` 都退出 0；起 `python3 -m http.server 8765` 后确认各作章节数与 `src/progress.lock.json` 一致、异度之刃任务表 481 条 / 17 区域 / 130 限时 / 25 组二选一、任务接取条件 475 条、相连未来 43 条、牵绊对话 63 条 / 15 区域 / 6 条仅夜间、NPC 164 名 / 12 个活动区域 / 4 种族、珍稀种 177 只 / 20 区域（本篇 157 + 巨神肩 20）、系统 6 类（宝珠 88 / 战技 138 / 商店 1126 / 挑战 20 / 性格 35 / 诺彭 12）、全物品 1504 件 / 7 类、小技巧 22 张、搜中文名/物品名/牵绊名/NPC 名命中、勾选后刷新仍保留、二选一锁定生效、切换后 `--acc` 正确、窄屏（≤420px）无横向溢出、页脚在各作下都可见；Pokopia 另确认：6 章、图鉴 6 组、搜「杰尼龟」「Tall Grass」都能命中、物品 1710 件 / 12 类、默认中文名 + 英文灰字、搜「石头」与「Stone」都命中、类别叠加地点/方式筛选正确、搜「方块类」同时命中宝可梦与物品；流程里的宝可梦/物品名能点开对应条目；再把 `index.html` + `assets/` + `games/` 拷到别处，用 `file://` 打开确认能正常加载。

10. `catalogMeta`、`bossMeta` 给非物品数据改标题和筛选（Pokopia 用作图鉴与传说速查）；`catalogMeta.filters` 必须对应 `catalog` 分组，否则 `--check` 红。`items` / `itemsMeta` 是 Pokopia 的物品出处表：条目 `{n, a, en, l, p, w}`，`n` 中文名、`a` 出处、`en` 英文原名、`l` 喜好标签、`p` 地点标签、`w` 获取方式标签；`itemsMeta.filters` 必须对应 `items` 分组，`places` / `ways` 是二级筛选按钮。喜好标签的中文名到英文原名对照放在 `itemsMeta.favMap`，改标签时两处一起改；物品中文名与英文原名的对照在每条 `n` / `en`，改译名时同时改，否则灰字和英文搜索会漏。

## 新增一作

1. 新建 `src/games/<id>.js`，`id` 用小写英文；章节 id 用 `<首字母><序号>`，从 1 连续。
2. 在数据里写 `theme:{...}`，包含 `--bg`/`--panel`/`--acc`/`--a04`… 全套变量；构建会生成 `assets/themes.css`，不要改 `src/app.css` 或 `src/shell.html` 加逐作主题块。
3. 在 `src/games/index.js` 的 `GAME_IDS` 数组里加上新 id；数组顺序就是标签页顺序。文件存在但没进索引，`--check` 会报「未在 src/games/index.js 中登记」。
4. 人名进 `src/names.js`；道具名、术名没有可靠中文就用日文灰字，别臆造。例外：`pokopia` 用英文（灰字沿用 `jp` class），因为可核对的资料是英文，译名表的键也是英文。
5. 有大量任务的游戏（如异度之刃）把任务写进 `quests[]`，按区域分组，任务 id 用稳定的数字或字符串；二选一用同一个 `x` 值，并在两条任务上都写 `x`。牵绊对话多就写 `bonds[]`（异度之刃），按区域分组，id 只增不删。NPC 多就写 `npcs[]`（异度之刃），按区域分组，同一 NPC 的多条作息放 `schedules`。物品多就写 `catalog[]`（按类型分组），技巧多就写 `tips[]`；物品与技巧不参与进度键。

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
