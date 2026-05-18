# 息息·宇宙 V4

一个温柔的睡前情绪陪伴 App。使用 React + Vite + Tailwind CSS 构建，部署在 GitHub Pages。

在线访问：`https://<你的GitHub用户名>.github.io/xixi-cosmos/`

---

## 本地开发

### 1. 安装 Node.js

需要 Node.js 18+（推荐 20）。

```bash
node -v   # 检查版本
```

如未安装，去 https://nodejs.org 下载 LTS 版本。

### 2. 安装依赖

```bash
cd "/Users/wuyi/Desktop/息息宇宙V4"
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器打开提示的本地地址（通常是 `http://localhost:5173`）。

### 4. 构建生产版本

```bash
npm run build      # 产出在 dist/
npm run preview    # 本地预览生产构建
```

---

## 部署到 GitHub Pages

### 一次性准备

1. **在 GitHub 上创建仓库**：仓库名必须是 `xixi-cosmos`（与 `vite.config.js` 里的 `base` 一致）。
   - 如果你想用别的仓库名，请把 `vite.config.js` 里 `base: '/xixi-cosmos/'` 同步改成 `'/<新仓库名>/'`。

2. **关联远程仓库并推送**：

   ```bash
   cd "/Users/wuyi/Desktop/息息宇宙V4"
   git remote add origin https://github.com/<你的用户名>/xixi-cosmos.git
   git branch -M main
   git push -u origin main
   ```

3. **开启 GitHub Pages**：
   - 打开仓库 → Settings → Pages
   - "Build and deployment" → **Source** 选择 **GitHub Actions**
   - 保存

### 之后每次更新

只要 push 到 `main` 分支，`.github/workflows/deploy.yml` 会自动构建并部署：

```bash
git add .
git commit -m "feat: 更新内容"
git push
```

去仓库的 **Actions** 标签页可以看到部署进度。完成后访问：

```
https://<你的用户名>.github.io/xixi-cosmos/
```

---

## 项目结构

```
.
├── .github/workflows/deploy.yml   # GitHub Actions 自动部署
├── public/favicon.svg
├── src/
│   ├── App.jsx                    # 主组件（从 息息·宇宙V4.0.txt 复制）
│   ├── main.jsx                   # React 入口
│   └── index.css                  # Tailwind 入口
├── index.html
├── package.json
├── vite.config.js                 # base: '/xixi-cosmos/'
├── tailwind.config.js             # darkMode: 'class'
├── postcss.config.js
└── 息息·宇宙V4.0.txt              # 原始源文件（保留作参考，未参与构建）
```

---

## 常用 git 命令速查

```bash
# 查看当前改动
git status
git diff

# 提交单次修改
git add .
git commit -m "你的提交说明"
git push

# 查看历史
git log --oneline -20

# 撤销未暂存的修改
git restore <file>
```

---

## 常见问题

**Q：部署后页面空白 / 资源 404？**
A：检查 `vite.config.js` 的 `base` 是否与 GitHub 仓库名一致，必须以斜杠结尾，如 `'/xixi-cosmos/'`。

**Q：Tailwind 样式不生效？**
A：确认 `src/index.css` 顶部有 `@tailwind base; @tailwind components; @tailwind utilities;`，且在 `src/main.jsx` 里有 `import './index.css'`。

**Q：本地能跑，部署后样式错乱？**
A：通常是 `base` 路径问题或浏览器缓存。Actions 跑完后强制刷新（Cmd+Shift+R）。
