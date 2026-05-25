# 息息·宇宙

> 一个温柔的睡前情绪陪伴 App。React + Vite + Tailwind CSS，部署在 GitHub Pages。

**当前版本：v4.23.0** · [在线访问 →](https://wuyi1111.github.io/xixi-cosmos/)

四个 tab：**此刻** / **雷达** / **星系** / **归星**（原"我的"已重构为"归星"板块）。

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

> 🔧 = 需要改动时的常见入口  ·  ⛔️ = 无特殊情况不要动  ·  🎨 = 主管 UI / 视觉  ·  ⚙️ = 主管逻辑 / 数据

```
.
├── .github/workflows/
│   └── deploy.yml                 # ⛔️ GitHub Actions 自动部署，工作流不要轻易改
├── public/
│   ├── favicon.svg                # ⛔️ 网站图标
│   └── version.json               # ⛔️ vite 插件构建时自动生成，App 用它检查更新（不要手改）
├── src/
│   ├── App.jsx                    # 🔧⚙️ 应用最外壳：全局 state（userData / theme / activeTab）+ tab 路由壳 + 启动闪屏挂载
│   ├── main.jsx                   # ⛔️ React 入口，挂载 <App /> 用，几乎不用改
│   ├── index.css                  # 🎨 Tailwind 入口 + 全部 keyframes + 移动端字号 / iOS 适配（动画归这里）
│   ├── constants.js               # 🔧⚙️ 所有常量数据：情绪 / MBTI / 里程碑 / 明日建议 / 心愿池商品 / Mock 数据
│   ├── utils.js                   # ⚙️ 通用工具函数（formatBytes、getLanguageLabel）
│   ├── version.js                 # ⛔️ 从 vite 注入的 APP_VERSION / BUILD_TIME，不要手改
│   ├── components/                # 🎨 通用 UI 组件（被多处复用）
│   │   ├── Portal.jsx             # ⛔️ React Portal 封装，全屏 modal 用，避免被 main 的 transform 撕扯
│   │   ├── TabButton.jsx          # 🎨 底部导航单个 tab 按钮（图标 + label + 激活态背景）
│   │   ├── SplashScreen.jsx       # 🎨 启动闪屏：品牌标语 + 调息引导动画 + 粒子背景
│   │   └── StarField.jsx          # 🎨 全局星点背景，深浅色模式自动切数量与亮度
│   ├── views/                     # 🔧 四个 tab + 内部子页面（路由级页面）
│   │   ├── TonightView.jsx        # 🎨⚙️ 「此刻」tab：情绪打卡 + 调息工具 + 周历/月历 + 梦境舱
│   │   ├── TreeholeView.jsx       # 🎨⚙️ 「雷达」tab：星际回音浏览 + 发射台 + 明日约定 + 星际足迹
│   │   ├── GalaxyView.jsx         # 🎨⚙️ 「星系」tab：成长星系可视化 + 7 阶段里程碑 + 光晕跟随手指
│   │   ├── StarView.jsx           # 🎨⚙️ 「归星」tab：精简个人信息 + 白噪音 + 睡前仪式 + 数据统计（取代旧 MineView）
│   │   ├── MineView.jsx           # ⛔️ 已废弃（保留作历史参考，未在 App.jsx 引用）
│   │   ├── SettingsPanel.jsx      # 🔧⚙️ 设置面板：8 个分组下拉栏，归星页打开
│   │   └── WishPoolView.jsx       # 🎨⚙️ 心愿池（Mock 商城）：商品橱窗 + 别人的愿望墙 + 许愿弹窗
│   └── widgets/                   # 🎨 复杂的功能挂件
│       ├── BreathingWidget.jsx    # ⛔️ 已废弃（v4.23.0 起未被引用，StarView/SplashScreen 自带呼吸动画）
│       ├── QuizWidget.jsx         # 🎨⚙️ MBTI 16 型测试全屏，结果写入 userData.personality
│       └── DreamCard.jsx          # ⛔️ 已废弃（v4.23.0 起未被引用，TonightView 已重构不再有梦境舱）
├── 审查报告/                      # 📄 不影响构建，历次代码审查 PDF + 生成脚本
├── index.html                     # ⛔️ 含同步 inline script 防暗色模式启动闪屏（首绘前读 localStorage 写 .dark）
├── package.json                   # 🔧 改版本号 / 加依赖
├── package-lock.json              # ⛔️ npm 自动维护，不要手改
├── vite.config.js                 # ⛔️ base: '/xixi-cosmos/' 必须与仓库名一致，注入 __APP_VERSION__ / __BUILD_TIME__
├── tailwind.config.js             # ⛔️ darkMode: 'class'，几乎不用改
├── postcss.config.js              # ⛔️ Tailwind 标配
└── 息息·宇宙V4.0.txt              # ⛔️ 原始源文件，保留作参考，未参与构建
```

### 各文件职责速查

| 改什么 | 去哪个文件 |
|---|---|
| 加一个 tab / 改 tab 名 | [src/App.jsx](src/App.jsx)（条件渲染 + nav） + 对应 view |
| 加 userData 字段 / 写数据迁移 | [src/App.jsx](src/App.jsx)（useState 初值 + 初始化 useEffect） |
| 打卡奖励规则、连签 bonus | [src/App.jsx](src/App.jsx) `handleCheckIn()` |
| 下拉刷新阻尼 / 阈值 | [src/App.jsx](src/App.jsx) `onTouchMove / onTouchEnd` |
| 改情绪 / MBTI 数据 / 里程碑阶段 | [src/constants.js](src/constants.js) |
| 改"明日约定"建议清单 | [src/constants.js](src/constants.js) `TOMORROW_SUGGESTIONS` |
| 改心愿池商品 / Mock 愿望 | [src/constants.js](src/constants.js) `WISH_PRODUCTS` / `MOCK_WISHES` |
| 主题颜色 / 动画 keyframes | [src/index.css](src/index.css) |
| 全屏 modal | 用 [src/components/Portal.jsx](src/components/Portal.jsx) 包裹 |
| 设置面板加新分组 | [src/views/SettingsPanel.jsx](src/views/SettingsPanel.jsx) |
| 调息动画 / 时长 | [src/widgets/BreathingWidget.jsx](src/widgets/BreathingWidget.jsx) |
| MBTI 题目 / 计分 | [src/widgets/QuizWidget.jsx](src/widgets/QuizWidget.jsx) |

---

## 协作注意事项（合作者必读）

### 1. 改动前先 pull
```bash
git pull origin main
```
远端是 trunk，本地不要长时间脱节，**避免 4.23.0 当成 4.6.1** 的情况。

### 2. 改动顺序
- **改之前先看 git log**：每次升版都有对应 commit，能快速判断是不是已经有人在做类似改动
- **改之后必升 patch 位**（4.23.0 → 4.23.1）：`package.json` 的 `version` 字段同步改，否则部署后用户那边 version 检查不出来
- **commit 信息走 `release: vX.Y.Z — 一句话描述` 格式**（bug 修复用 `fix:`，文档用 `docs:`，纯重构用 `refactor:`）

### 3. 不要碰的文件
打了 ⛔️ 标记的：`deploy.yml` / `vite.config.js` / `package-lock.json` / `version.json` / `version.js` / `main.jsx`。
要动的话**先在 PR 里说清楚原因**，否则 reviewer 直接拒。

### 4. 数据兼容
- userData 字段只能加、不能删（删了会让老用户数据丢失）
- 加新字段必须在 [src/App.jsx](src/App.jsx) 的**两处**写迁移（初始化 useEffect + 下拉刷新），否则老用户更新后会缺字段
- 改 `localStorage` key 名 = 等于让所有用户数据归零，**禁止**

### 5. 视觉一致性
- 主色：indigo（深色态 indigo-400，浅色态 indigo-600）
- 强调色：amber（橙色，归星仪式）/ pink（雷达交互）
- 卡片圆角统一 `rounded-2xl` 或 `rounded-3xl`
- 阴影一律 `shadow-sm` / `shadow-lg`，不要用默认 `shadow`

### 6. 测试 checklist
push 前手动跑一遍：
- [ ] `npm run build` 不报错
- [ ] 四个 tab 都能正常切换
- [ ] 深色 / 浅色模式都看一遍
- [ ] iPhone Safari 真机看一眼（光晕、安全区、字号缩放）

---

## 版本日志

时间为 commit 日期（GMT+1）。每次升版本号 = 走一次 GitHub Actions 部署。

### v4.23.7 · 2026-05-25 — 许愿池预览版芯片（M-6）

- WishPoolView 许愿弹窗副标题下方加 amber 色 "🔖 预览版 · 不会扣除星尘" 芯片
- 提交按钮文案从"送上宇宙 · X 颗星尘"改为"许下心愿（预览）"，去掉数字暗示
- 按钮下方说明改为"未来接通后端 / 支付后才会真正消费星尘"
- 用户在选商品前就明白这是 mock，不会再被"X 颗星尘"误导以为真的扣除

### v4.23.6 · 2026-05-25 — 版本检查 5 秒超时（M-5）

- SettingsPanel `handleCheckVersion` 用 AbortController 包裹 fetch
- `setTimeout` 5 秒后 `ctrl.abort()`，触发 AbortError → 落到 error 分支
- 网络差时不再永远停在"正在连接宇宙网络…"
- `finally` 清理 timeoutId，避免成功时也留个挂起的 timer

### v4.23.5 · 2026-05-25 — 睡前提醒标注暂不支持推送（M-4）

- SettingsPanel 睡前提醒标题旁加 amber 色 "暂不支持推送" 芯片
- 下方加说明文字告知用户：开启后不会真的发系统通知，目前请用手机闹钟
- 标记 v4.x 暂未接入 Service Worker 推送，未来补齐

### v4.23.4 · 2026-05-25 — 数值字段类型防御 + totalFollows 注册（M-3）

- App.jsx 迁移加循环：totalDays / continuousDays / stardust / totalHugs /
  totalFollows / dailyPosts / tomorrowDoneTotal 任一不是 number 都回落 0
- StarView "同行者"统计 + GalaxyView 超新星计算去掉冗余的 `|| 0` 兜底
  （字段已在 INITIAL_USER_DATA 注册 + 迁移做了类型兜底，消费端无需重复）
- 老用户首次升到本版本后，"同行者"数字会从 0 正确累加（之前 totalFollows
  从未在初值中存在，加 1 操作的结果不会被持久化到下次会话之外）

### v4.23.3 · 2026-05-25 — 提取 INITIAL_USER_DATA 常量（M-2）

- `src/constants.js` 新增 `INITIAL_USER_DATA` 常量作为 userData 形态的单一来源
- App.jsx 的 useState 初值 + 迁移 useEffect 都引用 INITIAL_USER_DATA
- StarView 的 dev console reset 不再硬编码，直接 `setUserData({ ...INITIAL_USER_DATA })`
- SettingsPanel 的"恢复默认"按钮也用 INITIAL_USER_DATA.fontScale，按钮文案随之自动更新（85% 而非旧的 100%）
- 迁移逻辑简化为浅合并 + 类型敏感字段防御，新加 userData 字段时只改 INITIAL_USER_DATA + 必要时加一行类型兜底

### v4.23.2 · 2026-05-25 — P1 级 bug 修复（稳定性 + 安全）

- **修复白屏崩溃**：App.jsx 初始化 useEffect 给 JSON.parse 加 try-catch，
  localStorage 数据损坏时清除 key 并使用初始 state（之前会直接白屏）
- **修复归星仪式刷星尘漏洞**：StarView 的 setTimeout 链 ID 全部收集到
  ritualTimersRef，closeRitual / 组件卸载时统一 clear；completeRitual 加
  hasCheckedInToday 防御（之前关闭弹窗后定时器继续跑，会反复发奖励）
- **修复 TonightView Section 重建**：QuizSection / GalaxySection /
  SupernovaSection 提到文件顶层作为正经 React 组件，HeroSection /
  AppIntroSection / NavigationSection 内联 JSX。父级 re-render 不再让子组件
  unmount/remount，展开态、滚动位置、当前卡片索引都能保持
- **修复送出温暖 / 跟随的双重保存覆盖**：handleInteractionCheckIn 新增
  extraPatch 参数，TreeholeView 把 hug / follow 的字段更新作为 patch 传过来，
  由 App 端一次合并保存。原本两边各自 saveUserData 用旧闭包覆盖对方，导致
  huggedWhispers / totalHugs / followedSuggestions 等不持久
- **修复心形粒子残留**：index.css 补上缺失的 @keyframes particle-float；
  --tx/--ty 从子 Heart 元素移到父级动画元素（CSS 变量只向下级联）

### v4.23.0 · 2026-05-25 — 星系界面简化（方案A折叠式）

- 星系页改为折叠式布局：默认只展示当前阶段卡片 + 总览数字
- 历史里程碑徽章列表整体折叠收起，点击「展开历程」按钮再展开
- 主题色恢复 amber 橙色（v4.22.x 试过 pink 后回退）
- 浏览体验更聚焦"我现在在哪一阶段"，减少滚动疲劳

### v4.22.2 · 2026-05-25 — 去掉星系图谱底部指示器圆点

- 星系图谱垂直滑动到底后，底部那个表示"还有更多"的小圆点指示器去掉
- 视觉更干净，滚到底自然结束即可

### v4.22.1 · 2026-05-25 — 去掉首页星际回音底部指示器圆点

- 首页"此刻"下的星际回音卡片堆叠底部也去掉指示器圆点
- 与星系图谱保持一致

### v4.22.0 · 2026-05-25 — 首页星际回音 / 星系图谱改垂直滑动

- 星际回音、星系图谱由横向滑动改为垂直滑动卡片堆叠
- 主题强调色试改为 pink（最终在 v4.23.0 又改回 amber）
- 雷达板块在视口里露出的高度做了优化，让用户更早看到下方内容

### v4.21.0 · 2026-05-25 — 雷达页卡片堆叠 + 星际足迹折叠

- 「星际回音」「热门任务」改为垂直滑动卡片堆叠样式
- 「我要发射」按钮固定在卡片堆叠下方，不再滚动消失
- 「星际足迹」板块支持点击标题折叠 / 展开
- 移动端单手滑动更顺手

### v4.20.0 · 2026-05-25 — 明日约定 + 新增星际足迹板块

- 「明日小事」改名为「明日约定」，文案更柔
- 雷达页新增「星际足迹」板块，回顾打卡 / 心语 / 完成约定的时间线
- 恢复 v4.17~v4.19 期间临时改动的主题色（统一回 indigo / amber 体系）

### v4.17.0 · 2026-05-21 — 应用结构重组（New / Radar / WishPool tab）

- 大幅度结构调整：原四 tab（此刻 / 微澜 / 星系 / 我的）改为新四 tab
  - **此刻**：focus 在"今晚"，原 TonightView 简化
  - **雷达**：原"微澜" tab，名字改成更动态的"雷达"
  - **星系**：基本保留
  - **归星**：取代旧"我的"，强调"今晚回到自己"的睡前仪式（新建 [src/views/StarView.jsx](src/views/StarView.jsx)）
- 旧 [src/views/MineView.jsx](src/views/MineView.jsx) 保留但不再引用
- 星愿池入口从我的页移到归星页

### v4.16.0 · 2026-05-20 — 新增起始页（Splash Screen）

- 每次打开应用都显示起始页
- 起始页包含品牌标语「息息 · 宇宙」
- 舒缓调息动画（吸气/呼气 + 光晕呼吸效果）
- 右上角 X 关闭按钮，点击后进入首页「此刻」
- 粒子动画营造宇宙氛围

### v4.15.0 · 2026-05-20 — 明日页面光点机制修复

- 默认光点数量从 4 个改回 3 个
- 修复「换一换」功能，正确排除已显示任务
- 添加光点后初始为空状态，需点击「随机一颗」或「自己写」填充
- 移除「跳过」功能残留逻辑

### v4.14.0 · 2026-05-20 — 明日页面光点机制优化

- 默认光点数量从 3 个增加到 4 个
- 底部新增「+ 添加光点」按钮，支持无限添加
- 移除「跳过」功能，替换为「自己写」按钮
- 每个光点都有「完成」「换一换」「自己写」三个操作
- 进度条适配动态光点数量

### v4.13.0 · 2026-05-20 — 明日页面光点机制重构

- 明日页面改为「3颗光点」机制，每天随机生成
- 支持「随机推荐」和「自定义输入」两种光点来源
- 光点可完成、可跳过、可无限换一换
- 已完成光点保留记录，不会覆盖
- 新增「我的光点」历史记录弹窗，按日期分组展示
- 头部进度条实时显示今日完成进度

### v4.12.0 · 2026-05-20 — 舒缓调息 + 明日页面视觉升级

- 舒缓调息设置页：卡片化设计 + 半透明遮罩 + 顶部图标装饰
- 舒缓调息练习页：新增进度条 + 5层光晕呼吸动画 + 吸气/呼气引导文字
- 明日页面：头部进度条 + 建议列表卡片化 + Emoji方形背景
- 明日页面完成按钮：hover时Indigo填充+阴影，点击反馈更明显
- 底部温馨语句放入装饰卡片，视觉层次更清晰

### v4.11.0 · 2026-05-20 — 星尘小弹窗 + 月亮太阳渐变动画

- 星尘收集提示从卡片内移除，改为小弹窗显示，自动在 3 秒后消失
- 月亮图标点击后，月亮到太阳有平滑的渐变过渡动画（opacity + scale）
- 点击月亮后经过 800ms 动画，最终显示未打卡的"记录此刻"界面
- 已打卡卡片布局更简洁和谐

### v4.10.0 · 2026-05-20 — 星尘动画 + 睡醒重置功能

- 星尘收集提示"本次探索收集 +10 星尘"在显示 3 秒后渐变消失
- 星尘提示消失后，整体卡片布局更简洁协调
- 已打卡界面的月亮图标可点击，点击后变成太阳图标
- 太阳图标短暂显示后，自动重置打卡状态，回到"记录此刻"界面
- 重置逻辑保留连续天数（因为用户还没真正度过新的一天）

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
