# HestJS 文档部署完整指南

本文档记录了如何将 HestJS 文档从开发环境部署到 GitHub Pages 的完整流程。

## 📋 目录

1. [环境准备](#环境准备)
2. [Docusaurus 配置](#docusaurus-配置)
3. [构建文档](#构建文档)
4. [手动部署到 GitHub Pages](#手动部署到-github-pages)
5. [GitHub Pages 设置](#github-pages-设置)
6. [自动化部署配置](#自动化部署配置)
7. [常见问题解决](#常见问题解决)

## 环境准备

### 前置要求

- Node.js >= 18.0
- Bun 包管理器
- Git 配置（用户名和邮箱）
- GitHub 仓库访问权限（hestjs-demo）

### 目录结构

```
/Users/ttx/Projects/HestJS/hest/
├── packages/
│   └── hestjs-docs/           # 文档项目
│       ├── docs/              # 文档内容
│       ├── blog/              # 博客文章
│       ├── src/               # 组件和样式
│       ├── static/            # 静态资源
│       ├── docusaurus.config.ts
│       ├── package.json
│       └── deploy.sh          # 部署脚本
└── package.json               # 根目录配置
```

## Docusaurus 配置

### 1. 更新 `docusaurus.config.ts`

配置正确的部署参数：

```typescript
const config: Config = {
  title: 'HestJS',
  tagline: 'A modern, type-safe Node.js framework inspired by NestJS, built with Hono and TSyringe',
  favicon: 'img/favicon.ico',

  // 部署配置
  url: 'https://aqz236.github.io',
  baseUrl: '/hestjs-demo/',

  // GitHub pages 部署配置
  organizationName: 'aqz236',
  projectName: 'hestjs-demo',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  // 其他配置...
};
```

### 2. 更新 `package.json` 部署脚本

在 `packages/hestjs-docs/package.json` 中配置：

```json
{
  "scripts": {
    "deploy": "GIT_USER=aqz236 USE_SSH=true docusaurus deploy --remote-url git@github.com:aqz236/hestjs-demo.git"
  }
}
```

### 3. 根目录快捷命令

在根目录 `package.json` 中添加：

```json
{
  "scripts": {
    "docs:dev": "cd packages/hestjs-docs && bun run start",
    "docs:build": "cd packages/hestjs-docs && bun run build",
    "docs:serve": "cd packages/hestjs-docs && bun run serve",
    "docs:deploy": "cd packages/hestjs-docs && GIT_USER=aqz236 USE_SSH=true bun run deploy"
  }
}
```

## 构建文档

### 本地开发测试

```bash
# 进入项目根目录
cd /Users/ttx/Projects/HestJS/hest

# 启动开发服务器
bun run docs:dev
# 访问: http://localhost:3000/hestjs-demo/

# 构建文档
bun run docs:build

# 预览构建结果
bun run docs:serve
```

### 验证构建产物

构建完成后，检查 `packages/hestjs-docs/build/` 目录：

```bash
ls -la packages/hestjs-docs/build/
# 应该包含: index.html, assets/, docs/, blog/ 等
```

## 手动部署到 GitHub Pages

### 第一次部署（创建 gh-pages 分支）

当自动部署失败时（通常是因为 gh-pages 分支不存在），使用手动部署：

```bash
# 1. 克隆目标仓库到临时目录
cd /tmp
git clone https://github.com/aqz236/hestjs-demo.git
cd hestjs-demo

# 2. 创建并切换到 gh-pages 分支
git checkout --orphan gh-pages

# 3. 清空分支内容
git rm -rf .

# 4. 复制构建产物
cp -r /Users/ttx/Projects/HestJS/hest/packages/hestjs-docs/build/* .

# 5. 添加 .nojekyll 文件（重要！）
touch .nojekyll

# 6. 提交并推送
git add .
git commit -m "Deploy HestJS documentation to GitHub Pages"
git push origin gh-pages

# 7. 清理临时文件
cd /tmp
rm -rf hestjs-demo
```

### 后续部署

gh-pages 分支创建后，可以使用自动部署：

```bash
cd /Users/ttx/Projects/HestJS/hest
bun run docs:deploy
```

## GitHub Pages 设置

### 1. 启用 GitHub Pages

1. 访问：https://github.com/aqz236/hestjs-demo/settings/pages
2. 配置设置：
   - **Source**: "Deploy from a branch"
   - **Branch**: "gh-pages"
   - **Folder**: "/ (root)"
3. 点击 "Save"

### 2. 验证部署

- 等待 GitHub 构建完成（通常 2-5 分钟）
- 访问：https://aqz236.github.io/hestjs-demo/
- 检查页面是否正确显示 HestJS 内容

## 自动化部署配置

### 部署脚本 `deploy.sh`

创建 `packages/hestjs-docs/deploy.sh`：

```bash
#!/bin/bash

# HestJS 文档部署脚本
set -e

echo "🚀 开始部署 HestJS 文档到 GitHub Pages..."

# 检查是否在正确的目录
if [ ! -f "docusaurus.config.ts" ]; then
    echo "❌ 错误：请在 packages/hestjs-docs 目录下运行此脚本"
    exit 1
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  警告：检测到未提交的更改，建议先提交到主分支"
    read -p "是否继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
fi

# 构建文档
echo "📦 构建文档..."
bun run build

# 部署到 GitHub Pages
echo "🌐 部署到 GitHub Pages..."
GIT_USER=aqz236 USE_SSH=true bun run deploy

echo "✅ 部署完成！"
echo "📖 文档地址：https://aqz236.github.io/hestjs-demo/"
echo "⏳ 请等待几分钟让 GitHub Pages 更新..."
```

使脚本可执行：

```bash
chmod +x packages/hestjs-docs/deploy.sh
```

### 使用部署脚本

```bash
# 方式一：从根目录
bun run docs:deploy

# 方式二：使用脚本
cd packages/hestjs-docs
./deploy.sh

# 方式三：直接使用 docusaurus 命令
cd packages/hestjs-docs
GIT_USER=aqz236 USE_SSH=true bun run deploy
```

## 常见问题解决

### 1. 部署失败：`gh-pages` 分支不存在

**错误信息**：
```
致命错误：远程分支 gh-pages 在上游 origin 未发现
```

**解决方案**：使用手动部署创建 gh-pages 分支（见上文）

### 2. 页面显示空白或 404

**可能原因**：
- `baseUrl` 配置错误
- 静态资源路径问题
- 缺少 `.nojekyll` 文件

**解决方案**：
1. 检查 `docusaurus.config.ts` 中的 `baseUrl: '/hestjs-demo/'`
2. 确保构建产物中有 `.nojekyll` 文件
3. 检查 GitHub Pages 设置是否正确

### 3. SSH 认证失败

**错误信息**：
```
Permission denied (publickey)
```

**解决方案**：
1. 配置 SSH 密钥到 GitHub
2. 或使用 HTTPS：
   ```bash
   GIT_USER=aqz236 bun run deploy
   ```

### 4. 权限问题

**错误信息**：
```
remote: Permission to aqz236/hestjs-demo.git denied
```

**解决方案**：
- 确保 GitHub 用户 `aqz236` 对 `hestjs-demo` 仓库有写权限
- 检查 SSH 密钥或 GitHub token 配置

## 完整部署流程总结

1. **配置 Docusaurus**：设置正确的 URL、baseUrl 和 GitHub 参数
2. **本地构建测试**：`bun run docs:build` 和 `bun run docs:serve`
3. **首次手动部署**：创建 gh-pages 分支并推送构建产物
4. **配置 GitHub Pages**：在仓库设置中启用 Pages
5. **后续自动部署**：使用 `bun run docs:deploy` 自动更新

## 维护和更新

### 日常工作流程

1. **编辑文档**：修改 `docs/` 或 `blog/` 目录下的文件
2. **本地预览**：`bun run docs:dev`
3. **构建测试**：`bun run docs:build`
4. **部署更新**：`bun run docs:deploy`

### 最佳实践

- 提交文档更改到主分支后再部署
- 定期检查 GitHub Pages 构建状态
- 使用 `docs:serve` 在本地验证构建结果
- 保持 `.nojekyll` 文件在 gh-pages 分支中

---

**文档网址**：https://aqz236.github.io/hestjs-demo/

**最后更新**：2025年7月29日
