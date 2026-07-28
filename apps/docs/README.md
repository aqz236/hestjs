# HestJS Documentation

HestJS 官方文档网站，使用 [Docusaurus](https://docusaurus.io/) 构建。

🌐 **在线访问**: https://aqz236.github.io/hestjs/

## 🚀 快速开始

### 安装依赖

```bash
bun install
```

### 本地开发

```bash
# 启动开发服务器
bun run start
# 或从根目录
bun run docs:dev
```

这会启动本地开发服务器并打开浏览器窗口。大多数更改会实时反映，无需重启服务器。

### 构建

```bash
# 构建文档
bun run build
# 或从根目录
bun run docs:build
```

这会在 `build` 目录中生成静态内容，可以通过任何静态内容托管服务提供服务。

### 预览构建结果

```bash
bun run serve
# 或从根目录
bun run docs:serve
```

## 📦 部署

### 一键部署到 GitHub Pages

```bash
# 从项目根目录
bun run docs:deploy

# 或直接在文档目录
bun run deploy
```

### 手动部署

如果自动部署失败，可以使用手动部署脚本：

```bash
./deploy.sh
```

### 部署到其他平台

```bash
# 构建后复制 build 目录到你的服务器
bun run build
# 然后部署 build/ 目录的内容
```

## 📚 文档说明

- **详细部署指南**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **快速部署**: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

## 🗂️ 目录结构

```
packages/hestjs-docs/
├── docs/                 # 主要文档内容
├── blog/                 # 博客文章
├── src/                  # 组件和样式
│   ├── components/       # React 组件
│   ├── css/             # 自定义样式
│   └── pages/           # 自定义页面
├── static/              # 静态资源
├── docusaurus.config.ts # 配置文件
├── sidebars.ts         # 侧边栏配置
├── deploy.sh           # 部署脚本
└── README.md           # 本文档
```

## 🛠️ 自定义

### 添加新文档

1. 在 `docs/` 目录下创建或编辑 Markdown 文件
2. 更新 `sidebars.ts` 配置侧边栏导航
3. 重新构建和部署

### 修改主题

1. 编辑 `src/css/custom.css` 自定义样式
2. 修改 `docusaurus.config.ts` 配置主题选项
3. 在 `src/components/` 下创建自定义组件

### 更新配置

主要配置文件：
- `docusaurus.config.ts`: 网站基本配置
- `sidebars.ts`: 文档导航结构
- `package.json`: 脚本和依赖

---

**🌐 在线访问**: https://aqz236.github.io/hestjs/

**📖 HestJS 项目**: https://github.com/aqz236/hestjs
