# 快速部署指南

## 🚀 一键部署

```bash
# 从项目根目录执行
cd /Users/ttx/Projects/HestJS/hest
bun run docs:deploy
```

## 📝 本地开发

```bash
# 启动开发服务器
bun run docs:dev

# 构建并预览
bun run docs:build
bun run docs:serve
```

## 🔧 如果自动部署失败

首次部署时，如果遇到 "gh-pages 分支不存在" 错误，使用手动部署：

```bash
# 手动部署脚本
cd packages/hestjs-docs
./deploy.sh
```

或按以下步骤手动操作：

```bash
# 1. 克隆目标仓库
cd /tmp
git clone https://github.com/aqz236/hestjs-demo.git
cd hestjs-demo

# 2. 创建 gh-pages 分支
git checkout --orphan gh-pages
git rm -rf .

# 3. 复制构建产物
cp -r /Users/ttx/Projects/HestJS/hest/packages/hestjs-docs/build/* .
touch .nojekyll

# 4. 提交并推送
git add .
git commit -m "Deploy HestJS docs"
git push origin gh-pages

# 5. 清理
cd && rm -rf /tmp/hestjs-demo
```

## ⚙️ GitHub Pages 设置

访问 https://github.com/aqz236/hestjs-demo/settings/pages

设置：
- Source: Deploy from a branch
- Branch: gh-pages
- Folder: / (root)

## 🌐 访问地址

https://aqz236.github.io/hestjs-demo/

---

详细说明请参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
