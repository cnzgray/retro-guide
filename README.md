# retro-guide · 掌机离线攻略速查

Retroid Pocket G2（Android 开源掌机）上边玩边查的单页攻略，覆盖两作：

- **GBA《塞尔达传说：缩小帽》** —— 16 章流程、12 条卡关急救、23 个收集项、6 个 Boss
- **PSP《幻想传说 X（Cross Edition）》** —— 23 章流程、13 条卡关急救、34 个收集项、18 个 Boss

老游戏没有任务指引，网上攻略又散、又旧、图还全挂。所以这里交付的不是文章，而是一个**单文件、零外链、`file://` 直接打开**的速查页：章节卡折叠 + 进度勾选 + 卡关 Q&A + 收集清单 + Boss 速查 + 全站搜索，进度存本地。

## 文件

| 文件 | 说明 |
|---|---|
| `retro-guide.html` | 唯一交付物。纯 HTML/CSS/JS，约 76 KB，无任何外链 |
| `top_x_ce_walkthrough.md` | 《幻想传说 X》流程整理稿（552 行），页面内容的**事实源**之一 |
| `docs/HANDOFF.md` | 交接文档：设计约定、已知风险、待办、验证方法 |
| `README.md` | 本文件 |

## 使用

单文件拷进掌机，用浏览器打开即可，不需要服务器、不需要联网。

本机调试时 `file://` 也能开，但部分浏览器工具（自动化、截图）会拒绝 `file://`，走本地 http 更稳：

```bash
cd retro-guide
python3 -m http.server 8765
# 打开 http://127.0.0.1:8765/retro-guide.html
```

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

## 设计约定（改之前先确认）

1. **中文优先**。人名、地名、道具、术技用汉化译名，日文原名降为灰色小字：`克雷斯（<i class='jp'>クレス</i>）`。用户看不懂日文，不要把日文提回正文。
2. **单文件、零外链**。不引 CDN、字体、图片外链——文件要拷进掌机，必须离线可用。
3. **信息密度优先于文采**。每章 = 目标 + 分步 + 该拿的东西 + 易漏/卡点 + Boss 解法，不写叙事。
4. **时限要素单独标黄**（`.warn`）。这类老游戏最劝退的地方，也是本页核心价值。
5. **主题色按游戏切换**，全部走 CSS 变量：`body` = 缩小帽（海拉尔绿 `#56dd91` + 金 `#ffc861`），`body[data-game="topx"]` = 幻想传说（时空蓝 `#849cff` + 神枪金 `#ffcf70`）。改配色只动这两组变量。

## 验证

回归检查清单（当前实测：章节 16 / 23、Q&A 12 / 13、收集项 23 / 34、Boss 6 / 18）：

1. 两作章节数正确，切换游戏无控制台报错；
2. 搜索中文名（如「克雷斯」）能命中并展开对应章节；
3. 勾选章节 → 进度条 / 「现在该做」更新 → 刷新后仍保留；
4. 切到幻想传说后 `--acc` 为 `#849cff`，`meta[theme-color]` 为 `#0a0c15`；
5. 窄屏（≤420px）无横向溢出：`document.documentElement.scrollWidth <= window.innerWidth`。

## 已知风险与待办

见 `docs/HANDOFF.md`，优先级最高的是**译名对齐**：现有译名是民间通行译法，未必等于用户手上 CHS 补丁的实际用词。核对名单：克雷斯 / 敏特 / 切斯特 / 克拉斯 / 阿琪 / 隆德莉涅 / 达奥斯 / 尤克里德 / 阿尔瓦尼斯坦 / 米德加尔斯 / 温蒂妮。发现不一致就以实际用词一次性替换。

## 事实来源

- 缩小帽流程与 Boss 机制：[GameFAQs 完整攻略](https://gamefaqs.gamespot.com/gba/920670-the-legend-of-zelda-the-minish-cap/faqs/47138)
- 幻想传说 X 四份流程表（含时限要素）：[なりきりダンジョンX まとめwiki](https://w.atwiki.jp/naridan_x/)（页 185–188）
- 汉化版存在性：CHS 补丁，PSP 编号 `ULJS00293`
