# 安装

快速开始使用 HestJS。

## 环境要求

- **Bun**: >= 1.0.0 (推荐)
- **Node.js**: >= 18.0.0 (备选)
- **TypeScript**: >= 5.0.0

## 安装 Bun

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

## 创建项目

### 方式一：使用脚手架（推荐）

```bash
# 创建项目
bunx create-hest-app my-app

# 进入目录
cd my-app

# 安装依赖
bun install

# 启动开发
bun run dev
```

应用将在 `http://localhost:3002` 启动。

### 方式二：手动创建

```bash
# 创建目录
mkdir my-app && cd my-app

# 初始化项目
bun init

# 安装核心依赖
bun add @hestjs/core

# 安装开发依赖
bun add -d typescript @types/node
```

## 可用模板

脚手架提供两种模板：

- **base**: 基础模板，包含基本功能
- **cqrs**: CQRS 模板，包含命令查询分离示例

## 验证安装

访问以下端点确认安装成功：

- **应用首页**: http://localhost:3002/api
- **API 文档**: http://localhost:3002/docs

## 开发命令

```bash
# 开发模式（热重载）  
bun run dev

# 构建
bun run build

# 生产启动
bun run start
```

## 常见问题

**端口冲突**
修改 `src/index.ts` 中的端口号：
```typescript
const port = 3003; // 改为其他端口
```

**依赖安装失败**
清理缓存后重试：
```bash
bun pm cache rm
bun install
```

**Bun 安装失败**
```bash
# 清理缓存重试
rm -rf ~/.bun
curl -fsSL https://bun.sh/install | bash
```

**TypeScript 错误**
确保安装正确版本：
```bash
bun add -d typescript@5.8.3
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
