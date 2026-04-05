# 部署问题排查指南

## 🔍 常见问题诊断

### 1. 自动部署失败

#### 问题：`gh-pages` 分支不存在

**错误信息**：
```
致命错误：远程分支 gh-pages 在上游 origin 未发现
```

**解决方案**：
使用手动部署创建分支：

```bash
# 手动创建 gh-pages 分支
cd /tmp
git clone https://github.com/aqz236/hestjs-demo.git
cd hestjs-demo
git checkout --orphan gh-pages
git rm -rf .
cp -r /Users/ttx/Projects/HestJS/hest/packages/hestjs-docs/build/* .
touch .nojekyll
git add .
git commit -m "Initial gh-pages commit"
git push origin gh-pages
cd && rm -rf /tmp/hestjs-demo
```

#### 问题：SSH 认证失败

**错误信息**：
```
Permission denied (publickey)
```

**解决方案**：
1. 使用 HTTPS 代替 SSH：
   ```bash
   GIT_USER=aqz236 bun run deploy
   ```

2. 或配置 SSH 密钥：
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   # 将公钥添加到 GitHub
   ```

### 2. 页面显示问题

#### 问题：页面显示空白

**可能原因**：
- `baseUrl` 配置错误
- 静态资源路径问题

**解决方案**：
1. 检查 `docusaurus.config.ts`:
   ```typescript
   baseUrl: '/hestjs-demo/', // 确保以 / 结尾
   ```

2. 确保构建产物中有 `.nojekyll` 文件

#### 问题：404 错误

**检查清单**：
- [ ] GitHub Pages 已启用
- [ ] 分支设置为 `gh-pages`
- [ ] 文件夹设置为 `/ (root)`
- [ ] 等待 3-5 分钟让 GitHub 处理

### 3. 权限问题

#### 问题：推送被拒绝

**错误信息**：
```
remote: Permission to aqz236/hestjs-demo.git denied
```

**解决方案**：
1. 检查 GitHub 权限
2. 确认用户名正确
3. 验证 SSH 密钥或 Personal Access Token

### 4. 构建问题

#### 问题：构建失败

**常见原因**：
- 依赖缺失
- TypeScript 错误
- 链接错误

**解决方案**：
```bash
# 清理并重新安装依赖
bun install

# 检查 TypeScript 错误
bun run typecheck

# 检查链接
bun run build 2>&1 | grep -i "broken"
```

## 🛠️ 调试工具

### 检查构建输出

```bash
# 构建并检查输出目录
bun run build
ls -la build/
```

### 本地测试部署

```bash
# 本地预览构建结果
bun run serve
# 访问 http://localhost:3000/hestjs-demo/
```

### GitHub Pages 状态检查

1. 访问 https://github.com/aqz236/hestjs-demo/actions
2. 查看最新的 "pages build and deployment" workflow
3. 检查是否有错误信息

## 📝 调试命令

```bash
# 完整的调试流程
cd /Users/ttx/Projects/HestJS/hest/packages/hestjs-docs

# 1. 清理缓存
bun run clear

# 2. 重新安装依赖
bun install

# 3. 本地开发测试
bun run start

# 4. 构建测试
bun run build

# 5. 本地预览
bun run serve

# 6. 部署
bun run deploy
```

## 🔧 手动部署备用方案

如果所有自动化方案都失败，使用完全手动的方式：

```bash
#!/bin/bash
# 完全手动部署脚本

# 1. 构建
cd /Users/ttx/Projects/HestJS/hest/packages/hestjs-docs
bun run build

# 2. 准备目标目录
cd /tmp
rm -rf hestjs-demo-manual
git clone https://github.com/aqz236/hestjs-demo.git hestjs-demo-manual
cd hestjs-demo-manual

# 3. 切换到 gh-pages（如果不存在则创建）
git checkout gh-pages 2>/dev/null || git checkout --orphan gh-pages

# 4. 清空并复制新内容
git rm -rf . 2>/dev/null || true
cp -r /Users/ttx/Projects/HestJS/hest/packages/hestjs-docs/build/* .
touch .nojekyll

# 5. 提交并推送
git add .
git commit -m "Manual deploy $(date)"
git push origin gh-pages --force

# 6. 清理
cd /tmp
rm -rf hestjs-demo-manual

echo "✅ 手动部署完成"
```

## 📞 获取帮助

如果以上方案都无法解决问题：

1. 检查 [GitHub Pages 状态](https://www.githubstatus.com/)
2. 查看 [Docusaurus 部署文档](https://docusaurus.io/docs/deployment)
3. 在项目中创建 issue 记录问题
