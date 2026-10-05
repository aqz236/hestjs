# @hestjs/core

<div align="center">

[![npm version](https://img.shields.io/npm/v/@hestjs/core.svg)](https://www.npmjs.com/package/@hestjs/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.x-green.svg)](https://hono.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

HestJS 核心包 - 基于 Hono 构建的现代化 TypeScript 后端库，提供装饰器驱动的开发体验和依赖注入系统。

## 🎯 核心理念

- **🔓 拒绝过度封装**：用户直接控制 Hono 实例，保留所有底层功能和灵活性
- **✈️ 零配置**：你看不到类似 `hestjs.config.ts`这样的配置文件，无需任何配置
- **🎯 装饰器驱动**：提供熟悉的 NestJS 风格开发体验
- **💉 轻量依赖注入**：基于 TSyringe 的简洁 DI 容器
- **⚡ 极致性能**：基于 Hono 和 Bun 的高性能运行时
- **🌊 原生中间件**：直接使用 Hono 中间件，无需额外抽象层

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
import { Hono } from "hono";
import { cors } from "hono/cors";

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
  const hono = new Hono();
  hono.use(cors());
  
  // 将 Hono 实例传递给 HestJS
  const app = await HestFactory.create(hono, AppModule);

  // 直接使用原生 Hono 实例
  Bun.serve({
    port: 3000,
    fetch: hono.fetch,
  });
}

bootstrap();
```

### 2. 异常处理

两种方式都受支持。使用 Hono 中间件：

```typescript
import type { Context, Next } from 'hono';

const exceptionMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error: any) {
    const status = error.status || 500;
    return c.json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: c.req.url,
      message: error.message || 'Internal Server Error',
    }, status);
  }
};

// 在 bootstrap 中使用
const hono = new Hono();
hono.use('*', exceptionMiddleware); // 全局异常处理
hono.use(cors());

const app = await HestFactory.create(hono, AppModule);
```

### 3. 定义控制器

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

### 4. 创建模块

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

### 5. 创建服务

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

#### `HestFactory.create(honoInstance, moduleClass)`

创建应用实例的静态方法。

```typescript
import { Hono } from "hono";
import { HestFactory } from "@hestjs/core";
import { AppModule } from "./app.module";

const hono = new Hono();
const app = await HestFactory.create(hono, AppModule);
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

### 🧩 中间件

`@UseMiddleware()` 把 Hono 中间件声明式地挂到控制器或方法上。

```typescript
import type { MiddlewareHandler } from 'hono';
import { Controller, Get, UseMiddleware } from '@hestjs/core';

const requireAuth: MiddlewareHandler = async (c, next) => {
  if (!c.req.header('authorization')) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  await next();
};

@Controller('/users')
@UseMiddleware(requestIdMiddleware)      // 类级：该控制器所有路由
export class UsersController {
  @Get('/')
  findAll() {
    return { users: [] };
  }

  @Delete('/:id')
  @UseMiddleware(requireAuth)            // 方法级：仅此方法
  remove(@Param('id') id: string) {
    return { removed: id };
  }
}
```

执行顺序为 **类级中间件 → 方法级中间件 → 拦截器 → controller 方法**，
整体是洋葱模型。详情见文档站的[中间件](https://aqz236.github.io/hestjs/docs/fundamentals/middleware)一节。

### 🔄 拦截器

拦截器是**面向 controller 方法**的横切能力。它比 Hono 中间件多知道一件事：
**即将执行的是哪个方法**，因此可以依据方法上的装饰器元数据工作。

#### 接口

```typescript
interface Interceptor<T = any, R = any> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<R> | Promise<Observable<R>> | Promise<R>;
}

interface ExecutionContext {
  /** 控制器类本身 */
  getClass(): any;
  /** 当前方法信息 */
  getHandler(): any;
  /** 方法参数（当前恒为空数组，见下方注意事项） */
  getArgs(): any[];
  getArgByIndex<T = any>(index: number): T;
  /** 切到 HTTP 视图，拿到原始 Hono Context / Request */
  switchToHttp(): HttpArgumentsHost;
}

interface CallHandler<T = any> {
  /** 调用链的下一环；最后一环会去解析参数并执行 controller 方法 */
  handle(): Observable<T> | Promise<T>;
}
```

#### 示例

```typescript
import type {
  CallHandler,
  ExecutionContext,
  Interceptor,
} from '@hestjs/core';
import { Injectable } from '@hestjs/core';

@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const started = Date.now();

    try {
      return await next.handle();
    } finally {
      console.log(`${request.method} ${request.url} - ${Date.now() - started}ms`);
    }
  }
}

// 注册（全局生效）
app.useGlobalInterceptors(new LoggingInterceptor());
```

#### 执行顺序

```
Hono 中间件（app.getHonoInstance().use(...)）
└─ 拦截器 1 前半
   └─ 拦截器 2 前半
      └─ 参数解析（@Body / @Param / @Query / @Context）
         └─ controller 方法
      ┌─ 拦截器 2 后半（next.handle() 返回后）
   ┌─ 拦截器 1 后半
└─ 返回值处理
```

按注册顺序**先进后出**；`next.handle()` 内部才去做参数解析，
因此拦截器可以包住参数解析与控制器调用（也可以选择不调用它）。

⚠️ 尚无 `@UseInterceptors()` 这类方法级装饰器，目前**只能全局注册**。

#### 注意事项

- `getHandler()` 返回的是 `{ name: '<方法名>' }` 形式的描述对象，
  **不是**真实的方法引用
- `getArgs()` 目前恒为空数组；需要方法参数时请在方法内部读取，
  或使用 Hono 原生中间件
- 返回 HTTP 响应时，请直接 `return`（或返回 `Response`），
  拦截器包装过的返回值会走与普通返回值相同的序列化流程

### 🚨 异常过滤器

异常过滤器捕获 handler 中的任何抛出物：拦截器、参数解析、controller 方法。

#### 接口

```typescript
interface ExceptionFilter<T = any> {
  catch(exception: T, host: ArgumentsHost): any;
}

interface ArgumentsHost {
  getContext(): Context;   // 原始 Hono Context
  getRequest(): any;
  getResponse(): any;
}
```

#### 示例

```typescript
import type { ArgumentsHost, ExceptionFilter } from '@hestjs/core';
import { HttpException } from '@hestjs/core';

export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const c = host.getContext();
    return c.json(exception.getResponse(), exception.status);
  }
}

app.useGlobalFilters(new HttpExceptionFilter());
```

#### 匹配规则

按注册顺序依次尝试，**第一个不抛错的结果胜出**；
全部未命中时回退到 `DefaultExceptionFilter`（`HttpException` 用其 `status`，
其余一律 500）。

⚠️ 目前**只有全局过滤器**，没有控制器级/方法级过滤器，
也不会按异常类型自动筛选 —— 需要自行在 `catch` 里判断类型。

### 🌐 直接访问 Hono

HestJS 不会封装 Hono，你可以直接使用所有 Hono 功能：

```typescript
const app = await HestFactory.create(hono, AppModule);
const honoApp = app.getHonoInstance();

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

- [X] **应用工厂** - `HestFactory.create(honoInstance, moduleClass)`
- [X] **控制器系统** - `@Controller()` 装饰器
- [X] **路由装饰器** - `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`
- [X] **参数装饰器** - `@Context()`, `@Body()`, `@Param()`, `@Query()`, `@Header()`
- [X] **模块系统** - `@Module()` 装饰器
- [X] **依赖注入** - 基于 TSyringe 的 DI 容器

## 🔄 重构说明

### v0.2.0 重大更新 - 移除过度封装

为了提供更大的灵活性和更好的性能，我们进行了一次重要的架构重构：

#### 🗑️ v0.2.0 移除的功能

- **`app.hono()` 方法** - 改为由调用方创建 `new Hono()` 并传入 `HestFactory.create()`，
  通过 `app.getHonoInstance()` 取回

#### ✅ 保留并由本次修复恢复的功能

- **全局异常过滤器** - `app.useGlobalFilters()`
- **全局拦截器** - `app.useGlobalInterceptors()`

这两项在 v0.2.0 的重构中曾被一并删除，但它们是「面向 controller 方法」的横切能力：
拦截器通过 `ExecutionContext.getClass()` / `getHandler()` 定位到具体方法，
因此可以读取方法上的参数装饰器元数据。`@hestjs/validation` 的
`@Body(UserDto)` 参数级 DTO 校验正依赖这一点，而 Hono 中间件只持有路径、
无法得知即将执行的是哪个方法，故该项能力无法用中间件替代，已恢复。

> 单纯的异常处理确实可以用 Hono 的 `onError` 或中间件完成，两种方式都受支持。

#### ✨ 新的设计理念

- **用户控制** - 用户手动创建 `new Hono()` 实例
- **原生中间件** - 直接使用 Hono 的中间件生态
- **零多余抽象** - 只保留 Hono 中间件无法覆盖的「面向方法」能力
- **最大灵活性** - 保留 Hono 的所有原生功能

#### 🚀 迁移指南

**旧的方式：**

```typescript
const app = await HestFactory.create(AppModule);
const hono = app.hono();
```

**新的方式：**

```typescript
import { Hono } from 'hono';
import { HestFactory } from '@hestjs/core';

const hono = new Hono();
hono.use('*', myMiddleware);            // 直接用 Hono 中间件

const app = await HestFactory.create(hono, AppModule);

// 面向方法的横切能力仍然可用
app.useGlobalInterceptors(new ValidationInterceptor());
app.useGlobalFilters(new HttpExceptionFilter());

Bun.serve({ fetch: app.getHonoInstance().fetch });
```

这种设计让 HestJS 真正成为"基于 Hono 的 OOP 框架"，而不是"包装 Hono 的框架"。

- [X] **异常处理** - 基础异常过滤器
- [X] **拦截器** - 全局拦截器支持
- [X] **类型安全** - 完整的 TypeScript 支持
- [X] **Hono 集成** - 直接访问 Hono 实例

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
