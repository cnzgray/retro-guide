# 老游戏通关手册

![vibe coded](https://img.shields.io/badge/vibe_coded-100%25-ff69b4?style=flat-square)

Retroid Pocket G2（Android 开源掌机）上边玩边查的单页攻略，覆盖四作：

- **GBA《塞尔达传说：缩小帽》**
- **PSP《幻想传说 X（Cross Edition）》**
- **PS1《永恒传说》**
- **Switch《异度之刃 决定版》（含 Switch 2 Edition 新增内容）**

老游戏没有任务指引，网上攻略又散、又旧、图还全挂。所以这里交付的不是文章，而是一个**多文件、零外链、`file://` 直接打开**的速查页：`index.html` 只做骨架，`assets/` 放样式和渲染逻辑，`games/` 一作一个数据文件。章节卡折叠 + 进度勾选 + 卡关 Q&A + 收集清单 + Boss 速查 + 全站搜索，进度存本地。

第四作是另一个量级：480 条任务、130 条限时、25 组二选一。页面为此加了「全任务」追踪：按区域列出每一条任务，标出时限与二选一，勾选后自动锁定另一分支；单周目最多 455 条（NS2 版 456 条）。

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

效果如何自己判：`node tools/build.mjs --check` 全绿，CI 拦漂移，产物合计约 300 KB 零依赖，单个游戏数据文件独立增长。

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | **产物**，站点骨架：只含 HTML、内联 favicon 和三个外链引用，不手改 |
| `assets/app.css` | **产物**：样式表，由 `src/app.css` 生成 |
| `assets/app.js` | **产物**：渲染逻辑，由 `src/app.js` 生成 |
| `assets/themes.css` | **产物**：各作主题变量，构建时从 `src/games/*.js` 的 `theme` 生成 |
| `games/index.js` | **产物**：浏览器端游戏 id 列表，顺序即标签页顺序 |
| `games/minish.js`、`topx.js`、`eternia.js`、`xenoblade.js` | **产物**：各作数据，由 `src/games/*.js` 包装成经典脚本，挂到 `window.RETRO_GAMES` |
| `src/shell.html` | 骨架源文件：只写 HTML 结构和资源引用，含 `<!-- __GAME_SCRIPTS__ -->` 占位符 |
| `src/app.css` | 样式源文件 |
| `src/app.js` | 渲染源文件；从 `window.RETRO_GAME_IDS` / `window.RETRO_GAMES` 读数据 |
| `src/games/minish.js`、`topx.js`、`eternia.js`、`xenoblade.js` | 攻略数据源文件，一个游戏一个文件，`export default { ... }`；主题在 `theme`，异度之刃任务表在 `quests` |
| `src/games/index.js` | 构建期游戏索引：`GAME_IDS` 数组列出所有游戏 id，数组顺序就是标签页顺序；新增文件不登记会被 `--check` 拦住 |
| `src/names.js` | 译名单点：按游戏分表，日文原名 → 汉化译名 |
| `src/progress.lock.json` | 进度键快照：章节 id、标题、`warn` 数、收集项顺序、任务 id/名称/限时/二选一组 |
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

`--check` 拦这些问题：数据语法错误、字段缺失、标签未闭合、转义字段写了标签、章节 id 重复、译名不一致、主题变量或来源署名缺失、任务 id 重复、二选一组不是 2 条、限时任务没有期限、物品类型重复或物品字段缺失、小技巧字段缺失、游戏文件没进 `src/games/index.js`、骨架里有内联样式/脚本、外链、`app.js` 或游戏脚本语法错误、任一产物漂移、多余的游戏脚本，以及进度键变更。它只检查结构，不验证攻略事实，也不运行页面，发布前仍要走下面的回归清单。

**进度键**：章节按 `id` 存进度，收集项按「组序号-项序号」存，任务按任务 `id` 存。章节 id 和任务 id 只增不删，`--lock` 也不接受删除；中途插章用新 id，只改 `n` 决定显示顺序。收集项只能追加到组尾。标题、`warn` 数、收集项、任务名/限时标记/二选一组变化会让 `--check` 失败，确认没有换内容、没有丢时限要素后跑 `--lock`。二选一组必须正好 2 条，任务表新增时也只能追加。

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

```
GAMES[]                     游戏
├─ id / title / sub / short / tabs / metas / intro
├─ （顺序）                 src/games/index.js 的 GAME_IDS 数组顺序
├─ theme{}                  主题 CSS 变量；构建时生成 :root / body[data-game] 块
├─ sources[]                来源署名，须同时出现在页脚与 LICENSE-CONTENT.md
├─ unverified[]             可选，存疑事项，不渲染，`--verbose` 列出
├─ chapters[]               章节：{id, n, title, area, goal, steps[], items[], warn[], boss:{name,tip}, tip}
├─ quests[]                 全任务：{area, items:[{id, n, g, t, x, s, ns2, v, d, m, e, f, rw[]}]}
├─ catalog[]                全物品：{t, items:[{n, p, a}]}；武器/防具/收藏品
├─ tips[]                   小技巧：{t, a}
├─ qa[]                     卡关急救：{q, a}
├─ checks[]                 收集清单分组：{t, items[]}
└─ bosses[]                 Boss 速查：{n, s, t}
```

- 章节 `id` 是进度持久化的键，**改名会丢掉用户已勾的进度**；id 与显示顺序无关，顺序由 `n` 决定。
- `quests` 的 `id` 是任务进度的键，只增不删；`t` 标限时，`x` 是二选一组（同组必须正好 2 条），`s` 标剧情，`ns2` 标 NS2 新增，`v` 标译名待核，`d` 是期限文案，`m/e/f` 是金钱/EXP/评价，`rw` 是奖励道具数组。限时任务必须有 `d`（或所在组有 `d`）。
- `catalog` 按物品类型分组：`n` 名称、`p` 价格、`a` 基础数值或收藏品区域/类别。当前覆盖武器/防具/收藏品 1504 件；素材和关键物品没有独立物品页，散落在任务报酬与殖民地6 清单里。`tips` 是 `{t, a}` 小技巧卡片。
- `steps / goal / warn / boss.tip / qa.a / bosses.t` 按 HTML 原样插入（可写 `<b>`）；`title / area / items`、收集项、任务名/委托人/期限、`boss.name` 等会被转义，不能写标签。
- 主题变量写在 `theme` 对象里；构建时默认游戏生成 `:root`，其余生成 `body[data-game="<id>"]` 到 `assets/themes.css`。标签圆点色直接取 `theme["--acc"]`，不再单独维护 `accent`。
- `build()` 每次切换游戏整体重渲染；勾选章节/任务/收集项只做局部更新，不重绘整页，避免滚动位置跳动。
- 搜索靠每个可搜元素的 `data-search`，文本先 `.replace(/<[^>]+>/g," ")` 去标签再小写化；任务项还会叠加「限时/二选一/未完成/已完成」筛选。
- 进度存 `localStorage`，key `retroGuide.v1`：`{game, done:{<游戏 id>:[]}, checks:{...}, quests:{<游戏 id>:{<任务 id>:1}}}`，选中游戏也会记住。
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

## 授权与免责

- **代码**（HTML 结构 / CSS / JS）：MIT，见 `LICENSE`。
- **攻略正文**：CC BY-NC-SA 4.0——署名、非商业、相同方式共享。完整条款、原始来源与不涵盖的内容见 `LICENSE-CONTENT.md`。
- **不收录**：游戏本体、ROM、汉化补丁、官方图像或攻略本扫描。发现被添加请直接回滚。
- 游戏名称、角色、地名等著作权与商标归任天堂 / 万代南梦宫 / Monolith Soft 等各自权利人所有；本项目为非官方同人作品，与发行方无关。

## 验证

回归检查清单：

0. `node tools/build.mjs --check` 退出 0（`index.html`、`assets/`、`games/` 全部无漂移，无译名/结构问题）；
1. 各作章节数与 `src/progress.lock.json` 一致；异度之刃任务表为 481 条 / 17 区域 / 130 限时 / 50 条二选一（25 组）；切换游戏无控制台报错；
2. 搜索中文名（如「克雷斯」「恋爱成就」）能命中并展开对应章节/任务；
3. 勾选章节 → 进度条 / 「现在该做」更新 → 刷新后仍保留；勾选任务 → 任务进度条更新 → 刷新后仍保留；
4. 切到缩小帽 `--acc` 为 `#56dd91`、`meta[theme-color]` 为 `#0c1310`；幻想传说 `#849cff` / `#0a0c15`；永恒传说 `#b48cff` / `#0b0a14`；异度之刃 `#5ad1ff` / `#071018`；
5. 窄屏（≤420px）无横向溢出：`document.documentElement.scrollWidth <= window.innerWidth`；
6. 页脚免责声明在各作下都可见，切换游戏不被 `build()` 清掉；
7. 异度之刃「全任务」：限时筛选 130 条、二选一筛选 50 条、搜索与筛选叠加后仍正确；每条任务显示「奖励：…」，搜索道具名（如「游泳凉鞋」）能命中；勾选一条二选一后另一条变灰且不可勾，取消后恢复；
8. 主题变量只存在于 `src/games/*.js` 的 `theme` 对象；`assets/themes.css` 由构建生成，仍能正常切换配色；
9. 多文件：`index.html` 只引用 `assets/` 与 `games/`，没有内联样式/脚本；把三样一起拷到别处，`file://` 能打开并加载 481 条任务；删掉 `games/xenoblade.js` 后页面应缺少异度之刃数据（证明不是内嵌的）。
10. 异度之刃「全物品」：1504 件 / 7 类型；防具筛选 883 件；搜「甜山葵」命中收藏品；「小技巧」18 张，搜「普攻自动」命中。
11. 物品与技巧不进 `progress.lock.json`；改完跑 `node tools/build.mjs` 和 `--check` 即可，不需要 `--lock`。

## 已知风险与待办

见 `docs/HANDOFF.md`，优先级最高的是**译名对齐**：现有译名是民间通行译法，未必等于用户手上 CHS 补丁的实际用词。发现不一致就跑 `node tools/build.mjs --rename 旧=新 --game <游戏 id>`，一次改正文、`src/names.js` 与进度快照。

- 幻想传说 X 核对名单：克雷斯 / 敏特 / 切斯特 / 克拉斯 / 阿琪 / 隆德莉涅 / 达奥斯 / 尤克里德 / 阿尔瓦尼斯坦 / 米德加尔斯 / 温蒂妮。
- 永恒传说待核对：里德 / 法拉 / 基尔 / 梅露笛 / 雷斯 / 查特 / 佛格 / 希洁尔 / 涅瑞德 / 希亚德斯 / 蕾西丝 / 加迪安特 / 塞尔西乌斯，以及道具名（术士戒指、冰冻指环、分光镜、五刃短剑、艾克斯卡利巴）与晶灵术名。术名目前只保留日文灰字，没有臆造中文译名。
- 永恒传说的流程事实来自两份日文攻略站，**不含中文一手资料**，全篇未逐条二次核对，两处来源的原始链接待补。各作的存疑项见 `--verbose`。
- 永恒传说里仍有少量裸露日文（称号、部分道具与术名，如 `ころがしめいじん`、`アイフリードの洞窟`），目前查不到补丁译名，宁缺不编。
- 多文件交付：拷机时必须带 `index.html`、`assets/`、`games/` 三样；只拷 `index.html` 会没有样式、脚本和数据。个别浏览器若禁止 `file://` 加载本地经典脚本，改用本地 http 服务。
- 异度之刃「全物品」覆盖中文维基物品命名空间的 1504 件武器/防具/收藏品；素材、关键物品、战技书、宝珠没有独立物品页，分别放在任务表、殖民地6 清单和职业/战技说明里，不是遗漏。
- 物品行只列价格与基础攻击/防御；暴击、格挡、插槽宝石、特性等细节以游戏内为准。
- 异度之刃：殖民地6 有 5 条中文维基缺页任务，中文名为暂拟；NS2 新增 1 条任务的中文名也是暂译。游戏内核对后跑 `--rename --game xenoblade` 修正。
- 异度之刃 130 条限时任务的期限按剧情事件归纳（难民移居、奥达玛赴皇都、梅纳斯神殿、机神界中枢、离开中央工厂），未逐条对照游戏内任务菜单；发现偏差改对应任务的 `d` 即可，不需要 `--lock`。
- 异度之刃 Boss 中文名（金属脸、札德、雅尔达巴奥特、罗利西亚等）部分按通行译法，未与官方中文逐字核对。
- 「相连的未来」43 个支线未逐条列入任务表；均无时限、无二选一，不影响主游戏 480 条的全任务统计。

## 事实来源

- 缩小帽流程与 Boss 机制：[GameFAQs 完整攻略](https://gamefaqs.gamespot.com/gba/920670-the-legend-of-zelda-the-minish-cap/faqs/47138)
- 幻想传说 X 四份流程表（含时限要素）：[なりきりダンジョンX まとめwiki](https://w.atwiki.jp/naridan-x/)（页 185–188）
- 永恒传说流程与时限要素：テイルズオブエターニア攻略はココ！、QiQoe（链接待补）
- 永恒传说流程与时限要素：[テイルズオブエターニア攻略はココ！](https://tales-of-eternia.kouryaku.red/)（第 1–3 碟流程表）；[QiQoe 攻略チャート](https://qiqoe.com/toe/toe-chart-list/)（分碟要点、Boss 弱点、不可挽回要素）
- 异度之刃任务、区域、Boss、殖民地6 复兴素材：[蒙纳多研究本部（xenoblade.cn）](https://xenoblade.cn/)
- 异度之刃主线流程与 Boss 机制：[Game8《Xenoblade Chronicles: Definitive Edition》攻略](https://game8.co/games/Xenoblade-Chronicles-Definitive-Edition)
- 异度之刃任务总数（480/481）、130 限时、25 组二选一：[Xenoblade Wiki（Fandom）](https://xenoblade.fandom.com/wiki/Quest_(XC1))
- 汉化版存在性：幻想传说 X CHS 补丁 PSP 编号 `ULJS00293`；PS1《永恒传说》中文汉化版亦已存在（3 碟）
