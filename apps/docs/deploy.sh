#!/bin/bash

# HestJS 文档部署脚本
# 使用方法: ./deploy.sh

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
