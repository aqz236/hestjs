# 安装和环境配置

本指南将帮助你设置 HestJS 开发环境，包括必要的依赖项和工具配置。

## 📋 系统要求

### 必需组件
- **Bun**: >= 1.0.0 (推荐最新版本)
- **Node.js**: >= 18.0.0 (作为备用运行时)
- **TypeScript**: >= 5.0.0

### 推荐工具
- **VS Code**: 最佳的开发体验
- **Git**: 版本控制
- **Docker**: 容器化部署 (可选)

## 🚀 安装 Bun

HestJS 基于 Bun 运行时构建，首先需要安装 Bun：

### macOS/Linux
```bash
# 使用官方安装脚本
curl -fsSL https://bun.sh/install | bash

# 或使用 Homebrew (仅 macOS)
brew install bun
```

### Windows
```bash
# 使用 PowerShell
powershell -c "irm bun.sh/install.ps1 | iex"

# 或使用 Scoop
scoop install bun
```

### 验证安装
```bash
bun --version
# 应该显示类似: 1.2.18
```

## 📦 创建新项目

### 方法一：使用官方脚手架（推荐）
```bash
# 使用 create-hest-app
bunx create-hest-app my-app

# 进入项目目录
cd my-app

# 安装依赖
bun install

# 启动开发服务器
bun run dev
```

### 方法二：手动创建

#### 1. 初始化项目
```bash
mkdir my-hest-app
cd my-hest-app
bun init -y
```

#### 2. 安装核心依赖
```bash
# 安装 HestJS 核心包
bun add @hestjs/core

# 安装可选功能包
bun add @hestjs/validation @hestjs/logger @hestjs/scalar

# 安装开发依赖
bun add -d typescript @types/node
```

#### 3. 配置 TypeScript
创建 `tsconfig.json` 文件：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 4. 更新 package.json
```json
{
  "name": "my-hest-app",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "start": "bun dist/index.js",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@hestjs/core": "^0.1.8",
    "@hestjs/validation": "^0.1.3",
    "@hestjs/logger": "^0.1.5",
    "@hestjs/scalar": "^0.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 🔧 开发环境配置

### VS Code 配置

#### 1. 安装推荐扩展
创建 `.vscode/extensions.json`：

```json
{
  "recommendations": [
    "oven.bun-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json"
  ]
}
```

#### 2. 配置设置
创建 `.vscode/settings.json`：

```json
{
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "bun.runtime": "bun"
}
```

#### 3. 调试配置
创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug HestJS App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Prettier 配置
创建 `.prettierrc`：

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 🌍 环境变量配置

### 1. 环境变量文件
创建 `.env` 文件：

```bash
# 应用配置
NODE_ENV=development
PORT=3000
HOST=localhost

# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# 日志配置
LOG_LEVEL=info
LOG_PRETTY=true

# API 文档配置
API_DOCS_ENABLED=true
API_DOCS_PATH=/docs
```

### 2. 加载环境变量
在你的应用中使用：

```typescript
// src/config/env.ts
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  HOST: process.env.HOST || 'localhost',
  DATABASE_URL: process.env.DATABASE_URL,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_PRETTY: process.env.LOG_PRETTY === 'true',
  API_DOCS_ENABLED: process.env.API_DOCS_ENABLED === 'true',
  API_DOCS_PATH: process.env.API_DOCS_PATH || '/docs',
} as const;
```

## ✅ 验证安装

创建一个简单的应用来验证环境配置：

```typescript
// src/index.ts
import { HestFactory } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HestFactory.create(AppModule);
  
  await app.listen(3000);
  logger.info('🚀 Application running on http://localhost:3000');
}

bootstrap();
```

```typescript
// src/app.module.ts
import { Module } from '@hestjs/core';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
})
export class AppModule {}
```

```typescript
// src/app.controller.ts
import { Controller, Get } from '@hestjs/core';

@Controller()
export class AppController {
  @Get('/health')
  health() {
    return { status: 'ok', message: 'HestJS is running!' };
  }
}
```

运行应用：
```bash
bun run dev
```

访问 `http://localhost:3000/health`，应该看到响应：
```json
{
  "status": "ok",
  "message": "HestJS is running!"
}
```

## 🐛 常见问题

### 问题 1: Bun 安装失败
**解决方案**:
```bash
# 清理缓存
rm -rf ~/.bun

# 重新安装
curl -fsSL https://bun.sh/install | bash
```

### 问题 2: TypeScript 装饰器错误
**解决方案**: 确保 `tsconfig.json` 中启用了：
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 问题 3: 模块解析错误
**解决方案**: 检查 `package.json` 中的 `type` 字段：
```json
{
  "type": "module"
}
```

## 📚 下一步

环境配置完成后，继续学习：

1. [创建第一个应用](./first-application.md) - 构建完整的应用
2. [项目结构说明](./project-structure.md) - 了解项目组织
3. [基础概念](../fundamentals/controllers.md) - 学习核心概念

---

**上一步**: [← 框架介绍](./introduction.md) | **下一步**: [创建第一个应用 →](./first-application.md)
