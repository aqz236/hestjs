# HestJS Demo 🚀

一个基于 **Hono + Bun + TSyringe** 的现代化 TypeScript 后端框架演示应用，提供类似 NestJS 的开发体验，但具有更轻量和更高性能的特点。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-latest-orange.svg)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-green.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ 核心特性

- 🎯 **装饰器驱动** - 类似 NestJS 的开发体验
- ⚡ **高性能** - 基于 Hono 和 Bun
- 💉 **依赖注入** - 基于 TSyringe 的完整 DI 容器
- 🏗️ **模块化架构** - 清晰的代码组织
- 🛡️ **数据验证** - 基于 TypeBox 的验证系统
- 📚 **API 文档** - 自动生成 OpenAPI 文档
- 🔄 **CQRS 支持** - 命令查询职责分离
- 📝 **日志系统** - 基于 Pino 的高性能日志

## 🚀 快速开始

### 创建新项目

使用官方脚手架创建新的 HestJS 应用：

```bash
# 交互式创建
npx create-hest-app@latest
# 或
bun create hest-app

# 直接指定项目名
npx create-hest-app@latest my-app
```

### 运行演示应用

如果你想运行这个演示应用：

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev
```

### 访问应用

- **API 服务**: http://localhost:3002
- **API 文档**: http://localhost:3002/docs
- **健康检查**: http://localhost:3002/health

## 📚 文档

完整的框架文档请访问：**https://aqz236.github.io/hestjs-demo**

## 🎯 API 端点

### 基础端点
- `GET /health` - 健康检查
- `GET /` - 欢迎消息

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建新用户
- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 数据验证示例
- `POST /api/custom-validation/validate-user` - 用户数据验证示例

## 🔧 项目结构

```
src/
├── index.ts                    # 应用入口
├── app.module.ts              # 根模块
├── app.controller.ts          # 应用控制器
├── modules/                   # 功能模块
│   ├── users/                 # 用户模块
│   └── custom-validation/     # 验证示例模块
├── common/                    # 公共组件
│   ├── filters/               # 异常过滤器
│   └── interceptors/          # 拦截器
└── config/                    # 配置文件
```

## 🛠️ 技术栈

- **运行时**: Bun
- **Web 框架**: Hono
- **依赖注入**: TSyringe
- **验证**: TypeBox + @hestjs/validation
- **日志**: Pino + @hestjs/logger
- **API 文档**: Scalar + @hestjs/scalar
- **CQRS**: @hestjs/cqrs

## 📖 代码示例

### 创建控制器

```typescript
import { Controller, Get, Post, Body, Param } from '@hestjs/core';
import { IsString, IsEmail, IsNumber } from '@hestjs/validation';

export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 0, maximum: 120 })
  age!: number;
}

@Controller('/api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Post()
  async create(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }
}
```

### 创建模块

```typescript
import { Module } from '@hestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## 🧪 测试 API

### 创建用户

```bash
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "age": 28
  }'
```

### 获取用户列表

```bash
curl http://localhost:3002/api/users
```

## 📋 可用脚本

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

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE)

---

**文档地址**: https://aqz236.github.io/hestjs-demo
