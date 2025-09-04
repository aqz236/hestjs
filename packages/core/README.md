# @hestjs/core

<div align="center">

[![npm version](https://img.shields.io/npm/v/@hestjs/core.svg)](https://www.npmjs.com/package/@hestjs/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.x-green.svg)](https://hono.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

HestJS 核心包 - 基于 Hono 构建的现代化 TypeScript 后端库，提供装饰器驱动的开发体验和依赖注入系统。

## 🎯 核心理念

- **🔓 拒绝过度封装**：直接暴露原生 Hono 实例，保留所有底层功能
- **✈️ 零配置**：你看不到类似 `hestjs.config.ts`这样的配置文件，无需任何配置
- **🎯 装饰器驱动**：提供熟悉的 NestJS 风格开发体验
- **💉 轻量依赖注入**：基于 TSyringe 的简洁 DI 容器
- **⚡ 极致性能**：基于 Hono 和 Bun 的高性能运行时

## 📦 安装

```bash
npm install @hestjs/core
# 或
yarn add @hestjs/core
# 或
bun add @hestjs/core
```

## 🚀 快速开始

### 1. 创建基础应用

在此之前你应该在tsconfig中添加以下内容：

```json
{
  "compilerOptions": {
    ...
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true
  }
}
```

```typescript
import { Controller, Get, HestFactory, Module } from "@hestjs/core";

@Controller("/")
export class WelcomeController {
  @Get("/welcome")
  async welcome() {
    return "Welcome to HestJS!";
  }
}

@Module({
  controllers: [WelcomeController],
  providers: [],
  imports: [],
  exports: [],
})
export class AppModule {}

async function bootstrap() {
  const app = await HestFactory.create(AppModule);
  const hono = app.hono();

  Bun.serve({
    port: 3000,
    fetch: hono.fetch,
  });
}

bootstrap();
```

### 2. 定义控制器

```typescript
import { Controller, Get, Post, Context, Body, Param } from "@hestjs/core";
import type { HestContext } from "@hestjs/core";

@Controller("/users")
export class UsersController {
  @Get("/")
  async getAllUsers() {
    return { message: "Get all users" };
  }

  @Get("/:id")
  async getUser(@Param("id") id: string, @Context() c: HestContext) {
    return { id, message: `Get user ${id}` };
  }

  @Post("/")
  async createUser(@Body() body: any, @Context() c: HestContext) {
    return { message: "User created", data: body };
  }
}
```

### 3. 创建模块

```typescript
import { Module } from "@hestjs/core";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### 4. 创建服务

```typescript
import { injectable } from "@hestjs/core";

@injectable()
export class UsersService {
  findAll() {
    return [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
    ];
  }

  findOne(id: number) {
    return { id, name: `User ${id}` };
  }
}
```

## 🏗️ 架构概览

### 核心模块

HestJS Core 包含以下主要模块：

```
@hestjs/core/
├── application/          # 应用工厂和实例
│   ├── HestFactory      # 应用工厂
│   └── HestApplicationInstance # 应用实例
├── decorators/          # 装饰器系统
│   ├── @Controller      # 控制器装饰器
│   ├── @Module          # 模块装饰器
│   ├── @injectable      # 可注入装饰器
│   └── 路由装饰器        # @Get, @Post, @Put, @Delete, @Patch
├── container/           # 依赖注入容器
├── router/              # 路由系统
├── exceptions/          # 异常处理
├── interceptors/        # 拦截器
├── interfaces/          # 类型定义
└── utils/              # 工具函数
```

## 📚 API 参考

### 🏭 应用工厂

#### `HestFactory.create(moduleClass)`

创建应用实例的静态方法。

```typescript
import { HestFactory } from "@hestjs/core";
import { AppModule } from "./app.module";

const app = await HestFactory.create(AppModule);
```

### 🎮 控制器装饰器

#### `@Controller(path?: string)`

定义控制器类和基础路径。

```typescript
@Controller("/api/users")
export class UsersController {
  // 控制器方法
}
```

### 🛣️ 路由装饰器

#### HTTP 方法装饰器

- `@Get(path?: string)` - GET 请求
- `@Post(path?: string)` - POST 请求
- `@Put(path?: string)` - PUT 请求
- `@Delete(path?: string)` - DELETE 请求
- `@Patch(path?: string)` - PATCH 请求

```typescript
@Controller('/users')
export class UsersController {
  @Get('/')           // GET /users/
  @Get('/:id')        // GET /users/:id
  @Post('/')          // POST /users/
  @Put('/:id')        // PUT /users/:id
  @Delete('/:id')     // DELETE /users/:id
  @Patch('/:id')      // PATCH /users/:id
}
```

### 📥 参数装饰器

#### `@Context()`

获取完整的 Hono Context 对象。

```typescript
@Get('/')
async getUsers(@Context() c: HestContext) {
  // 访问所有 Hono Context 功能
  const userAgent = c.req.header('User-Agent');
  return c.json({ message: 'Hello' });
}
```

#### `@Body()`

获取请求体数据。

```typescript
@Post('/')
async createUser(@Body() userData: CreateUserDto) {
  return userData;
}
```

#### `@Param(key?: string)`

获取路径参数。

```typescript
@Get('/:id')
async getUser(@Param('id') id: string) {
  return { id };
}
```

#### `@Query(key?: string)`

获取查询参数。

```typescript
@Get('/')
async getUsers(@Query('page') page: string) {
  return { page };
}
```

#### `@Header(key?: string)`

获取请求头。

```typescript
@Get('/')
async getUsers(@Header('authorization') auth: string) {
  return { auth };
}
```

### 🏗️ 模块系统

#### `@Module(options)`

定义模块和依赖关系。

```typescript
interface ModuleOptions {
  imports?: any[]; // 导入的模块
  controllers?: any[]; // 控制器
  providers?: any[]; // 提供者（服务）
  exports?: any[]; // 导出的提供者
}

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### 💉 依赖注入

#### `@injectable()`

标记类为可注入的服务。

```typescript
@injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}
}
```

### 🔄 拦截器和过滤器

#### 全局拦截器

```typescript
const app = await HestFactory.create(AppModule);

// 添加全局拦截器
app.useGlobalInterceptors(new ValidationInterceptor());
app.useGlobalInterceptors(new ResponseInterceptor());
```

#### 全局异常过滤器

```typescript
const app = await HestFactory.create(AppModule);

// 添加全局异常过滤器
app.useGlobalFilters(new HttpExceptionFilter());
```

### 🌐 直接访问 Hono

HestJS 不会封装 Hono，你可以直接使用所有 Hono 功能：

```typescript
const app = await HestFactory.create(AppModule);
const honoApp = app.hono();

// 使用 Hono 原生中间件
honoApp.use(cors());
honoApp.use("/api/*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// 添加自定义路由
honoApp.get("/health", (c) => c.text("OK"));
```

## 🧪 类型系统

### HestContext

提供完整的 Hono Context 类型安全：

```typescript
import type { HestContext } from '@hestjs/core';

@Get('/')
async handler(@Context() c: HestContext) {
  // 完整的 Hono Context API
  const method = c.req.method;
  const url = c.req.url;
  const headers = c.req.header();

  return c.json({ method, url });
}
```

## 🔮 未来路线图

### v0.2.x - 增强功能

- [ ] **中间件系统** - 完善的中间件装饰器支持
- [ ] **管道系统** - 数据转换和验证管道
- [ ] **守卫系统** - 路由级别的访问控制
- [ ] **元数据增强** - 更丰富的反射元数据支持

### v0.3.x - 性能优化

- [ ] **路由缓存** - 路由匹配性能优化
- [ ] **依赖注入优化** - 容器解析性能提升
- [ ] **热重载支持** - 开发环境下的热重载
- [ ] **构建优化** - 更小的打包体积

### v0.4.x - 生态系统

- [ ] **WebSocket 支持** - 实时通信功能
- [ ] **文件上传** - 内置文件处理能力
- [ ] **缓存系统** - 多级缓存支持
- [ ] **任务调度** - 定时任务和队列系统

### v0.5.x - 企业级功能

- [ ] **微服务支持** - 服务发现和通信
- [ ] **配置管理** - 环境配置和动态配置
- [ ] **健康检查** - 应用监控和诊断
- [ ] **链路追踪** - 分布式追踪支持

### v1.0.x - 稳定版本

- [ ] **API 稳定** - 向后兼容的 API
- [ ] **完整文档** - 全面的使用指南
- [ ] **性能基准** - 与其他框架的对比
- [ ] **生产就绪** - 企业级部署支持

## 📋 当前功能状态

### ✅ 已实现功能

- [x] **应用工厂** - `HestFactory.create()`
- [x] **控制器系统** - `@Controller()` 装饰器
- [x] **路由装饰器** - `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`
- [x] **参数装饰器** - `@Context()`, `@Body()`, `@Param()`, `@Query()`, `@Header()`
- [x] **模块系统** - `@Module()` 装饰器
- [x] **依赖注入** - 基于 TSyringe 的 DI 容器
- [x] **异常处理** - 基础异常过滤器
- [x] **拦截器** - 全局拦截器支持
- [x] **类型安全** - 完整的 TypeScript 支持
- [x] **Hono 集成** - 直接访问 Hono 实例

### 🚧 开发中功能

- [ ] **装饰器中间件** - `@UseMiddleware()` 装饰器
- [ ] **路由守卫** - `@UseGuards()` 装饰器
- [ ] **数据管道** - `@UsePipes()` 装饰器
- [ ] **OpenAPI 集成** - 自动 API 文档生成

## 💡 设计原则

1. **最小封装** - 不隐藏底层框架的功能
2. **类型安全** - 完整的 TypeScript 支持
3. **性能优先** - 基于高性能的 Hono 和 Bun
4. **开发体验** - 熟悉的装饰器语法
5. **渐进式** - 可以逐步采用各种功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE)

---

**更多信息**：

- 📚 [完整文档](https://aqz236.github.io/hestjs-demo)
- 🎮 [示例项目](https://github.com/aqz236/hestjs-demo)
- 🐛 [问题反馈](https://github.com/aqz236/hest/issues)
