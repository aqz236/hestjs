# HestJS 文档部署指南

## 📚 文档导航

- **[快速部署](./QUICK_DEPLOY.md)** - 一键部署和常用命令
- **[完整指南](./DEPLOYMENT_GUIDE.md)** - 详细的部署流程说明
- **[问题排查](./TROUBLESHOOTING.md)** - 常见问题和解决方案

## 🚀 快速开始

```bash
# 一键部署（推荐）
bun run docs:deploy

# 如果失败，使用手动部署
cd packages/hestjs-docs
./deploy.sh
```

## 📖 访问地址

**正式网站**: https://aqz236.github.io/hestjs-demo/

---

本目录包含完整的部署文档和脚本，涵盖了从配置到部署的全流程。

## 本地开发

在根目录运行以下命令：

```bash
# 启动开发服务器
bun run docs:dev

# 构建文档
bun run docs:build

# 预览构建后的文档
bun run docs:serve
```

## 手动部署到 GitHub Pages

### 前置要求

1. **确保你有 hestjs-demo 仓库的写入权限**
2. **在本地配置 Git 用户信息**：
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### 部署步骤

1. **进入文档目录**：
   ```bash
   cd packages/hestjs-docs
   ```

2. **构建并部署**：
   ```bash
   # 使用 Docusaurus 内置部署命令
   GIT_USER=aqz236 bun run deploy
   
   # 或者使用完整命令
   GIT_USER=aqz236 USE_SSH=true bun run deploy
   ```

3. **验证部署**：
   - 部署完成后，访问：https://aqz236.github.io/hestjs-demo/
   - 通常需要等待几分钟 GitHub Pages 才会更新

### 手动部署流程

如果自动部署出现问题，可以手动操作：

1. **构建文档**：
   ```bash
   cd packages/hestjs-docs
   bun run build
   ```

2. **克隆目标仓库**：
   ```bash
   git clone https://github.com/aqz236/hestjs-demo.git /tmp/hestjs-demo-deploy
   cd /tmp/hestjs-demo-deploy
   
   # 切换到或创建 gh-pages 分支
   git checkout gh-pages || git checkout --orphan gh-pages
   
   # 清除现有内容
   git rm -rf . || true
   ```

3. **复制构建文件**：
   ```bash
   # 复制构建输出到仓库
   cp -r /path/to/hest/packages/hestjs-docs/build/* .
   
   # 添加 .nojekyll 文件（重要！）
   touch .nojekyll
   ```

4. **提交并推送**：
   ```bash
   git add .
   git commit -m "Deploy docs"
   git push origin gh-pages
   ```

### GitHub Pages 设置

1. **前往仓库设置**：
   - 访问：https://github.com/aqz236/hestjs-demo/settings/pages

2. **配置 Pages**：
   - Source: "Deploy from a branch"
   - Branch: "gh-pages"
   - Folder: "/ (root)"

3. **等待部署**：
   - GitHub 会自动检测到新的提交并部署
   - 访问：https://aqz236.github.io/hestjs-demo/

## 目录结构

```
packages/hestjs-docs/
├── docs/                 # 文档内容
├── blog/                 # 博客文章
├── src/                  # 组件和样式
├── static/               # 静态资源
├── docusaurus.config.ts  # 配置文件
├── sidebars.ts          # 侧边栏配置
└── DEPLOYMENT.md        # 本文档
```

## 常见问题

### 部署失败

1. **权限问题**：确保你有 hestjs-demo 仓库的写入权限
2. **SSH 密钥**：如果使用 SSH，确保已配置 SSH 密钥
3. **网络问题**：可能需要使用 VPN 或镜像

### 页面空白

1. **检查 baseUrl**：确保 `docusaurus.config.ts` 中的 `baseUrl` 是 `/hestjs-demo/`
2. **检查资源路径**：确保所有静态资源使用相对路径

### 部署命令示例

```bash
# 最简单的部署方式
cd packages/hestjs-docs
GIT_USER=aqz236 bun run deploy

# 使用 SSH（推荐）
GIT_USER=aqz236 USE_SSH=true bun run deploy

# 指定自定义分支
GIT_USER=aqz236 DEPLOYMENT_BRANCH=main bun run deploy
```
