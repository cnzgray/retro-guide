# Handoff — 复古掌机离线攻略页

> 交接时间：2026-10-31。接手者请先读本文件，再决定要不要读产物源码。
> 用户偏好已写入全局记忆（设备、离线/多文件偏好、**不看日文**），此处不重复。

## 1. 背景与目标

用户有一台 **Retroid Pocket G2**（Android 开源掌机），想补 GBA《塞尔达传说：缩小帽》、PSP《幻想传说 X（Cross Edition）》、PS1《永恒传说》，以及 Switch《异度之刃 决定版》（含 Switch 2 Edition）。他的核心痛点是：**老游戏没有任务指引，网上攻略散、旧、图全挂**，所以玩不进去。

已交付的解法不是文章，而是一个**多文件、离线、边玩边查**的攻略页。

## 2. 当前产物（工作区根目录）

| 文件 | 说明 |
|---|---|
| `index.html` | 主交付物骨架，由 `src/shell.html` 生成；只引用 `assets/` 与 `games/`，零外链 |
| `assets/app.css`、`assets/app.js`、`assets/themes.css` | 样式、渲染逻辑、主题变量，全部由 `src/` 生成 |
| `games/index.js`、`games/<id>.js` | 浏览器端游戏列表与各作数据，由 `src/games/*.js` 包装成经典脚本 |
| `top_x_ce_walkthrough.md` | 《幻想传说 X》日文 wiki 整理稿（552 行），含第 1 部逐项宝箱清单、时限要素速查表。是内容回溯的**事实源** |

功能：章节卡（可折叠、✓ 标记完成、顶部进度条、"现在该做第几章"）、卡关急救折叠 Q&A、可勾选收集清单、Boss 速查表、异度之刃的「全任务」追踪（481 条 / 17 区域 / 130 限时 / 25 组二选一，按区域折叠、按时限/二选一/完成度筛选、勾一条自动锁另一分支）、顶栏搜索（同时搜章节/Q&A/清单/Boss/任务）。进度存 `localStorage`（key `retroGuide.v1`），选中游戏也会记住。

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
- 物品/技巧字段：`catalog:[{t, items:[{n, p, a, u, w}]}]`、`catalogUsers:[{n, armor, medium, mech}]`、`tips:[{t, a}]`。物品按类型分组，覆盖武器/防具/收藏品 1504 件；素材与关键物品在任务表和殖民地6 清单里。两者不参与进度键，不进 `progress.lock.json`。
- 章节 `id`、收集项位置、任务 `id` 是进度持久化的键，规则见 `AGENTS.md`，现状记录在 `src/progress.lock.json`。
- `build()` 每次切换游戏时整体重渲染；完成勾选只做局部更新（章节/任务进度条、TOC、计数、二选一锁定），不重绘页面，避免滚动位置跳动。
- 搜索：每个可搜元素带 `data-search`，文本先 `.replace(/<[^>]+>/g," ")` 去掉标签再小写化；任务项还叠加「限时/二选一/未完成/已完成」筛选，搜索与筛选同时生效。

## 5. 待办与已知风险（按优先级）

1. **译名对齐（最高优先）**。当前译名是民间通行译法，未必等于用户手上那个 CHS 补丁的实际用词（例如"敏特"可能被译成"敏朵"）。已告知用户：发现不一致就报实际用词，一次性替换。需要重点核对：克雷斯 / 敏特 / 切斯特 / 克拉斯 / 阿琪 / 隆德莉涅 / 达奥斯 / 尤克里德 / 阿尔瓦尼斯坦 / 米德加尔斯 / 温蒂妮；异度之刃的殖民地6 缺页任务、NS2 新增任务和 Boss 中文名见下。
2. **缩小帽最终战（Vaati 三连战）描述刻意笼统**，未核实各阶段机制，目前只写"三连战、带妖精、弱点会转移"。如果要补，先查证再写，不要编。
3. **「罗迪」**（幻想传说 瓦尔哈拉战役后临时加入、达奥斯战前离队）来自日文 wiki，未二次核实，属可接受的存疑项。
4. 缩小帽的「心之碎片 ×3（神殿内外）」等数量为近似值，未逐一核对全集。
5. **异度之刃的 5 条殖民地6 缺页任务**（玛克莉丝篇 2 条、恩·阿尔詹蒂斯篇 3 条）中文名为暂拟；NS2 新增 1 条任务的中文名也是暂译。进游戏核对后跑 `--rename --game xenoblade`，注意 `--rename` 也会改任务名和进度快照。
6. **异度之刃 130 条限时任务的期限**按剧情事件归纳，未逐条对照游戏内任务菜单；发现偏差改对应任务的 `d` 即可，不需要 `--lock`。任务名、`t`、`x` 变化才会让 `--check` 红。
7. **异度之刃 Boss 中文名**（金属脸、札德、雅尔达巴奥特、罗利西亚等）部分按通行译法，未与官方中文逐字核对；「相连的未来」43 个支线未逐条列入任务表（均无时限、无二选一）。
8. 用户若想换配色，只需给一个色相倾向（紫/红/青），改对应游戏的 `theme` 对象即可。
9. 可选扩展：加更多游戏（同一套结构，报名字即可）、把地图/路线画进页面、导出 A5 小册子、做成 PWA（需 http 托管才能装）。

## 6. 怎么验证改动

```bash
python3 -m http.server 8765      # 工作区根目录
# 然后浏览器打开 http://127.0.0.1:8765/index.html
```

- 本环境优先用 DOM 断言验证：节点数量、`getComputedStyle` 取 `--acc`/`backgroundColor`、`localStorage` 往返、`scrollWidth > innerWidth` 查横向溢出；异度之刃再断言 481 条任务、130 限时、50 条二选一、勾一条锁另一条、全物品 1504 件 / 7 类、小技巧 18 张，搜「甜山葵」「普攻自动」能命中。
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
- 异度之刃任务、区域、Boss、殖民地6 复兴素材：[蒙纳多研究本部（xenoblade.cn）](https://xenoblade.cn/)
- 异度之刃主线流程与 Boss 机制：[Game8《Xenoblade Chronicles: Definitive Edition》攻略](https://game8.co/games/Xenoblade-Chronicles-Definitive-Edition)
- 异度之刃任务总数（480/481）、130 限时、25 组二选一：[Xenoblade Wiki（Fandom）](https://xenoblade.fandom.com/wiki/Quest_(XC1))
- 汉化版存在性：CHS 补丁，PSP 编号 `ULJS00293`
