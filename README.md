# retro-guide · 掌机离线攻略速查

Retroid Pocket G2（Android 开源掌机）上边玩边查的单页攻略，覆盖两作：

- **GBA《塞尔达传说：缩小帽》** —— 16 章流程、12 条卡关急救、23 个收集项、6 个 Boss
- **PSP《幻想传说 X（Cross Edition）》** —— 23 章流程、13 条卡关急救、34 个收集项、18 个 Boss

老游戏没有任务指引，网上攻略又散、又旧、图还全挂。所以这里交付的不是文章，而是一个**单文件、零外链、`file://` 直接打开**的速查页：章节卡折叠 + 进度勾选 + 卡关 Q&A + 收集清单 + Boss 速查 + 全站搜索，进度存本地。

线上版：<https://cnzgray.github.io/retro-guide/>（GitHub Pages，HTTP 自动跳 HTTPS）

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | 唯一交付物，也是站点首页。纯 HTML/CSS/JS，约 76 KB，无任何外链 |
| `top_x_ce_walkthrough.md` | 《幻想传说 X》流程整理稿（552 行），页面内容的**事实源**之一 |
| `docs/HANDOFF.md` | 交接文档：设计约定、已知风险、待办、验证方法 |
| `LICENSE` | MIT（只覆盖代码，不含攻略正文） |
| `LICENSE-CONTENT.md` | 攻略正文许可：CC BY-NC-SA 4.0、来源署名、免责 |
| `AGENTS.md` | 给 AI 协作者的硬约束、改动流程、完成标准 |
| `.nojekyll` | 让 GitHub Pages 跳过 Jekyll 处理 |
| `README.md` | 本文件 |

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

内容与渲染都在同一个 `<script>` 里，数据集中在 `const GAMES = [...]`。

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

## 授权与免责

- **代码**（HTML 结构 / CSS / JS）：MIT，见 `LICENSE`。
- **攻略正文**：CC BY-NC-SA 4.0——署名、非商业、相同方式共享。完整条款、原始来源与不涵盖的内容见 `LICENSE-CONTENT.md`。
- **不收录**：游戏本体、ROM、汉化补丁、官方图像或攻略本扫描。发现被添加请直接回滚。
- 游戏名称、角色、地名等著作权与商标归任天堂 / 万代南梦宫等各自权利人所有；本项目为非官方同人作品，与发行方无关。

## 验证

回归检查清单（当前实测：章节 16 / 23、Q&A 12 / 13、收集项 23 / 34、Boss 6 / 18）：

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
