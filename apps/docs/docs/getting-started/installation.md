# 安装和快速开始

本指南将帮助你快速创建第一个 HestJS 应用。

## 📋 系统要求

- **Bun**: >= 1.0.0 (推荐)
- **Node.js**: >= 18.0.0 (备选)
- **TypeScript**: >= 5.0.0

## 🚀 安装 Bun

### macOS/Linux
```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 验证安装
```bash
bun --version
```

## 📦 创建新项目

### 使用官方脚手架（推荐）

```bash
# 交互式创建项目
bunx create-hest-app my-app

# 或直接指定项目名
bunx create-hest-app my-app --template base

# 进入项目目录
cd my-app

# 安装依赖
bun install

# 启动开发服务器
bun run dev
```

就这么简单！你的 HestJS 应用已经运行在 `http://localhost:3000`

## 🎯 可用模板

| 模板 | 描述 |
|------|------|
| `base` | 基础模板，包含核心功能 |
| `cqrs` | CQRS 模板，包含命令查询分离示例 |

## ✅ 验证安装

创建成功后，访问以下端点：

- **应用首页**: http://localhost:3000
- **健康检查**: http://localhost:3000/health  
- **API 文档**: http://localhost:3000/docs (如果启用)

## 🔧 开发命令

```bash
# 开发模式（热重载）
bun run dev

# 构建项目
bun run build

# 启动生产服务器
bun run start

# 类型检查
bun run check-types
```

## 🐛 常见问题

### Bun 安装失败
```bash
# 清理缓存后重试
rm -rf ~/.bun
curl -fsSL https://bun.sh/install | bash
```

### 装饰器错误
确保项目中的 `tsconfig.json` 包含：
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## 📚 下一步

- [创建第一个应用](./first-application.md) - 深入了解应用开发
- [项目结构说明](./project-structure.md) - 了解项目组织
- [控制器详解](../fundamentals/controllers.md) - 学习核心概念

---

**上一步**: [← 框架介绍](./introduction.md) | **下一步**: [创建第一个应用 →](./first-application.md)
