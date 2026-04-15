---
sidebar_position: 1
---

# HestJS 文档

**HestJS** 是基于 Hono + TSyringe 的 TypeScript 后端框架，借鉴 NestJS 设计理念。

## 特点

- **高性能**: 基于 Hono 的快速路由
- **依赖注入**: 使用 TSyringe 实现 DI
- **类型安全**: 完整的 TypeScript 支持
- **装饰器**: 熟悉的 NestJS 风格 API
- **模块化**: 清晰的项目组织结构

## 快速开始

### 环境要求

- Node.js 18+ 或 Bun 1.0+
- TypeScript 5.0+

### 创建项目

```bash
bunx create-hest-app my-app
cd my-app
bun install
bun run dev
```

应用将在 http://localhost:3002 启动。

## 下一步

- [安装指南](./getting-started/installation) - 详细安装步骤
- [第一个应用](./getting-started/first-application) - 创建 Hello World
- [项目结构](./getting-started/project-structure) - 了解目录组织
- [核心概念](./fundamentals/controllers) - 学习框架基础
