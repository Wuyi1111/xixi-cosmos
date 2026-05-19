# 息息·宇宙

> 一个温柔的睡前情绪陪伴 App。React + Vite + Tailwind CSS，部署在 GitHub Pages。

**当前版本：v4.3.0** · [在线访问 →](https://wuyi1111.github.io/xixi-cosmos/)

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
