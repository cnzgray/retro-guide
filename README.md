# 游戏通关手册

![vibe coded](https://img.shields.io/badge/vibe_coded-100%25-ff69b4?style=flat-square)

边玩边查的离线攻略页，老游戏在 Retroid Pocket G2 这类掌机上看，Switch 2 新作在手机或平板上看。覆盖五作：

- **GBA《塞尔达传说：缩小帽》**
- **PSP《幻想传说 X（Cross Edition）》**
- **PS1《永恒传说》**
- **Switch《异度之刃 决定版》（含 Switch 2 Edition 新增内容）**
- **Switch 2《宝可梦 Pokopia》（含 Ver. 2.0.0 与扩展票 Bubbly Basin）**

老游戏没有任务指引，网上攻略又散、又旧、图还全挂。所以这里交付的不是文章，而是一个**多文件、零外链、`file://` 直接打开**的速查页：`index.html` 只做骨架，`assets/` 放样式和渲染逻辑，`games/` 一作一个数据文件。章节卡折叠 + 进度勾选 + 卡关 Q&A + 收集清单 + Boss 速查 + 全站搜索，进度存本地。

第四作是另一个量级：480 条任务、130 条限时、25 组二选一，外加 63 条牵绊对话和 164 名有名 NPC。页面为此加了「全任务」「牵绊」「NPC」三套追踪：任务按区域列，标出时限与二选一，勾选后自动锁定另一分支；牵绊对话按区域列，标出两名角色、牵绊等级、昼夜、开放章节和殖民地6 复兴限制；NPC 页按区域列，标出活动时间、常去地点、种族/性别/年龄、特征、喜欢的礼物和交易最高星级。单周目最多完成 455 条任务（NS2 版 456 条），牵绊对话 63 条可在一周目全部看完。 任务卡还标出接取人作息、地点、地域评价值与前置任务；新增「珍稀种」页（177 只，含等级/HP/掉落）和「系统」页（宝珠、战技、商店、挑战战斗、性格、诺彭调查队），相连未来 43 条支线单列在任务页底部。

第五作的重点不同：几乎没有永久错过的内容，所以不追踪任务，而是做能搜的「图鉴速查」——宝可梦 → 栖息地 / 时间 / 天气，栖息地 → 配方 / 可遇对象；再补一张「物品出处」表（1710 件）和 43 类喜好标签：搜物品名看它从哪来，搜喜好类别看谁是同好。

这本手册最早叫「老游戏通关手册」，名字很老实：一台 Retroid Pocket G2，几款没有任务指引的老游戏，一个不用联网的页面。

后来我的另一台机器 Switch 2 上来了一款《宝可梦 Pokopia》。它和手册里的前辈们正好相反：老游戏怕你错过，出了村，支线就永远没了；Pokopia 几乎什么都不会错过，你只是站在一片荒地上，想请一只宝可梦回家，却不知道它喜欢什么样的草丛。

可卡住的瞬间是一样的——手停下来，开始想要不要切出去查。所以我没有另起炉灶，只把书名里的「老」字划掉，给它添了一章新的查法：这回不用黄框提醒你别走，而是告诉你怎么把它们请来。

老游戏还在 G2 上开着页面，Switch 2 上玩的，就把页面放在手边的另一块屏幕上。设备换了，这本手册要做的事没变：**你只管玩，下一步我来记。**

## 为什么做这个

不是缺攻略，是缺**能在掌机上边玩边看**的攻略。真正劝退的三个瞬间：

1. **切出去查一次，回来就不想玩了。** 掌机上查攻略要切应用：广告、弹窗、一张 3 MB 的图、还要联网加载；等你切回来，机器已经休眠，操作忘了一半。
2. **老游戏不告诉你下一步。** 缩小帽里那扇门要变小才看得见；幻想传说里出村就永久错过的时限支线，wiki 里用一行小字带过。攻略一旦不标，你就永远漏了。
3. **中文资料散，日文 wiki 劝退。** 幻想传说 X 最全的流程只有日文表格，中文版本停在十年前，图全挂——攻略站变成了考古现场。

所以它长这样：**一个目录拷进掌机，`file://` 秒开**，不联网、不登录、不弹窗；章节按「现在该做第几章」排，时限要素标黄，勾过的进度存在本机，隔天回来接着走。拷的时候要带上 `index.html`、`assets/`、`games/` 三样，不能只拷 `index.html`。

在补老游戏的不止我一个。译名不对、事实有错、想加一作，都欢迎开 issue——报个名字就行。

线上版：<https://cnzgray.github.io/retro-guide/>（GitHub Pages，HTTP 自动跳 HTTPS）

## Vibe Coding 实录

页面、构建脚本、这份 README，全程对着 AI 说人话做出来的。分工写在明面上，免得互相甩锅：

| 谁 | 干了什么 |
|---|---|
| **人** | 定需求（掌机上边玩边查，不要文章）、拍板配色与信息层级、核对流程与译名、决定什么不写（宁缺不编） |
| **AI** | 写渲染逻辑与构建脚本、排版与文案初稿、把攻略事实逐条查证后回写、自己跑浏览器回归 |
| **不 vibe 的部分** | 零外链、章节/任务 id 不改名、产物不手改——三条硬约束，人和 AI 都不能为了「顺手」推翻 |

效果如何自己判：`node tools/build.mjs --check` 全绿，CI 拦漂移，产物合计约 1 MB 零依赖，单个游戏数据文件独立增长。

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | **产物**，站点骨架：只含 HTML、内联 favicon 和三个外链引用，不手改 |
| `assets/app.css` | **产物**：样式表，由 `src/app.css` 生成 |
| `assets/app.js` | **产物**：渲染逻辑，由 `src/app.js` 生成 |
| `assets/themes.css` | **产物**：各作主题变量，构建时从 `src/games/*.js` 的 `theme` 生成 |
| `games/index.js` | **产物**：浏览器端游戏 id 列表，顺序即标签页顺序 |
| `games/minish.js`、`topx.js`、`eternia.js`、`xenoblade.js`、`pokopia.js` | **产物**：各作数据，由 `src/games/*.js` 包装成经典脚本，挂到 `window.RETRO_GAMES` |
| `src/shell.html` | 骨架源文件：只写 HTML 结构和资源引用，含 `<!-- __GAME_SCRIPTS__ -->` 占位符 |
| `src/app.css` | 样式源文件 |
| `src/app.js` | 渲染源文件；从 `window.RETRO_GAME_IDS` / `window.RETRO_GAMES` 读数据 |
| `src/games/minish.js`、`topx.js`、`eternia.js`、`xenoblade.js`、`pokopia.js` | 攻略数据源文件，一个游戏一个文件，`export default { ... }`；主题在 `theme`，异度之刃任务表在 `quests`，牵绊对话在 `bonds`，NPC 在 `npcs` |
| `src/games/index.js` | 构建期游戏索引：`GAME_IDS` 数组列出所有游戏 id，数组顺序就是标签页顺序；新增文件不登记会被 `--check` 拦住 |
| `src/names.js` | 译名单点：按游戏分表，日文原名 → 汉化译名 |
| `src/progress.lock.json` | 进度键快照：章节 id、标题、`warn` 数、收集项顺序、任务 id/名称/限时/二选一组、牵绊对话 id/名称、NPC id/名称 |
| `tests/build.test.mjs` | 故障注入回归：确认 `--check` 真能拦住各类问题 |
| `tools/build.mjs` | 零依赖 Node 脚本：生成 `index.html` + `assets/` + `games/`，校验、`--check`、`--rename`、`--lock` |
| `.github/workflows/check.yml` | CI：产物与源码不一致就红；`main` 校验通过后部署 Pages |
| `top_x_ce_walkthrough.md` | 《幻想传说 X》流程整理稿（552 行），页面内容的**事实源**之一 |
| `docs/HANDOFF.md` | 交接文档：设计约定、已知风险、待办、验证方法 |
| `LICENSE` | MIT（只覆盖代码，不含攻略正文） |
| `LICENSE-CONTENT.md` | 攻略正文许可：CC BY-NC-SA 4.0、来源署名、免责 |
| `AGENTS.md` | 给 AI 协作者的硬约束、改动流程、完成标准 |
| `README.md` | 本文件 |

## 构建

```bash
node tools/build.mjs            # 由 src/ 生成 index.html + assets/ + games/（源码与产物一起提交）
node tools/build.mjs --check    # CI 同款：任一产物漂移或校验不过则退出 1
node tools/build.mjs --rename 敏特=敏朵 --game topx   # 只改该游戏的正文、译名表与进度快照
node tools/build.mjs --lock     # 确认进度键变更，更新 src/progress.lock.json
node --test tests/build.test.mjs   # 故障注入回归
node tools/build.mjs --verbose  # 附带打印译名提示与 unverified 存疑清单
```

`--check` 拦这些问题：数据语法错误、字段缺失、标签未闭合、转义字段写了标签、章节 id 重复、译名不一致、主题变量或来源署名缺失、任务 id 重复、二选一组不是 2 条、限时任务没有期限、牵绊对话 id 重复或字段缺失、NPC id 重复或字段缺失、物品类型重复或物品字段缺失、小技巧字段缺失、游戏文件没进 `src/games/index.js`、骨架里有内联样式/脚本、外链、`app.js` 或游戏脚本语法错误、任一产物漂移、多余的游戏脚本，以及进度键变更。它只检查结构，不验证攻略事实，也不运行页面，发布前仍要走下面的回归清单。

**进度键**：章节按 `id` 存进度，收集项按「组序号-项序号」存，任务按任务 `id` 存，牵绊对话按牵绊 `id` 存，NPC 按 NPC `id` 存。章节、任务、牵绊和 NPC id 只增不删，`--lock` 也不接受删除；中途插章用新 id，只改 `n` 决定显示顺序。收集项只能追加到组尾。标题、`warn` 数、收集项、任务名/限时标记/二选一组、牵绊名、NPC 名变化会让 `--check` 失败，确认没有换内容、没有丢时限要素后跑 `--lock`。二选一组必须正好 2 条，任务表新增时也只能追加。

## 使用

把 `index.html`、`assets/`、`games/` 三样一起拷进掌机，用浏览器打开 `index.html` 即可，不需要服务器、不需要联网。Chrome / Edge 对本地经典脚本放行，已用 `file://` 实测；如果某个浏览器拦本地脚本，就起一个本地 http 服务再开。

本机调试时走 http 更稳：

```bash
cd retro-guide
python3 -m http.server 8765
# 打开 http://127.0.0.1:8765/index.html
```

## 发布（GitHub Pages）

已上线：<https://cnzgray.github.io/retro-guide/>，仓库 `cnzgray/retro-guide`（公开），Pages 走 GitHub Actions，HTTPS 已强制。`git push` 到 `main` 后先跑 `--check`，通过才部署 `index.html`、`assets/`、`games/`；校验失败时线上保持上一个版本。

## 技术结构

源码在 `src/`，构建后生成一个可直接打开的目录：

```
index.html                  骨架（src/shell.html）
assets/app.css              样式（src/app.css）
assets/app.js               渲染逻辑（src/app.js）
assets/themes.css           主题变量（从各作 theme 生成）
games/index.js              浏览器端游戏列表：window.RETRO_GAME_IDS
games/<id>.js               各作数据：window.RETRO_GAMES[<id>]
```

`src/games/*.js` 仍用 `export default { ... }` 给构建脚本做校验；`games/<id>.js` 由构建包装成经典脚本，不走 ES module，所以 `file://` 不会被 CORS 拦。`src/app.js` 从 `window.RETRO_GAME_IDS` 和 `window.RETRO_GAMES` 取数据。

构建会给 `index.html` 里所有本地资源追加内容指纹（如 `assets/app.js?v=a25b73e95d`）。GitHub Pages 对静态资源固定发 `Cache-Control: max-age=600` 且无法改头，普通刷新时浏览器会重新验证 `index.html`，但子资源在有效期内直接用缓存；URL 带指纹后内容一变就换 URL，避免「新 HTML 配旧脚本」，普通刷新即可更新，无需强刷。指纹由构建生成，不要手改 `index.html`。

```
GAMES[]                     游戏
├─ id / title / sub / short / tabs / metas / intro
├─ （顺序）                 src/games/index.js 的 GAME_IDS 数组顺序
├─ theme{}                  主题 CSS 变量；构建时生成 :root / body[data-game] 块
├─ sources[]                来源署名，须同时出现在页脚与 LICENSE-CONTENT.md
├─ unverified[]             可选，存疑事项，不渲染，`--verbose` 列出
├─ chapters[]               章节：{id, n, title, area, goal, steps[], items[], warn[], boss:{name,tip}, tip}
├─ quests[]                 全任务：{area, items:[{id, n, g, t, x, s, ns2, v, d, m, e, f, rw[], c, o[], xi}]}
├─ bonds[]                  全牵绊对话：{area, warn?, items:[{id, n, loc, chars[2], pts, night, unlock, req?, alt?}]}
├─ bondMeta{}               牵绊区块文案：{title, tab, chars[], note, foot}
├─ npcs[]                   全 NPC：{area, items:[{id, n, race, sex, age, jobs[], schedules[{a,l,t}], gifts[], tradeCount, tradeMax, tradeTop[], variant?}]}
├─ npcMeta{}                NPC 区块文案与筛选表：{title, tab, races[], areas[], note, foot}
├─ catalog[]                全物品：{t, items:[{n, p, a, u, w, l}]}；武器/防具/收藏品
├─ bestiary[]               珍稀种：{area, items:[{n, lv, hp, d[]}]}
├─ bestiaryMeta{}           珍稀种文案：{title, tab, note, foot}
├─ systems[]                系统表：{t, note, groups:[{t, items:[{n, meta, desc}]}]}
├─ systemsMeta{}            系统文案：{title, tab, note, foot}
├─ catalogUsers[]           物品角色筛选：{n, armor, medium, mech}
├─ catalogMeta{}            可选，改写 catalog 的文案与筛选：{title, tab, unit, stat, note, foot, filters[]}
├─ items[]                  物品出处（Pokopia）：{t, items:[{n, a, en, l, p, w}]}
├─ itemsMeta{}              物品出处的文案、筛选与喜好标签对照：{title, tab, unit, stat, note, foot, filters[], places[], ways[], favMap{}}
├─ tips[]                   小技巧：{t, a}
├─ qa[]                     卡关急救：{q, a}
├─ checks[]                 收集清单分组：{t, items[]}
├─ bossMeta{}               可选，改写 Boss 区块的标题：{title, tab}
└─ bosses[]                 Boss 速查：{n, s, t}
```

- 章节 `id` 是进度持久化的键，**改名会丢掉用户已勾的进度**；id 与显示顺序无关，顺序由 `n` 决定。
- `quests` 的 `id` 是任务进度的键，只增不删；`t` 标限时，`x` 是二选一组（同组必须正好 2 条），`s` 标剧情，`ns2` 标 NS2 新增，`v` 标译名待核，`d` 是期限文案，`m/e/f` 是金钱/EXP/评价，`rw` 是奖励道具数组，`c` 是接取条件（委托人/作息/地点/评价值/第 X 章起/前置任务），`o` 是目标清单，`xi` 是二选一分支的后续影响说明（选这条能接或会消失的任务）。任务卡会按 `c` 里的「前置任务」自动锁定后置任务；多条前置需要全部完成，「或」分支任一完成即可，满足后自动解锁。`c` 里的「第 X 章起」与流程页联动：该章未勾选时显示提示，不阻止勾选；勾上后提示消失。已完成的任务不被锁。限时任务必须有 `d`（或所在组有 `d`）。
- `bestiary` 是珍稀种表，按区域分组：`n` 名称、`lv` 等级、`hp` 血量、`d` 掉落数组（素材/结晶/U 武器/装备/战技书，含概率）。`bestiaryMeta` 定义标题、页签、说明与脚注。珍稀种不参与进度键。
- `systems` 是系统速查表：`t` 分类（宝珠/战技/商店/挑战战斗/性格），`groups` 为子分组，条目统一为 `{n, meta, desc}`——名称、摘要行、细节行。`systemsMeta` 定义标题、页签、说明与脚注。系统表不参与进度键。
- `bonds` 是异度之刃的牵绊对话表，按区域分组：`id` 是进度键，只增不删；`n` 名称、`loc` 具体地点、`chars` 两名角色、`pts` 所需牵绊值（500/1000/2000/3000/5000，渲染成黄/绿/青/紫/粉）、`night` 标仅夜间、`unlock` 开放章节/事件、`req` 额外的殖民地6 复兴条件、`alt` 另一版本说明。组上的 `warn` 是该区域的时限/封锁提醒。`bondMeta` 定义标题、页签、角色筛选表 `chars`、说明与脚注；`chars` 里必须有每条牵绊的两个人名，否则 `--check` 失败。牵绊进度存 `state.bonds`。
- `npcs` 是异度之刃的 NPC 表，按区域分组：`id` 是进度键，只增不删；`n` 名称、`race` 种族、`sex` 性别、`age` 年龄、`jobs` 特征数组、`schedules` 作息数组（`a` 区域、`l` 常去地点、`t` 活动时间）、`gifts` 喜欢的礼物数组、`tradeCount` 交易件数、`tradeMax` 最高星级、`tradeTop` 最高星级物品、`variant` 标多条剧情/移民/任务分支状态。`npcMeta` 定义标题、页签、种族/区域筛选表、说明与脚注；NPC 的种族和活动区域必须在筛选表里，否则 `--check` 失败。NPC 进度存 `state.npcs`。
- `catalog` 按物品类型分组：`n` 名称、`p` 价格、`a` 基础数值或收藏品区域/类别、`u` 武器专属角色、`w` 防具重量（轻/中/重/机）、`l` 可选标签数组（Pokopia 用来存喜好类别，渲染成小标签并参与搜索）。`catalogUsers[]` 定义角色筛选：`n` 角色名，`armor` 防具规则已核实，`medium` 中型免技能，`mech` 可穿机界防具。当前覆盖武器/防具/收藏品 1504 件；素材和关键物品没有独立物品页，散落在任务报酬与殖民地6 清单里。`tips` 是 `{t, a}` 小技巧卡片。
- `items` 与 `itemsMeta` 是 Pokopia 的「物品出处」表：`items` 按类别分组，条目 `{n, a, en, l, p, w}`——`n` 中文名（暂无可靠简中名时等于英文原名并标「原名」）、`a` 出处（地点 + 获取方式）、`en` 英文原名（灰字显示、参与搜索）、`l` 喜好标签、`p` 地点标签（荒野/海边/山地/空岛/空空镇/云岛/海底/梦岛）、`w` 获取方式标签（野外/初始/宝藏/套组/制作/商店/交易/鉴定/3D 打印/电磁飘浮/宝可梦中心/任务/活动）。`itemsMeta` 定义标题、文案、类别筛选、地点/方式筛选与 `favMap`（喜好中文标签 → 英文原名）。`itemsMeta.filters` 必须对应 `items` 分组。物品与喜好不参与进度键。
- `steps / goal / warn / boss.tip / qa.a / bosses.t` 按 HTML 原样插入（可写 `<b>`）；`title / area / items`、收集项、任务名/委托人/期限、`boss.name` 等会被转义，不能写标签。
- 主题变量写在 `theme` 对象里；构建时默认游戏生成 `:root`，其余生成 `body[data-game="<id>"]` 到 `assets/themes.css`。标签圆点色直接取 `theme["--acc"]`，不再单独维护 `accent`。
- `build()` 每次切换游戏整体重渲染；勾选章节/任务/收集项只做局部更新，不重绘整页，避免滚动位置跳动。
- 搜索靠每个可搜元素的 `data-search`，文本先 `.replace(/<[^>]+>/g," ")` 去标签再小写化；任务项还会叠加「限时/二选一/未完成/已完成」筛选，牵绊项叠加「状态/角色/等级」筛选，NPC 项叠加「登记/任务/交易/区域/种族/昼夜」筛选。
- 流程正文会自动识别宝可梦、栖息地与物品名并生成 `.xref` 链接（关键词取自 `catalog` 与 `items`，最长匹配优先，不处理标题与 chips）；点击后切到「图鉴」或「物品」面板，把名称填进搜索框并展开命中项。同一名称只保留一个链接目标，图鉴优先于物品。
- 进度存 `localStorage`，key `retroGuide.v1`：`{game, done:{<游戏 id>:[]}, checks:{...}, quests:{<游戏 id>:{<任务 id>:1}}, bonds:{<游戏 id>:{<牵绊 id>:1}}, npcs:{<游戏 id>:{<NPC id>:1}}}`，选中游戏也会记住。
- 页脚 `footer.sitefoot` 是静态免责声明，不在 `build()` 的重渲染范围内，切换游戏不会丢。

## 设计约定（改之前先确认）

1. **中文优先**。人名、地名、道具、术技用汉化译名，日文原名降为灰色小字：`克雷斯（<i class='jp'>クレス</i>）`。用户看不懂日文，不要把日文提回正文。
2. **多文件、零外链**。不引 CDN、字体、图片外链；拷机时把 `index.html`、`assets/`、`games/` 一起拷，必须离线可用。上线只是分发方式，不改变这个约束。
3. **信息密度优先于文采**。每章 = 目标 + 分步 + 该拿的东西 + 易漏/卡点 + Boss 解法，不写叙事。
4. **时限要素单独标黄**（`.warn`）。这类老游戏最劝退的地方，也是本页核心价值。
5. **主题色定义在游戏数据里**，全部走 `theme` 对象里的 CSS 变量；构建时生成 `assets/themes.css`。改配色只动对应游戏的 `theme`，不要回 `src/app.css` 里加逐作块，也不要再单独维护 `accent`。
6. **一作一数据文件，骨架/样式/渲染分离**。`src/shell.html` 只写结构，`src/app.css` 写样式，`src/app.js` 写渲染，`src/games/<id>.js` 写一作数据；构建只做校验、主题生成、经典脚本包装，不引入打包器或框架。这样 `index.html` 不会再随游戏数线性膨胀。
7. **产物不手改**。`index.html`、`assets/`、`games/` 都是构建产物；改 `src/` 后跑 `node tools/build.mjs`，直接改产物会被 `--check` 判漂移，下一次构建覆盖掉。
8. **译名只有一处定义**。`src/names.js` 按游戏分表，是需要与补丁核对的专名的事实源，道具等一次性名词直接写在正文；改译名用 `--rename --game`，别手工全局替换。
9. **任务进度按任务 id 存**。`quests` 的 id 只增不删，新增任务只能追加；任务名、`t`、`x` 变化会让 `--check` 失败。二选一组必须正好 2 条，勾一条会自动锁另一条。
10. **牵绊进度按牵绊 id 存**。`bonds` 的 id 也只增不删；改名会让 `--check` 失败，确认后跑 `--lock`。牵绊对话不参与任务统计，不要塞进 `quests`。
11. **NPC 进度按 NPC id 存**。`npcs` 的 id 也只增不删；同一 NPC 的多条作息写进 `schedules`，不要拆成多个 id。NPC 不参与任务统计，任务按委托人名从 `quests` 动态匹配。

## 授权与免责

- **代码**（HTML 结构 / CSS / JS）：MIT，见 `LICENSE`。
- **攻略正文**：CC BY-NC-SA 4.0——署名、非商业、相同方式共享。完整条款、原始来源与不涵盖的内容见 `LICENSE-CONTENT.md`。
- **不收录**：游戏本体、ROM、汉化补丁、官方图像或攻略本扫描。发现被添加请直接回滚。
- 游戏名称、角色、地名等著作权与商标归任天堂 / Game Freak / The Pokémon Company / 万代南梦宫 / Monolith Soft 等各自权利人所有；本项目为非官方同人作品，与发行方无关。

## 验证

回归检查清单：

0. `node tools/build.mjs --check` 退出 0（`index.html`、`assets/`、`games/` 全部无漂移，无译名/结构问题）；
1. 各作章节数与 `src/progress.lock.json` 一致；异度之刃任务表为 481 条 / 17 区域 / 130 限时 / 50 条二选一（25 组）；牵绊对话 63 条 / 15 区域 / 6 条仅夜间；NPC 164 名 / 12 个活动区域 / 4 种族；切换游戏无控制台报错；
2. 搜索中文名（如「克雷斯」「恋爱成就」「菲奥伦」「羁绊任务」「帕欧菈」）能命中并展开对应章节/任务/牵绊/NPC；
3. 勾选章节 → 进度条 / 「现在该做」更新 → 刷新后仍保留；勾选任务/牵绊/NPC → 对应进度条更新 → 刷新后仍保留；
4. 切到缩小帽 `--acc` 为 `#56dd91`、`meta[theme-color]` 为 `#0c1310`；幻想传说 `#849cff` / `#0a0c15`；永恒传说 `#b48cff` / `#0b0a14`；异度之刃 `#5ad1ff` / `#071018`；
5. 窄屏（≤420px）无横向溢出：`document.documentElement.scrollWidth <= window.innerWidth`；
6. 页脚免责声明在各作下都可见，切换游戏不被 `build()` 清掉；
7. 异度之刃「全任务」：限时筛选 130 条、二选一筛选 50 条、搜索与筛选叠加后仍正确；每条任务显示「奖励：…」，搜索道具名（如「游泳凉鞋」）能命中；勾选一条二选一后另一条变灰且不可勾，取消后恢复；
8. 异度之刃「牵绊」：63 条 / 15 区域；「仅夜间」筛选 6 条、「菲奥伦」筛选 18 条、「粉」筛选 21 条；搜「菲奥伦」「羁绊任务」都命中；勾选后刷新仍保留；「下一个未完成」「展开全部」正常；殖民地6/皇都/监狱岛组头的黄框提示可见；
9. 异度之刃「NPC」：164 名 / 12 个活动区域 / 4 种族；「有任务」135 名、「可交易」164 名、「诺彭」58 名、白天 116 名、夜晚 102 名；区域筛选「机神界区域」1 名；搜「帕欧菈」「18:00」「兔怪的肉球印章」「儿子的遗物」都命中；勾选后刷新仍保留；「下一个未登记」「展开全部」正常；
10. 主题变量只存在于 `src/games/*.js` 的 `theme` 对象；`assets/themes.css` 由构建生成，仍能正常切换配色；
11. 多文件：`index.html` 只引用 `assets/` 与 `games/`，没有内联样式/脚本；把三样一起拷到别处，`file://` 能打开并加载 481 条任务、63 条牵绊和 164 名 NPC；删掉 `games/xenoblade.js` 后页面应缺少异度之刃数据（证明不是内嵌的）。
12. 异度之刃「全物品」：1504 件 / 7 类型；防具筛选 883 件；搜「甜山葵」命中收藏品；「小技巧」22 张，搜「普攻自动」「刷牵绊」「NPC 作息」命中。
13. 物品、技巧、牵绊与 NPC 不进任务统计；牵绊/NPC id 进 `progress.lock.json`，改完跑 `node tools/build.mjs` 和 `--check`，新增/改名牵绊或 NPC 时才需要 `--lock`。
14. Pokopia「物品」：1710 件 / 12 类；默认显示中文名 + 英文灰字，337 件标「原名」；筛选「材料」60 件，叠加地点「空空镇」8 件、方式「商店」仍 8 件；搜「石头」与「Stone」都命中；搜「方块类」同时命中图鉴里的宝可梦和物品；悬停喜好标签显示英文原名；窄屏（≤420px）无横向溢出。
15. 流程交叉链接：Pokopia 第 1 章点「杰尼龟」切到图鉴并搜到宝可梦条目，点「火堆」切到物品并展开；链接悬停有提示；幻想传说 / 缩小帽 / 永恒传说不出现误链（0 个）。

## 已知风险与待办

见 `docs/HANDOFF.md`，优先级最高的是**译名对齐**：现有译名是民间通行译法，未必等于用户手上 CHS 补丁的实际用词。发现不一致就跑 `node tools/build.mjs --rename 旧=新 --game <游戏 id>`，一次改正文、`src/names.js` 与进度快照。

- 幻想传说 X 核对名单：克雷斯 / 敏特 / 切斯特 / 克拉斯 / 阿琪 / 隆德莉涅 / 达奥斯 / 尤克里德 / 阿尔瓦尼斯坦 / 米德加尔斯 / 温蒂妮。
- 永恒传说待核对：里德 / 法拉 / 基尔 / 梅露笛 / 雷斯 / 查特 / 佛格 / 希洁尔 / 涅瑞德 / 希亚德斯 / 蕾西丝 / 加迪安特 / 塞尔西乌斯，以及道具名（术士戒指、冰冻指环、分光镜、五刃短剑、艾克斯卡利巴）与晶灵术名。术名目前只保留日文灰字，没有臆造中文译名。
- 宝可梦 Pokopia：城镇、道具、栖息地、特长没有可靠中文，保留英文灰字或英文原名；宝可梦与主系列招式用 PokéAPI 简体官方名，游戏内可能不同。图鉴从 Serebii 详情页抽取，未逐条进游戏对照；其余存疑项见 `--verbose`。
- 永恒传说的流程事实来自两份日文攻略站，**不含中文一手资料**，全篇未逐条二次核对，两处来源的原始链接待补。各作的存疑项见 `--verbose`。
- 永恒传说里仍有少量裸露日文（称号、部分道具与术名，如 `ころがしめいじん`、`アイフリードの洞窟`），目前查不到补丁译名，宁缺不编。
- 多文件交付：拷机时必须带 `index.html`、`assets/`、`games/` 三样；只拷 `index.html` 会没有样式、脚本和数据。个别浏览器若禁止 `file://` 加载本地经典脚本，改用本地 http 服务。
- 异度之刃「全物品」覆盖中文维基物品命名空间的 1504 件武器/防具/收藏品；素材、关键物品、战技书、宝珠没有独立物品页，分别放在任务表、殖民地6 清单和职业/战技说明里，不是遗漏。
- 物品行只列价格与基础攻击/防御；暴击、格挡、插槽宝石、特性等细节以游戏内为准。
- 异度之刃：殖民地6 有 5 条中文维基缺页任务，中文名为暂拟；NS2 新增 1 条任务的中文名也是暂译。游戏内核对后跑 `--rename --game xenoblade` 修正。
- 异度之刃 130 条限时任务的期限按剧情事件归纳（难民移居、奥达玛赴皇都、梅纳斯神殿、机神界中枢、离开中央工厂），未逐条对照游戏内任务菜单；发现偏差改对应任务的 `d` 即可，不需要 `--lock`。
- 异度之刃 Boss 中文名已按蒙纳多研究本部的主线攻略对齐（如黑色的费斯、佐德、伊达波思、使徒罗兰）；序章的六三式、八二式机神兵沿用第２章的型号写法，来源没有序章流程。
- 异度之刃牵绊对话 63 条按区域列出；中文名取 Xeno Series Wiki 的简体中文字段，地点是中文描述，未逐条进游戏对照。皇都封锁后能否补看，攻略站说法不一；本页按「第１５章前清完皇都 6 条」的稳妥路线标注。
- 刷牵绊数值（连锁 +10、激励 +10~30、复活/治疗 +20、任务 +20~100、送礼 +18~30）来自 iMore 与 TheGamer；不同版本可能有出入，以游戏内为准。
- 异度之刃 NPC 清单取中文维基 NPC 命名空间的 164 名有名 NPC，未逐条进游戏核对。同一 NPC 可能有多条作息/状态（剧情、任务分支、移民前后），页面全部列出并标「状态」；6:00–6:00 多为全天或任务期间。交易只列件数与最高星级，完整交易表以游戏内为准。
- 「相连的未来」43 个支线未逐条列入任务表；均无时限、无二选一，不影响主游戏 480 条的全任务统计。

## 事实来源

- 缩小帽流程与 Boss 机制：[GameFAQs 完整攻略](https://gamefaqs.gamespot.com/gba/920670-the-legend-of-zelda-the-minish-cap/faqs/47138)
- 幻想传说 X 四份流程表（含时限要素）：[なりきりダンジョンX まとめwiki](https://w.atwiki.jp/naridan-x/)（页 185–188）
- 永恒传说流程与时限要素：テイルズオブエターニア攻略はココ！、QiQoe（链接待补）
- 永恒传说流程与时限要素：[テイルズオブエターニア攻略はココ！](https://tales-of-eternia.kouryaku.red/)（第 1–3 碟流程表）；[QiQoe 攻略チャート](https://qiqoe.com/toe/toe-chart-list/)（分碟要点、Boss 弱点、不可挽回要素）
- 异度之刃任务、区域、Boss、殖民地6 复兴素材、NPC 清单/活动时间/常去地点/礼物/交易：[蒙纳多研究本部（xenoblade.cn）](https://xenoblade.cn/)
- 异度之刃主线流程与 Boss 机制：[Game8《Xenoblade Chronicles: Definitive Edition》攻略](https://game8.co/games/Xenoblade-Chronicles-Definitive-Edition)
- 异度之刃任务总数（480/481）、130 限时、25 组二选一：[Xenoblade Wiki（Fandom）](https://xenoblade.fandom.com/wiki/Quest_(XC1))
- 异度之刃牵绊对话清单、地点、牵绊值、昼夜与选项：[天幻网 FFSKY《异度之刃》专题](https://xenoblade.ffsky.cn/kizunatalk.htm)
- 异度之刃牵绊对话角色、开放章节与简体中文名：[Xeno Series Wiki《Heart-to-Heart (XC1)》](https://www.xenoserieswiki.org/wiki/Heart-to-Heart_(XC1))
- 异度之刃牵绊等级、战斗/任务/送礼收益：[iMore《Xenoblade Chronicles: Definitive Edition — Affinity Guide》](https://www.imore.com/xenoblade-chronicles-definitive-edition-affinity-guide)
- 各角色喜欢的收集品与送礼数值：[TheGamer《Best Gifts For Each Character》](https://www.thegamer.com/xenoblade-chronicles-definitive-edition-gift-guide/)
- 殖民地6 牵绊对话的复兴等级前置：[Gamer Guides《Heart-to-Hearts - Colony 6》](https://www.gamerguides.com/xenoblade-chronicles-definitive-edition/guide/affinity-chart/colony-6/heart-to-hearts)
- 宝可梦 Pokopia：[Serebii.net](https://www.serebii.net/pokemonpokopia/)、[Serebii 物品库](https://www.serebii.net/pokemonpokopia/items.shtml)、[Serebii Favorites](https://www.serebii.net/pokemonpokopia/favorites.shtml)、[Pokopia 攻略 Wiki（繁中）](https://pokopia.gamertw.com/zh-TW/item)、[Game8](https://game8.co/games/Pokemon-Pokopia/archives/583158)、[Nintendo Soup](https://nintendosoup.com/guide-how-to-befriend-all-legendary-pokemon-in-pokemon-pokopia)、[Pokopia Wiki](https://www.pokopiawiki.com/guides/how-to-befriend-with-raikou-entei-and-suicune)、[The Games Wiki](https://thegameswiki.com/pokopia/wiki/missable-events)；官方译名：[PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv)
- 汉化版存在性：幻想传说 X CHS 补丁 PSP 编号 `ULJS00293`；PS1《永恒传说》中文汉化版亦已存在（3 碟）
