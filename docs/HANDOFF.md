# Handoff — 复古掌机离线攻略页

> 交接时间：2026-10-31。接手者请先读本文件，再决定要不要读产物源码。
> 用户偏好已写入全局记忆（设备、离线/多文件偏好、**不看日文**），此处不重复。

## 1. 背景与目标

用户有一台 **Retroid Pocket G2**（Android 开源掌机），想补 GBA《塞尔达传说：缩小帽》、PSP《幻想传说 X（Cross Edition）》、PS1《永恒传说》，以及 Switch《异度之刃 决定版》（含 Switch 2 Edition）。他的核心痛点是：**老游戏没有任务指引，网上攻略散、旧、图全挂**，所以玩不进去。

已交付的解法不是文章，而是一个**多文件、离线、边玩边查**的攻略页。

后来加入 Switch 2《宝可梦 Pokopia》，所以站名从「老游戏通关手册」改为「游戏通关手册」；仓库名、网址和存储键 `retroGuide.v1` 不变。

## 2. 当前产物（工作区根目录）

| 文件 | 说明 |
|---|---|
| `index.html` | 主交付物骨架，由 `src/shell.html` 生成；只引用 `assets/` 与 `games/`，零外链 |
| `assets/app.css`、`assets/app.js`、`assets/themes.css` | 样式、渲染逻辑、主题变量，全部由 `src/` 生成 |
| `games/index.js`、`games/<id>.js` | 浏览器端游戏列表与各作数据，由 `src/games/*.js` 包装成经典脚本 |
| `top_x_ce_walkthrough.md` | 《幻想传说 X》日文 wiki 整理稿（552 行），含第 1 部逐项宝箱清单、时限要素速查表。是内容回溯的**事实源** |

功能：章节卡（可折叠、✓ 标记完成、顶部进度条、"现在该做第几章"）、卡关急救折叠 Q&A、可勾选收集清单、Boss 速查表、异度之刃的「全任务」追踪（481 条 / 17 区域 / 130 限时 / 25 组二选一，按区域折叠、按时限/二选一/完成度筛选、勾一条自动锁另一分支）、「牵绊」追踪（63 条 / 15 区域 / 6 条仅夜间，按区域折叠，按状态/角色/等级筛选，组头标区域时限）与「NPC」追踪（164 名 / 12 个活动区域 / 4 种族，按区域折叠，按登记/任务/交易/区域/种族/昼夜筛选）、任务卡按前置任务自动锁定后置（前置完成或「或」分支任一完成即解锁）、章节起止只显示提示不锁任务、二选一任务显示影响说明（选这条能接或会消失的后续）、任务章节条件与流程页勾选联动（第 X 章未勾选时锁定）、顶栏搜索（同时搜章节/Q&A/清单/Boss/任务/牵绊/NPC/珍稀种/系统）。进度存 `localStorage`（key `retroGuide.v1`），选中游戏也会记住。

## 3. 已定的设计约定（改动前请先确认，别随手推翻）

1. **中文优先**。人名、地名、道具、术技一律用汉化译名，日文原名降为灰色小字，写法是 `克雷斯（<i class='jp'>クレス</i>）`。用户明确说过看不懂日文，**不要再把日文提回正文**。
2. **多文件、零外链**。`index.html` + `assets/` + `games/` 三样一起拷进掌机，必须离线可用；不能引入 CDN、字体、图片外链。
3. **信息密度优先于文采**。每章 = 目标 + 分步 + 该拿的东西 + 易漏/卡点 + Boss 解法，不写叙事。
4. **时限要素必须单独标黄**（`.warn`）。这是这类老游戏最劝退的部分，也是这个页面的核心价值。
5. 主题色按游戏定义在数据的 `theme` 对象里；构建时默认游戏生成 `:root`，其余生成 `body[data-game="<id>"]`，统一写进 `assets/themes.css`。全部走 CSS 变量（`--acc`/`--acc2`/`--a04`…`--a70`/`--glow1` 等），**改配色只动对应游戏的 `theme`**。标签圆点色取 `theme["--acc"]`，不再单独维护 `accent`。

## 4. 技术结构（改内容看这里）

- 骨架在 `src/shell.html`，样式在 `src/app.css`，渲染在 `src/app.js`，数据在 `src/games/*.js`，游戏列表与顺序在 `src/games/index.js`。构建生成 `index.html` + `assets/` + `games/`，字段模型见 `README.md`。
- `src/games/index.js` 是唯一的游戏注册表：`GAME_IDS` 数组列出所有游戏 id；数组顺序就是标签页顺序。新增文件不登记、索引里的 id 与文件名不一致，`--check` 都会红。
- 构建把 `src/app.css`/`src/app.js` 复制到 `assets/`，把各作 `theme` 合成为 `assets/themes.css`，把 `GAME_IDS` 写成 `games/index.js`，把每作数据包装成 `games/<id>.js` 经典脚本，挂到 `window.RETRO_GAMES`。`src/app.js` 从 `window.RETRO_GAME_IDS` / `window.RETRO_GAMES` 取数据。
- 章节字段：`{id, n, title, area, goal, steps[], items[], warn[], boss:{name,tip}, tip}`。`steps/goal/warn/boss.tip` 按 HTML 原样插入（可写 `<b>`），`items` 会被转义。
- 主题字段：`theme:{"--bg":..., "--acc":..., ...}`。构建时从数据生成 `assets/themes.css`；新增游戏不要再改 `src/app.css` 或 `src/shell.html` 的主题块。
- 任务字段：`quests:[{area, items:[{id, n, g, t, x, s, ns2, v, d, m, e, f, rw}]}]`。`t` 限时、`x` 二选一组（同组正好 2 条）、`s` 剧情、`ns2` NS2 新增、`v` 译名待核、`d` 期限、`m/e/f` 金钱/EXP/评价、`rw` 奖励道具数组。勾选存 `state.quests[游戏 id][任务 id]`；奖励显示在任务下方，并参与搜索。
- 牵绊字段：`bonds:[{area, warn?, items:[{id, n, loc, chars[2], pts, night, unlock, req, alt}]}]`、`bondMeta:{title, tab, chars[], note, foot}`。`pts` 只用 500/1000/2000/3000/5000；`bondMeta.chars` 是角色筛选表，必须覆盖每条牵绊的两个人名；组上的 `warn` 渲染成区域黄框；勾选存 `state.bonds[游戏 id][牵绊 id]`。
- NPC 字段：`npcs:[{area, items:[{id, n, race, sex, age, jobs[], schedules[{a,l,t}], gifts[], tradeCount, tradeMax, tradeTop[], variant?}]}]`、`npcMeta:{title, tab, races[], areas[], note, foot}`。同一 NPC 的多条作息放 `schedules`；`race` 与 `schedules[].a` 必须出现在 `npcMeta.races/areas`；任务按委托人名从 `quests` 动态匹配；勾选存 `state.npcs[游戏 id][NPC id]`。
- 物品/技巧字段：`catalog:[{t, items:[{n, p, a, u, w}]}]`、`catalogUsers:[{n, armor, medium, mech}]`、`tips:[{t, a}]`。物品按类型分组，覆盖武器/防具/收藏品 1504 件；素材与关键物品在任务表和殖民地6 清单里。物品与技巧不参与进度键，不进 `progress.lock.json`。
- 章节 `id`、收集项位置、任务 `id`、牵绊 `id`、NPC `id` 是进度持久化的键，规则见 `AGENTS.md`，现状记录在 `src/progress.lock.json`。
- `build()` 每次切换游戏时整体重渲染；完成勾选只做局部更新（章节/任务/牵绊/NPC 进度条、TOC、计数、二选一锁定），不重绘页面，避免滚动位置跳动。
- 搜索：每个可搜元素带 `data-search`，文本先 `.replace(/<[^>]+>/g," ")` 去掉标签再小写化；任务项还叠加「限时/二选一/未完成/已完成」筛选，牵绊项叠加「状态/角色/等级」筛选，NPC 项叠加「登记/任务/交易/区域/种族/昼夜」筛选，搜索与筛选同时生效。

## 5. 待办与已知风险（按优先级）

1. **译名对齐（最高优先）**。当前译名是民间通行译法，未必等于用户手上那个 CHS 补丁的实际用词（例如"敏特"可能被译成"敏朵"）。已告知用户：发现不一致就报实际用词，一次性替换。需要重点核对：克雷斯 / 敏特 / 切斯特 / 克拉斯 / 阿琪 / 隆德莉涅 / 达奥斯 / 尤克里德 / 阿尔瓦尼斯坦 / 米德加尔斯 / 温蒂妮；异度之刃的殖民地6 缺页任务、NS2 新增任务和 Boss 中文名见下。
2. **缩小帽最终战（库夫 / Vaati 三连战）**已按 GameFAQs 攻略补充各阶段打法，未实机验证。缩小帽译名优先取 Zelda Wiki 的官方简体译名，其次取中文维基，查不到的保留英文。
3. **「罗迪」**（幻想传说 瓦尔哈拉战役后临时加入、达奥斯战前离队）来自日文 wiki，未二次核实，属可接受的存疑项。
4. 缩小帽的「心之碎片 ×3（神殿内外）」等数量为近似值，未逐一核对全集。
5. **异度之刃的 5 条殖民地6 缺页任务**（玛克莉丝篇 2 条、恩·阿尔詹蒂斯篇 3 条）中文名为暂拟；NS2 新增 1 条任务的中文名也是暂译。进游戏核对后跑 `--rename --game xenoblade`，注意 `--rename` 也会改任务名和进度快照。
6. **异度之刃 130 条限时任务的期限**按剧情事件归纳，未逐条对照游戏内任务菜单；发现偏差改对应任务的 `d` 即可，不需要 `--lock`。任务名、`t`、`x` 变化才会让 `--check` 红。
7. **异度之刃 Boss 中文名**已按蒙纳多研究本部的主线攻略对齐；「相连的未来」43 个支线未逐条列入任务表（均无时限、无二选一）。
7.1 **异度之刃牵绊对话** 63 条按区域列出，中文名取 Xeno Series Wiki 的简体中文字段，地点是中文描述，未逐条进游戏对照。皇都封锁后能否补看，攻略站说法不一；本页按「第１５章前清完皇都 6 条」的稳妥路线标注。刷牵绊数值来自 iMore 与 TheGamer，版本差异以游戏内为准。
7.2 **异度之刃 NPC** 164 名取中文维基 NPC 命名空间，未逐条进游戏核对。同一 NPC 可能有多条作息/状态（剧情、任务分支、移民前后），页面全部列出并标「状态」；6:00–6:00 多为全天或任务期间。交易只列件数与最高星级。
7.3 **异度之刃珍稀种** 177 只（本篇 157 + 相连的未来 20）取蒙纳多研究本部敌人页，含等级、HP 与筛选后的掉落（素材、结晶、U 武器/装备、战技书）。出现条件（天气/时间）未收录，具体位置以游戏内地图为准；S 武器/防具是随机词条，未逐条列出。
7.4 **异度之刃系统页** 的宝珠 88 条、战技 138 条、商店 1126 件、挑战战斗 20 条、性格 35 条、诺彭调查队 12 人都取蒙纳多研究本部与 Xeno Series Wiki，未逐条进游戏核对。商店商品随剧情、殖民地等级与昼夜变化，以游戏内为准。
7.5 **相连的未来** 43 条支线取 Xeno Series Wiki，任务名与 NPC 名保留英文（中文维基无此章节条目），步骤按中文动作模板翻译；四部流程取 Game8。任务页底部单列，勾选独立记进度，不计入主任务统计。
8. 用户若想换配色，只需给一个色相倾向（紫/红/青），改对应游戏的 `theme` 对象即可。
9. 可选扩展：加更多游戏（同一套结构，报名字即可）、把地图/路线画进页面、导出 A5 小册子、做成 PWA（需 http 托管才能装）。

10. **Pokopia 译名待核**：用户选择只用网上资料，城镇、道具、栖息地保留英文。有人进游戏核对后，用 `--rename --game pokopia` 改译名表里的名字，其余英文直接改 `src/games/pokopia.js`。
11. **Pokopia 版本**：内容对应 Ver. 2.0.0 + Bubbly Basin。扩展票 Part 2（2026 年末）、Part 3（2027）发售后用新章节 id 和收集清单新组追加；活动档期追加到活动组组尾。

## 6. 怎么验证改动

```bash
python3 -m http.server 8765      # 工作区根目录
# 然后浏览器打开 http://127.0.0.1:8765/index.html
```

- 本环境优先用 DOM 断言验证：节点数量、`getComputedStyle` 取 `--acc`/`backgroundColor`、`localStorage` 往返、`scrollWidth > innerWidth` 查横向溢出；异度之刃再断言 481 条任务、475 条接取条件、130 限时、50 条二选一、勾一条锁另一条、相连未来 43 条、牵绊 63 条 / 15 区域 / 6 条仅夜间、「菲奥伦」18 条、「粉」21 条、NPC 164 名 / 12 个活动区域 / 4 种族、「有任务」135 名、「诺彭」58 名、珍稀种 177 只 / 20 区域、系统 6 类（宝珠 88 / 战技 138 / 商店 1126 / 挑战 20 / 性格 35 / 诺彭 12）、全物品 1504 件 / 7 类、小技巧 23 张，搜「甜山葵」「普攻自动」「刷牵绊」「帕欧菈」「七星的古森」「Wunwun」能命中；「了解梅妮」初始被「精英小队长的苦恼」锁定，勾选前置后解锁，取消后重新锁定；「料理人杰克森」初始被第５章锁定，勾上流程第５章和「杰克森的觉醒」后解锁，取消章节后重新锁定。
- 自动化工具可能拒绝 `file://`，回归走本地 http；另外用 Chrome 直接打开 `file://` 确认 `index.html` + `assets/` + `games/` 能正常加载。
- 拷机形态：把 `index.html`、`assets/`、`games/` 三样一起拷到一个目录，打开 `index.html`。只拷 `index.html` 会没有样式、脚本和数据。
- 回归检查清单见 `AGENTS.md` 的完成标准。

## 7. 建议加载的技能

| 场景 | 技能 |
|---|---|
| 继续打磨界面/配色/信息层级 | `impeccable` |
| 核对攻略事实、译名、补全 Boss 机制（需一手来源） | `research` |
| 想把攻略导出成可打印小册子 | `office-export-pdf` |

## 8. 事实来源（供复核）

- 缩小帽流程与 Boss 机制：[GameFAQs 完整攻略](https://gamefaqs.gamespot.com/gba/920670-the-legend-of-zelda-the-minish-cap/faqs/47138)
- 幻想传说 X 四份流程表（含时限要素）：[なりきりダンジョンX まとめwiki](https://w.atwiki.jp/naridan-x/)（页 185–188）
- 异度之刃任务、区域、Boss、殖民地6 复兴素材、NPC 清单/活动时间/常去地点/礼物/交易：[蒙纳多研究本部（xenoblade.cn）](https://xenoblade.cn/)
- 异度之刃主线流程与 Boss 机制：[Game8《Xenoblade Chronicles: Definitive Edition》攻略](https://game8.co/games/Xenoblade-Chronicles-Definitive-Edition)
- 异度之刃任务总数（480/481）、130 限时、25 组二选一：[Xenoblade Wiki（Fandom）](https://xenoblade.fandom.com/wiki/Quest_(XC1))
- 异度之刃牵绊对话清单、地点、牵绊值、昼夜与选项：[天幻网 FFSKY《异度之刃》专题](https://xenoblade.ffsky.cn/kizunatalk.htm)
- 异度之刃牵绊对话角色、开放章节与简体中文名：[Xeno Series Wiki《Heart-to-Heart (XC1)》](https://www.xenoserieswiki.org/wiki/Heart-to-Heart_(XC1))
- 牵绊等级、战斗/任务/送礼收益：[iMore《Xenoblade Chronicles: Definitive Edition — Affinity Guide》](https://www.imore.com/xenoblade-chronicles-definitive-edition-affinity-guide)
- 各角色喜欢的收集品与送礼数值：[TheGamer《Best Gifts For Each Character》](https://www.thegamer.com/xenoblade-chronicles-definitive-edition-gift-guide/)
- 殖民地6 牵绊对话的复兴等级前置：[Gamer Guides《Heart-to-Hearts - Colony 6》](https://www.gamerguides.com/xenoblade-chronicles-definitive-edition/guide/affinity-chart/colony-6/heart-to-hearts)
- 相连未来 43 条支线（名称、类型、地点、委托人、前置、步骤、奖励）：[Xeno Series Wiki《Quest (XC1)》](https://www.xenoserieswiki.org/wiki/Quest_(XC1))
- 相连未来四部流程、Boss 与诺彭调查队顺序：[Game8《Future Connected Walkthrough》](https://game8.co/games/Xenoblade-Chronicles-Definitive-Edition/archives/289428)
- 汉化版存在性：CHS 补丁，PSP 编号 `ULJS00293`
