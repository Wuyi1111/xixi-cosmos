# 息息·宇宙

> 一个温柔的睡前情绪陪伴 App。React + Vite + Tailwind CSS，部署在 GitHub Pages。

**当前版本：v4.9.0** · [在线访问 →](https://wuyi1111.github.io/xixi-cosmos/)

---

## 本地开发

需要 Node.js 18+（推荐 20）。

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器，默认 http://localhost:5173
npm run build      # 构建生产版本，产出在 dist/
npm run preview    # 本地预览生产构建
```

---

## 部署到 GitHub Pages

仓库已配 GitHub Actions（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)），**每次 push 到 `main` 分支会自动构建并部署**。

第一次设置：
1. 在 GitHub 创建仓库 `xixi-cosmos`（与 [vite.config.js](vite.config.js) 的 `base` 一致）
2. push 上去
3. 仓库 → Settings → Pages → Source 选 **GitHub Actions**

之后每次更新代码：
```bash
git add . && git commit -m "..." && git push
```
GitHub Actions 自动跑，几十秒后线上更新。可在 Actions 标签查看进度。

---

## 项目结构

```
.
├── .github/workflows/deploy.yml   # GitHub Actions 自动部署
├── public/
│   ├── favicon.svg
│   └── version.json               # 构建时由 vite 插件生成，App 用它检查更新
├── src/
│   ├── App.jsx                    # 主组件（目前所有逻辑都在这）
│   ├── main.jsx                   # React 入口
│   └── index.css                  # Tailwind 入口 + 移动端字号 / iOS 适配
├── index.html                     # 含同步 inline script 防暗色模式启动闪屏
├── package.json
├── vite.config.js                 # base: '/xixi-cosmos/'，注入 __APP_VERSION__ / __BUILD_TIME__
├── tailwind.config.js             # darkMode: 'class'
├── postcss.config.js
└── 息息·宇宙V4.0.txt              # 原始源文件（保留作参考，未参与构建）
```

---

## 版本日志

时间为 commit 日期（GMT+1）。每次升版本号 = 走一次 GitHub Actions 部署。

### v4.9.0 · 2026-05-20 — 首页文案优化 + 情绪图标更新

- 首页主问句："今夜"改为"此刻"，更符合随时打卡的场景
- 删除"闭上眼睛，深呼吸"副标题，界面更简洁
- 按钮文案"记录今夜星象"改为"记录此刻"
- 情绪选择标题"选一颗最像今夜的你"改为"选一颗最像此刻的你"
- 六种情绪名称与图标更新：
  - 余温 → 温暖 ☀️
  - 静谧 → 平静 🌊
  - 星尘 → 迷茫 🌫️
  - 欢愉 → 愉悦 😊
  - 忐忑 → 焦虑 💭
  - 疲惫 → 疲倦 😴
- 每种情绪的安慰语也相应调整，更贴合新的情绪描述

### v4.6.1 · 2026-05-19 — “我的”默认昵称调整

- “我的”界面默认昵称从「星海旅人」改为「星星旅人」

### v4.6.0 · 2026-05-19 — 打卡卡片粒子化 + 点击反馈 + 设置全部下拉栏

打卡卡片
- 罗盘图标整个去掉，换成**粒子扩散动画**：
  - 12 颗 indigo 粒子从中心向 12 个方向 radiate
  - 每颗错开 0.2s 延迟，形成连绵喷涌
  - 中央保留一颗呼吸的核（动态 box-shadow 光晕）
  - 外圈柔光晕 animate-pulse
- 点击反馈：
  - `navigator.vibrate(15)` 触发触觉震动（Android 有效，iOS Safari 无副作用）
  - `active:scale-[0.97]` 按下时整体微缩
  - 点击瞬间一圈径向闪光从内向外扩散 500ms（tap-flash 动画）

设置面板
- 8 个分组全部改成**下拉栏**（Section 组件）
- 默认全部收起（首屏干净）；点击 title 行展开
- 展开时上方圆角保留、下方延展出内容（grid-rows 0fr↔1fr 平滑过渡）
- 每个 Section 标题前加小图标：
  - 系统语言 → 罗盘 / 账号与安全 → 用户 / 睡眠守护 → 月亮 /
    存储与隐私 → 垃圾桶 / 关于息息 → 信息 / 开发者控制台 → 虫子
- 各 Section 可独立开关（不是 accordion，多个可同时展开）
- 开发者控制台的"锁定"按钮移到展开内容里

CSS 新增
- @keyframes particle-burst（粒子向 --dx/--dy 偏移并淡出）
- @keyframes tap-flash + .animate-tap-flash

### v4.5.2 · 2026-05-19 — "明日"建议加完成按钮 + 累计计数

- "明日" tab 每张建议卡右侧加「完成」胶囊按钮
- 点击后卡片自动变灰、emoji 灰度化、主标题加删除线 + opacity 50%
- 按钮变成「✓ 已完成」（emerald 色），disabled 不重复计
- 头部 banner 多一个「✓ 已完成 N 次」徽章（累计）+ 当日子文案
  「今天已经拾起了 X 颗 · 谢谢你照顾了自己。」
- 完成态按"今日"算：次日凌晨自动恢复彩色可点（数据靠 `currentDateStr` 对比）
- userData 加两个字段：
  - `tomorrowDoneTotal`（累计完成次数，永不清零，除非用户主动重置）
  - `tomorrowDoneToday: { date, ids }`（今天完成了哪些 id）
- App.jsx 初始化 + pull-to-refresh 重读时都补了字段迁移

### v4.5.1 · 2026-05-19 — 首页打卡卡片更醒目 + 文案柔化

- 此刻页未打卡时的卡片之前太低调（罗盘 40% 透明 + 10px 提示）：
  - 容器换成 indigo 渐变背景 + 加重边框 + 柔光阴影
  - 罗盘 32 → 44，移除半透明，背后加 blur-2xl 呼吸光晕（animate-pulse）
  - 图标 animate-float 缓慢浮动，整体微微"活着"
  - 主问句加大加粗作为视觉重心（"今夜，你的内心是何种风景？"）
  - "闭上眼睛，深呼吸"降为副文
  - 底部"点击展开星象..."从 10px 灰字升级为真正的胶囊按钮
    （indigo 底 + 边框 + shadow，hover scale 1.03）
- 文案柔化：
  - "校准你的情绪波段..." → **"选一颗最像今夜的你"**
  - "点击展开星象，记录此刻" → **"记录今夜星象"**

### v4.5.0 · 2026-05-19 — 微澜重组：手势滑动 + "明日"温柔提示

- 微澜三个 tab 改成**手指横向滑动**切换；点击顶部按钮也仍然有效
  - 拖过容器 20% 宽即触发翻页，到边界有 0.3 阻尼
  - 容器加 `touch-action: pan-y`，垂直滚动不受影响
  - 容器标 `data-no-pull-refresh` 避免与下拉刷新打架
- 重组结构：
  - **星际回音** — 不变
  - **发射台** — 原"我的信号"列表合并到这下方，发射完即可看到自己的历史
  - **明日**（新）— 替换原"我的信号"位置，给用户的 8 条温柔建议
- "明日"内容（不逼用户改变，只陪着慢慢变好）：
  - 🍚 好好吃一顿饭 — 慢一点，给胃和心都一些空气
  - 🌿 散步十五分钟 — 看一眼你没注意过的天空
  - ✋ 拒绝一件正在消耗你的事
  - ⏳ 给自己留二十分钟 — 不刷手机，不被任何人打扰
  - 📖 翻开一本想读的书 — 哪怕只读三页
  - ✨ 整理一个小角落 — 让一处空间为你重新呼吸
  - 💌 联系一个让你舒服的人 — 一句"在吗"也算抵达
  - 🌙 什么也不做，好好休息 — 休息也是一种被允许的完成
- 发射台底部文案：当能量耗尽显示"明日 00:00 信号能量自动恢复"，
  消除原本"已耗尽"+"还可发射 0 次"的信息冗余
- 数据放在 `src/constants.js` 的 `TOMORROW_SUGGESTIONS`，加 / 改建议很方便

### v4.4.0 · 2026-05-19 — 星愿池入口（mock 商城）

- "我的"页面三宫格里的"星尘"块改为可点击按钮，进入星愿池
- 新建 `src/views/WishPoolView.jsx`：
  - 头部：返回箭头 + 标题 + 我的星尘余额
  - banner：主 CTA "许下我的星愿"
  - 商品橱窗：8 件睡眠周边（精油 / 凉感枕 / 白噪音耳机 / 月光灯 / 真丝眼罩 /
    雪松蜡烛 / 重力毯 / 草本茶），横向滑动卡片，标价用星尘 + ¥ 双单位
  - 别人的愿望墙：8 张 mock 卡（匿名用户 + emoji 头像 + 愿望文字 + 关联商品 + "我也想要"按钮）
- 许愿弹窗：选商品 grid + 写 ≤80 字心声，点"送上宇宙"toast 反馈
- "我也想要"按钮可切换共愿态（mock 阶段，无后端持久）
- 新增数据 `WISH_PRODUCTS` / `MOCK_WISHES` 到 `src/constants.js`
- 当前是预览版：许愿不真的扣星尘 / 不下单，等接通后端再补

### v4.3.1 · 2026-05-19 — App.jsx 大拆分（纯结构重构，无行为变化）

- 把单文件 2768 行的 App.jsx 拆成 14 个文件
- `src/App.jsx` 收缩到 306 行，只留全局 state / pull-to-refresh / 路由壳
- 新目录：`src/constants.js`、`src/utils.js`、`src/version.js`
- `src/components/` — Portal、TabButton
- `src/widgets/` — BreathingWidget、QuizWidget、DreamCard
- `src/views/` — TonightView、TreeholeView、GalaxyView、MineView、SettingsPanel
- 把 `<style>{styles}</style>` inline 字符串里的 keyframes 全部搬到 `src/index.css`
- 用户行为完全不变，仅工程组织优化

### v4.3.0 · 2026-05-19 — 体检 1-7 项修复

- 隐私协议文案与现实对齐（不再宣称"AI 解读"，改成"本地寄语"等）
- AI 梦境解读下线：删 Google Gemini API 调用，改为 12 条本地"宇宙寄语"随机抽
- 阶段编号 bug 修复（用 MILESTONES 索引代替 `floor(days/7)`）
- 12 处全屏 modal 改用 React Portal 渲染到 `<body>`，避免被 main 的 transform 撕扯
- 打卡后不再强制 setTheme('dark')，保留用户偏好
- "无名星尘" / "无轨星尘" 统一为 "无名星尘"
- 死代码清理（Beaker import / theme-transition keyframes / 占位注释）
- 树洞 toast "信号已抵达深空" 改为 "信号已封存进我的信号"（更如实）

### v4.2.6 · 2026-05-19 — 光晕跟随的"云雾散开"重做

- 移除 CSS transition 硬跟随
- 改用 RAF 帧循环 + lerp 缓动 + 3 层不同跟随速度（0.06 / 0.13 / 0.24）
- 拖拽时各层 scale 缓动到 1.18 / 1.12 / 1.06，松开慢慢聚回
- 新增 ambient 外层弥散云团（blur 40px、opacity 70%）

### v4.2.5 · 2026-05-19 — 星系页光晕跟随手指

- GalaxyView 视觉卡片加 touch / mouse 监听，两层光晕跟随，clamp ±55px
- 卡片标 `data-no-pull-refresh`，光晕区下拉不触发全局刷新

### v4.2.4 · 2026-05-19 — 修暗色启动闪屏

- index.html `<head>` inline 同步脚本：首绘前读 localStorage 把 `.dark` class + bg-color 写到 `<html>` 上
- 同步写 `html.style.fontSize`，避免字号 base 16→18.4 切换时跳一下

### v4.2.3 · 2026-05-19 — 下拉刷新只刷当前页 + 首页顶部留白收紧

- 下拉刷新不再 `window.location.reload()`（会丢当前 tab）
- 改为重读 localStorage + 当前 tab 的 key 递增 → 只 remount 当前 view
- main 顶部 padding 从 `max(safe-area, 3rem)` 改成 `max(safe-area, 0.75rem)`
- TonightView header `pt-4` 改 `pt-1`，"息息·宇宙"标题离状态栏明显近了

### v4.2.2 · 2026-05-19 — 送出温暖改为可切换点亮

- userData 新增 `huggedWhispers` 数组，记录哪些心语被点亮
- 未点亮 → 心形描边、点击 +1 喷射粒子；已点亮 → 实心 + 粉色光晕 + scale 110%
- 再点一下取消，totalHugs -1
- 加 `aria-pressed` 支持无障碍

### v4.2.1 · 2026-05-19 — 字号基准 +15%，新增两个高阶徽章

- 字号 useEffect 基准 16 → 18.4 (= 16 × 1.15)，把之前的 115% 设为新 100%
- 新增称号徽章：
  - 200 次温暖 → 暖意流星 ☄️
  - 500 次温暖 → 永恒银河 🌌

### v4.2.0 · 2026-05-18 — 字号 / 个人资料 / 下拉刷新 / 漏白修复

- 修 iOS Safari overscroll 漏白：html/body 接 light/dark 主题色
- main 两侧 padding `px-6` → `px-4`，更贴近原生 iOS
- 移动端字号再抬一档：text-base 17 → 18
- **新增整体字号滑动条**（设置面板，0.85 ~ 1.30，通过 html font-size 全局缩放）
- **新增个人资料编辑**：头像 emoji（22 选 1）+ 用户名（≤20 字），#TR755 固定不可改
- **新增下拉刷新**：触摸阻尼 + 释放刷新指示
- 老数据迁移：把所有用户的随机 ID 统一改为 `TR755`

### v4.1.2 · 2026-05-18 — 字号到 iOS 原生水平

- `@media (max-width: 480px)` 整体抬高 Tailwind text-* 字号
- 称号徽章 emoji `text-2xl` → `text-4xl`

### v4.1.1 · 2026-05-18 — iPhone 适配

- 顶部 / 底部接 `env(safe-area-inset-*)`，刘海 / Home 条不再遮挡内容
- iOS Safari 输入框 font-size 强制 16px，避免聚焦时整页放大
- 关闭 `-webkit-tap-highlight-color` 灰色闪烁
- 加 `apple-mobile-web-app-capable` 等 PWA meta，可"添加到主屏"

### v4.1.0 · 2026-05-18 — 重构设置面板

- "我的"页面去掉底部"关于息息" / "隐私协议"两个入口
- 设置面板新增 4 大分组：
  - **系统语言**（读 navigator.language 自动显示）
  - **账号与安全**（星际编号 + 复制 / 导出备份 JSON / 导入恢复）
  - **存储与隐私**（本地字节数 + 三项条数统计 + 隐私协议 + 清空数据）
  - **关于息息**（版本号 + 构建时间 + 检查更新按钮，从"我的"迁来）

### v4.0.1 · 2026-05-18 — 版本号补登 + 之前两个 feature

- 关于息息：检查更新按钮 + 版本号 / 构建时间展示
- 开发者测试控制台：访问密码保护（默认 186638）
- 是 4.0.0 部署后补的第一次版本号迭代

### v4.0.0 · 2026-05-18 — 初版上线

- Vite + React + Tailwind 工程脚手架
- 把原始 `息息·宇宙V4.0.txt` 组件挂到 `src/App.jsx`
- GitHub Actions 自动部署到 GitHub Pages，base = `/xixi-cosmos/`
- 仓库初始化 + 第一次 commit

---

## 升版本号约定

| 改动类型 | 升号方式 | 例 |
|---|---|---|
| bug 修复 / 小改 / 文案修正 | **patch +1** | 4.3.0 → 4.3.1 |
| 明确的新功能 / 多功能合并 | **minor +1** | 4.2.x → 4.3.0 |
| 破坏性变更 | **major +1** | 4.x.x → 5.0.0 |

每次升完 patch / minor 后会同步：
- `package.json` 的 `version` 字段
- vite 插件在 `dist/version.json` 写入新版本
- commit message 用 `release: vX.Y.Z — 描述` 格式
- 本 README 加一条版本日志

---

## 常用 git 速查

```bash
git status                 # 查看改动
git diff                   # 查看差异
git log --oneline -20      # 查最近 20 条
git restore <file>         # 撤销某文件未暂存的修改
```

---

## 常见问题

**Q：部署后页面空白 / 资源 404**
A：检查 [vite.config.js](vite.config.js) 的 `base` 是否与仓库名一致，必须以斜杠结尾（如 `'/xixi-cosmos/'`）。

**Q：Tailwind 样式不生效**
A：确认 [src/index.css](src/index.css) 顶部有 `@tailwind base; @tailwind components; @tailwind utilities;`，且 [src/main.jsx](src/main.jsx) 里有 `import './index.css'`。

**Q：本地能跑，部署后样式错乱 / 看不到新版**
A：通常是 base 路径不对，或 iPhone Safari 缓存的旧 bundle。强制刷新（桌面 Cmd+Shift+R / iOS 关掉标签页重开）。

**Q：手机上点输入框页面会被放大**
A：v4.1.1 起在 `@media (hover: none) and (pointer: coarse)` 下强制 input/textarea/select 字号 ≥16px，已解决。

**Q：开发者测试控制台密码**
A：默认 `186638`，硬编码在 bundle 里，只能挡住普通用户的好奇。详见 [src/App.jsx](src/App.jsx) `DEV_CONSOLE_PASSWORD`。
