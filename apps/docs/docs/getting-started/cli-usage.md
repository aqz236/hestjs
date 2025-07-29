# CLI 工具使用

HestJS 提供了强大的命令行工具，帮助开发者快速创建项目、生成代码和管理应用程序。本指南将详细介绍如何使用这些 CLI 工具提高开发效率。

## 📦 create-hest-app

`create-hest-app` 是官方的项目脚手架工具，用于快速创建新的 HestJS 应用。

### 基本使用

```bash
# 创建新项目
bunx create-hest-app my-app

# 或使用 npm
npx create-hest-app my-app

# 进入项目目录
cd my-app

# 安装依赖
bun install

# 启动开发服务器
bun run dev
```

### 项目模板选择

```bash
# 交互式创建，选择模板
bunx create-hest-app my-app

# 直接指定模板
bunx create-hest-app my-app --template basic
bunx create-hest-app my-app --template full-featured
bunx create-hest-app my-app --template microservice
```

### 可用模板

| 模板 | 描述 | 包含功能 |
|------|------|----------|
| `basic` | 基础模板 | 核心功能、简单示例 |
| `full-featured` | 完整功能模板 | 所有功能包、示例代码 |
| `microservice` | 微服务模板 | 适合微服务架构 |
| `api-only` | 纯 API 模板 | 无前端，专注 API 开发 |

### 创建选项

```bash
# 指定项目名称和目录
bunx create-hest-app my-awesome-api --directory ./projects

# 跳过依赖安装
bunx create-hest-app my-app --skip-install

# 使用特定版本
bunx create-hest-app my-app --version 0.1.8

# 显示详细信息
bunx create-hest-app my-app --verbose
```

## 🛠️ 项目内 CLI 命令

### 开发命令

```bash
# 启动开发服务器（热重载）
bun run dev

# 构建项目
bun run build

# 启动生产服务器
bun run start

# 类型检查
bun run check-types

# 代码格式化
bun run format

# 代码检查
bun run lint
```

### 代码生成器

虽然 HestJS 目前还在开发完善生成器功能，但你可以使用以下模式手动创建：

#### 生成控制器
```bash
# 手动创建控制器文件结构
mkdir -p src/modules/products
touch src/modules/products/products.controller.ts
touch src/modules/products/products.service.ts
touch src/modules/products/products.module.ts
```

创建控制器模板：
```typescript
// src/modules/products/products.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '@hestjs/core';
import { ProductsService } from './products.service';

@Controller('/api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return await this.productsService.findAll();
  }

  @Get('/:id')
  async findById(@Param('id') id: string) {
    return await this.productsService.findById(id);
  }

  @Post()
  async create(@Body() createProductDto: any) {
    return await this.productsService.create(createProductDto);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() updateProductDto: any) {
    return await this.productsService.update(id, updateProductDto);
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return await this.productsService.delete(id);
  }
}
```

#### 生成服务
```typescript
// src/modules/products/products.service.ts
import { injectable } from 'tsyringe';
import { logger } from '@hestjs/logger';

@injectable()
export class ProductsService {
  async findAll() {
    logger.info('Fetching all products');
    // TODO: 实现业务逻辑
    return [];
  }

  async findById(id: string) {
    logger.info(`Fetching product with id: ${id}`);
    // TODO: 实现业务逻辑
    return null;
  }

  async create(createProductDto: any) {
    logger.info('Creating new product', createProductDto);
    // TODO: 实现业务逻辑
    return {};
  }

  async update(id: string, updateProductDto: any) {
    logger.info(`Updating product with id: ${id}`, updateProductDto);
    // TODO: 实现业务逻辑
    return {};
  }

  async delete(id: string) {
    logger.info(`Deleting product with id: ${id}`);
    // TODO: 实现业务逻辑
    return true;
  }
}
```

#### 生成模块
```typescript
// src/modules/products/products.module.ts
import { Module } from '@hestjs/core';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

## 🔧 package.json 脚本配置

### 推荐的脚本配置

```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "start": "bun dist/index.js",
    "preview": "bun run build && bun run start",
    
    "check-types": "tsc --noEmit",
    "type-check": "tsc --noEmit --watch",
    
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    
    "lint": "eslint src --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix",
    
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    
    "clean": "rm -rf dist",
    "clean:deps": "rm -rf node_modules && bun install",
    
    "docker:build": "docker build -t my-hest-app .",
    "docker:run": "docker run -p 3000:3000 my-hest-app"
  }
}
```

## 🐳 Docker 集成

### Dockerfile 示例

```dockerfile
# Dockerfile
FROM oven/bun:1-alpine AS base

WORKDIR /app

# 复制依赖文件
COPY package.json bun.lockb ./

# 安装依赖
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN bun run build

# 生产阶段
FROM oven/bun:1-alpine AS production

WORKDIR /app

# 复制构建结果
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./

# 只安装生产依赖
RUN bun install --production --frozen-lockfile

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["bun", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 🔄 开发工作流

### 1. 日常开发流程

```bash
# 1. 启动开发环境
bun run dev

# 2. 在另一个终端进行类型检查（可选）
bun run type-check

# 3. 运行测试（可选）
bun run test:watch

# 4. 代码提交前检查
bun run lint && bun run format && bun run check-types
```

### 2. 添加新功能

```bash
# 1. 创建分支
git checkout -b feature/user-management

# 2. 创建模块结构
mkdir -p src/modules/users/{dto,entities,__tests__}

# 3. 生成代码文件
touch src/modules/users/users.{controller,service,module}.ts
touch src/modules/users/dto/{create-user,update-user,user}.dto.ts
touch src/modules/users/entities/user.entity.ts

# 4. 开发和测试
bun run dev
bun run test

# 5. 代码检查
bun run lint:fix && bun run format

# 6. 提交代码
git add .
git commit -m "feat: add user management module"
```

### 3. 部署流程

```bash
# 1. 构建检查
bun run build

# 2. 运行测试
bun run test

# 3. 类型检查
bun run check-types

# 4. 代码质量检查
bun run lint && bun run format:check

# 5. 构建 Docker 镜像
docker build -t my-app:latest .

# 6. 部署
docker-compose up -d
```

## 🛠️ 开发工具集成

### VS Code 配置

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
      "type": "shell",
      "command": "bun",
      "args": ["run", "dev"],
      "group": "build",
      "isBackground": true,
      "problemMatcher": "$tsc-watch"
    },
    {
      "label": "build",
      "type": "shell",
      "command": "bun",
      "args": ["run", "build"],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "test",
      "type": "shell",
      "command": "bun",
      "args": ["run", "test"],
      "group": "test"
    }
  ]
}
```

### 调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug HestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true
    }
  ]
}
```

## 📊 性能监控

### 启动时间测量

```bash
# 测量启动时间
time bun run start

# 分析启动过程
bun --inspect src/index.ts
```

### 构建分析

```bash
# 分析构建大小
bun build src/index.ts --outdir dist --analyze

# 查看依赖包大小
bunx bundle-analyzer dist/index.js
```

## 🚀 CI/CD 集成

### GitHub Actions 示例

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Install dependencies
      run: bun install --frozen-lockfile
    
    - name: Type check
      run: bun run check-types
    
    - name: Lint
      run: bun run lint
    
    - name: Format check
      run: bun run format:check
    
    - name: Test
      run: bun run test
    
    - name: Build
      run: bun run build
```

## 📚 下一步

掌握了 CLI 工具后，继续深入学习：

1. [控制器详解](../fundamentals/controllers.md) - 学习路由和控制器
2. [模块系统](../fundamentals/modules.md) - 理解模块化架构
3. [依赖注入](../fundamentals/dependency-injection.md) - 掌握 DI 系统
4. [项目结构](./project-structure.md) - 了解项目组织

---

**上一步**: [← 项目结构说明](./project-structure.md) | **下一步**: [控制器详解 →](../fundamentals/controllers.md)
