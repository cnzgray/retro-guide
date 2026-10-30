# retro-guide · 掌机离线攻略速查

![vibe coded](https://img.shields.io/badge/vibe_coded-100%25-ff69b4?style=flat-square)

Retroid Pocket G2（Android 开源掌机）上边玩边查的单页攻略，覆盖两作：

- **GBA《塞尔达传说：缩小帽》** —— 16 章流程、12 条卡关急救、23 个收集项、6 个 Boss
- **PSP《幻想传说 X（Cross Edition）》** —— 23 章流程、13 条卡关急救、34 个收集项、18 个 Boss

老游戏没有任务指引，网上攻略又散、又旧、图还全挂。所以这里交付的不是文章，而是一个**单文件、零外链、`file://` 直接打开**的速查页：章节卡折叠 + 进度勾选 + 卡关 Q&A + 收集清单 + Boss 速查 + 全站搜索，进度存本地。

## 为什么做这个

不是缺攻略，是缺**能在掌机上边玩边看**的攻略。真正劝退的三个瞬间：

1. **切出去查一次，回来就不想玩了。** 掌机上查攻略要切应用：广告、弹窗、一张 3 MB 的图、还要联网加载；等你切回来，机器已经休眠，操作忘了一半。
2. **老游戏不告诉你下一步。** 缩小帽里那扇门要变小才看得见；幻想传说里出村就永久错过的时限支线，wiki 里用一行小字带过。攻略一旦不标，你就永远漏了。
3. **中文资料散，日文 wiki 劝退。** 幻想传说 X 最全的流程只有日文表格，中文版本停在十年前，图全挂——攻略站变成了考古现场。

所以它长这样：**一个文件拷进掌机，`file://` 秒开**，不联网、不登录、不弹窗；章节按「现在该做第几章」排，时限要素标黄，勾过的进度存在本机，隔天回来接着走。

在补老游戏的不止我一个。译名不对、事实有错、想加一作，都欢迎开 issue——报个名字就行。

线上版：<https://cnzgray.github.io/retro-guide/>（GitHub Pages，HTTP 自动跳 HTTPS）

## Vibe Coding 实录

页面、构建脚本、这份 README，全程对着 AI 说人话做出来的。分工写在明面上，免得互相甩锅：

| 谁 | 干了什么 |
|---|---|
| **人** | 定需求（掌机上边玩边查，不要文章）、拍板配色与信息层级、核对流程与译名、决定什么不写（宁缺不编） |
| **AI** | 写渲染逻辑与构建脚本、排版与文案初稿、把攻略事实逐条查证后回写、自己跑浏览器回归 |
| **不 vibe 的部分** | 单文件、零外链、章节 id 不改名——三条硬约束，人和 AI 都不能为了「顺手」推翻 |

效果如何自己判：`node tools/build.mjs --check` 全绿，CI 拦漂移，页面 77 KB 零依赖。

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | **产物**，也是站点首页：纯 HTML/CSS/JS，约 76 KB，无任何外链。由 `src/` 生成，不手改 |
| `src/shell.html` | 模板：CSS + 全部渲染逻辑，数据位是占位符 `/* __GAMES__ */` |
| `src/games/minish.js`、`src/games/topx.js` | 攻略数据，一个游戏一个文件，`export default { ... }` |
| `src/names.js` | 译名单点：日文原名 → 汉化译名 |
| `tools/build.mjs` | 零依赖 Node 脚本：拼装、校验、`--check`、`--rename` |
| `.github/workflows/check.yml` | CI：产物与源码不一致就红 |
| `top_x_ce_walkthrough.md` | 《幻想传说 X》流程整理稿（552 行），页面内容的**事实源**之一 |
| `docs/HANDOFF.md` | 交接文档：设计约定、已知风险、待办、验证方法 |
| `LICENSE` | MIT（只覆盖代码，不含攻略正文） |
| `LICENSE-CONTENT.md` | 攻略正文许可：CC BY-NC-SA 4.0、来源署名、免责 |
| `AGENTS.md` | 给 AI 协作者的硬约束、改动流程、完成标准 |
| `.nojekyll` | 让 GitHub Pages 跳过 Jekyll 处理 |
| `README.md` | 本文件 |

## 构建

```bash
node tools/build.mjs            # 由 src/ 生成 index.html（源码与产物一起提交）
node tools/build.mjs --check    # CI 同款：产物漂移或校验不过则退出 1
node tools/build.mjs --rename 敏特=敏朵   # 正文 + names.js 全量改译名
node tools/build.mjs --verbose  # 附带打印译名覆盖率提示
```

`--check` 拦三类问题：章节 id 不连续/重复、配对写法里的中文与 `src/names.js` 不一致、产物里出现外链资源。它拦不住“把 id 改成别的再重排”，那只能靠人记住进度键的约定。

## 使用

单文件拷进掌机，用浏览器打开即可，不需要服务器、不需要联网。

本机调试时 `file://` 也能开，但部分浏览器工具（自动化、截图）会拒绝 `file://`，走本地 http 更稳：

```bash
cd retro-guide
python3 -m http.server 8765
# 打开 http://127.0.0.1:8765/index.html
```

## 发布（GitHub Pages）

已上线：<https://cnzgray.github.io/retro-guide/>，仓库 `cnzgray/retro-guide`（公开），Pages 走 `main` / root，HTTPS 已强制。改完 `git push` 后约 1 分钟自动重建。

## 技术结构

源码在 `src/`，构建后合并成单个 `<script>`：数据在 `src/games/*.js`，渲染逻辑在 `src/shell.html`。

```
GAMES[]                     游戏
├─ id / title / sub / short / metas / intro
├─ chapters[]               章节：{id, n, title, area, goal, steps[], items[], warn[], boss:{name,tip}, tip}
├─ qa[]                     卡关急救：{q, a}
├─ checks[]                 收集清单分组：{t, items[]}
└─ bosses[]                 Boss 速查：{n, s, t}
```

- 章节 `id`（`c1`–`c16`、`t1`–`t23`）是进度持久化的键，**改名会丢掉用户已勾的进度**。
- `steps / goal / warn / boss.tip` 按 HTML 原样插入（可写 `<b>`）；`items` 会被转义。
- `build()` 每次切换游戏整体重渲染；勾选完成只做局部更新（`renderProgress / renderToc / updateNext`），不重绘整页，避免滚动位置跳动。
- 搜索靠每个可搜元素的 `data-search`，文本先 `.replace(/<[^>]+>/g," ")` 去标签再小写化。
- 进度存 `localStorage`，key `retroGuide.v1`：`{game, done:{minish[],topx[]}, checks:{...}}`，选中游戏也会记住。
- 页脚 `footer.sitefoot` 是静态免责声明，不在 `build()` 的重渲染范围内，切换游戏不会丢。

## 设计约定（改之前先确认）

1. **中文优先**。人名、地名、道具、术技用汉化译名，日文原名降为灰色小字：`克雷斯（<i class='jp'>クレス</i>）`。用户看不懂日文，不要把日文提回正文。
2. **单文件、零外链**。不引 CDN、字体、图片外链——文件要拷进掌机，必须离线可用。上线只是分发方式，不改变这个约束。
3. **信息密度优先于文采**。每章 = 目标 + 分步 + 该拿的东西 + 易漏/卡点 + Boss 解法，不写叙事。
4. **时限要素单独标黄**（`.warn`）。这类老游戏最劝退的地方，也是本页核心价值。
5. **主题色按游戏切换**，全部走 CSS 变量：`body` = 缩小帽（海拉尔绿 `#56dd91` + 金 `#ffc861`），`body[data-game="topx"]` = 幻想传说（时空蓝 `#849cff` + 神枪金 `#ffcf70`）。改配色只动这两组变量。
6. **不拆多页**。单文件是核心约束：拆成共享 CSS/JS 的多页应用，拷贝方式就从"拷一个文件"变成"拷一个目录"。游戏数涨到 4–5 个、单文件超过 300 KB 时再考虑拆，且要拆成**每个游戏各自自包含的一页**，不是共享资源的多页站。
7. **`index.html` 是产物**。改 `src/` 后跑 `node tools/build.mjs`；直接改产物会被 `--check` 判漂移，下一次构建覆盖掉。
8. **译名只有一处定义**。`src/names.js` 是译名的唯一事实源，正文配对写法必须与之一致；改译名用 `--rename`，别手工全局替换（会漏掉 `<b>` 包裹的写法）。

## 授权与免责

- **代码**（HTML 结构 / CSS / JS）：MIT，见 `LICENSE`。
- **攻略正文**：CC BY-NC-SA 4.0——署名、非商业、相同方式共享。完整条款、原始来源与不涵盖的内容见 `LICENSE-CONTENT.md`。
- **不收录**：游戏本体、ROM、汉化补丁、官方图像或攻略本扫描。发现被添加请直接回滚。
- 游戏名称、角色、地名等著作权与商标归任天堂 / 万代南梦宫等各自权利人所有；本项目为非官方同人作品，与发行方无关。

## 验证

回归检查清单（当前实测：章节 16 / 23、Q&A 12 / 13、收集项 23 / 34、Boss 6 / 18）：

0. `node tools/build.mjs --check` 退出 0（产物无漂移、无译名/结构问题）；
1. 两作章节数正确，切换游戏无控制台报错；
2. 搜索中文名（如「克雷斯」）能命中并展开对应章节；
3. 勾选章节 → 进度条 / 「现在该做」更新 → 刷新后仍保留；
4. 切到幻想传说后 `--acc` 为 `#849cff`，`meta[theme-color]` 为 `#0a0c15`；
5. 窄屏（≤420px）无横向溢出：`document.documentElement.scrollWidth <= window.innerWidth`；
6. 页脚免责声明在两作下都可见，切换游戏不被 `build()` 清掉。

## 已知风险与待办

见 `docs/HANDOFF.md`，优先级最高的是**译名对齐**：现有译名是民间通行译法，未必等于用户手上 CHS 补丁的实际用词。核对名单：克雷斯 / 敏特 / 切斯特 / 克拉斯 / 阿琪 / 隆德莉涅 / 达奥斯 / 尤克里德 / 阿尔瓦尼斯坦 / 米德加尔斯 / 温蒂妮。发现不一致就以实际用词一次性替换。

## 事实来源

- 缩小帽流程与 Boss 机制：[GameFAQs 完整攻略](https://gamefaqs.gamespot.com/gba/920670-the-legend-of-zelda-the-minish-cap/faqs/47138)
- 幻想传说 X 四份流程表（含时限要素）：[なりきりダンジョンX まとめwiki](https://w.atwiki.jp/naridan-x/)（页 185–188）
- 汉化版存在性：CHS 补丁，PSP 编号 `ULJS00293`
