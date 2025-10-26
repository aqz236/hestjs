# HestJS 🚀

一个基于 **Hono + Bun + TSyringe** 的现代化 TypeScript 后端框架，提供类似 NestJS 的开发体验，但具有更轻量和更高性能的特点。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-latest-orange.svg)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-green.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ 特性

- 🎯 **装饰器驱动** - 使用装饰器定义控制器、服务、中间件
- 💉 **依赖注入** - 基于 TSyringe 的完整 DI 容器，用户透明
- 🏗️ **模块化架构** - 采用模块系统组织代码
- ⚡ **高性能** - 基于 Hono 和 Bun 获得最佳性能
- 🔒 **类型安全** - 完全的 TypeScript 支持
- 🛡️ **验证系统** - 基于 TypeBox 的强大验证功能
- 🔄 **拦截器** - 灵活的请求/响应拦截机制
- 🚨 **异常处理** - 完善的异常过滤和处理系统

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/aqz236/hest.git
cd HestJS

# 安装依赖
bun install

# 构建包
bun run build

# 运行示例应用
cd apps/hest-demo
bun run dev
```

### 创建你的第一个应用

```typescript
// app.controller.ts
import { Controller, Get, Post, Body } from "@hestjs/core";
import { IsString, IsEmail, IsNumber } from "@hestjs/validation";

export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 0, maximum: 120 })
  age!: number;
}

@Controller("/api")
export class AppController {
  @Get("/users")
  getUsers() {
    return { users: [] };
  }

  @Post("/users")
  createUser(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    // createUserDto 已经过验证和类型转换
    return { success: true, data: createUserDto };
  }
}
```

```typescript
// app.module.ts
import { Module } from "@hestjs/core";
import { AppController } from "./app.controller";

@Module({
  controllers: [AppController],
})
export class AppModule {}
```

```typescript
// main.ts
import { HestFactory } from "@hestjs/core";
import { ValidationInterceptor } from "@hestjs/validation";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await HestFactory.create(AppModule);

  // 启用全局验证
  app.useGlobalInterceptors(new ValidationInterceptor());

  await app.listen(3000);
  console.log("🚀 Application is running on: http://localhost:3000");
}

bootstrap();
```

## 📁 项目结构

```
packages/
├── core/                     # 核心框架包
│   ├── decorators/           # 装饰器定义
│   ├── interfaces/           # 核心接口
│   ├── application/          # 应用核心
│   └── exceptions/           # 异常处理
├── validation/               # 验证模块
│   ├── decorators/           # 验证装饰器
│   ├── pipes/                # 验证管道
│   └── interceptors/         # 验证拦截器
└── ...
```

## 🎯 核心概念

### 控制器 (Controllers)

```typescript
@Controller("/users")
export class UserController {
  @Get("/")
  findAll() {
    return { users: [] };
  }

  @Get("/:id")
  findOne(@Param("id") id: string) {
    return { user: { id } };
  }

  @Post("/")
  create(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    return { success: true };
  }
}
```

### 服务和依赖注入 (Services & DI)

```typescript
@Injectable()
export class UserService {
  async findAll() {
    return [];
  }

  async create(userData: any) {
    // 创建用户逻辑
    return userData;
  }
}

@Controller("/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/")
  async findAll() {
    return await this.userService.findAll();
  }
}
```

### 验证系统 (Validation)

#### 基础验证装饰器

```typescript
export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 18, maximum: 100 })
  age!: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
```

#### 自定义验证 (TypeBox API)

```typescript
import { Type } from "@sinclair/typebox";
import { Custom, CommonValidators, SchemaFactory } from "@hestjs/validation";

export class AdvancedDto {
  // 使用 TypeBox API 自定义验证
  @Custom(
    Type.String({
      minLength: 3,
      maxLength: 20,
      pattern: "^[a-zA-Z0-9_]+$",
    })
  )
  username!: string;

  // 使用联合类型
  @Custom(
    Type.Union([
      Type.Literal("admin"),
      Type.Literal("user"),
      Type.Literal("guest"),
    ])
  )
  role!: "admin" | "user" | "guest";

  // 使用常用验证器
  @CommonValidators.UUID()
  userId!: string;

  // 使用便捷构建器
  @Custom(SchemaFactory.chinesePhoneNumber())
  phoneNumber!: string;

  // 复杂对象验证
  @Custom(
    Type.Object({
      lat: Type.Number({ minimum: -90, maximum: 90 }),
      lng: Type.Number({ minimum: -180, maximum: 180 }),
    })
  )
  location!: { lat: number; lng: number };
}
```

### 拦截器 (Interceptors)

```typescript
import { Interceptor, ExecutionContext, CallHandler } from "@hestjs/core";

export class LoggingInterceptor implements Interceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log("Before...");

    const now = Date.now();
    return next.handle().then(() => {
      console.log(`After... ${Date.now() - now}ms`);
    });
  }
}

// 使用拦截器
app.useGlobalInterceptors(new LoggingInterceptor());
```

### 异常处理 (Exception Handling)

```typescript
import {
  HttpException,
  NotFoundException,
  BadRequestException,
} from "@hestjs/core";

@Controller("/users")
export class UserController {
  @Get("/:id")
  findOne(@Param("id") id: string) {
    const user = this.findUserById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  @Post("/")
  create(@Body() userData: any) {
    if (!userData.email) {
      throw new BadRequestException("Email is required");
    }
    return this.createUser(userData);
  }
}
```

## 🔧 开发状态

### ✅ 已完成功能

- **Phase 1: 核心基础设施** ✅
  - 装饰器系统 (`@Controller`, `@Injectable`, `@Module`, 路由装饰器)
  - 依赖注入容器 (基于 TSyringe)
  - 应用工厂 (`HestFactory.create()`)
  - 路由系统和参数注入

- **Phase 2: 中间件和异常处理** ✅
  - 异常处理系统 (HttpException, 异常过滤器)
  - 拦截器系统 (Interceptor, ExecutionContext)
  - 全局拦截器和异常过滤器支持

- **Phase 3: 验证系统** ✅
  - 基于 TypeBox 的验证装饰器
  - @Custom() 装饰器支持完整 TypeBox API
  - ValidationInterceptor 自动验证
  - SchemaFactory 和 CommonValidators
  - 详细验证错误处理

### 🚧 开发中

- **Phase 4: 配置和日志系统**
- **Phase 5: 高级拦截器和管道**
- **Phase 6: CLI 工具**

## 📊 性能

基于 Bun 运行时和 Hono 框架，HestJS 提供了卓越的性能：

- 🚀 **快速启动** - 得益于 Bun 的快速启动时间
- ⚡ **高吞吐量** - Hono 的高效路由和中间件系统
- 💾 **低内存占用** - 轻量级架构设计
- 🔧 **编译时优化** - TypeScript 装饰器元数据预处理

## 🛠️ 开发

### 构建项目

```bash
# 安装依赖
bun install

# 构建所有包
bun run build

# 运行测试
bun run test

# 运行示例应用
cd apps/hest-demo
bun run dev
```

### 测试验证功能

```bash
# 运行 Phase 3 验证测试
bun test-phase3.ts
```

## 📖 API 参考

### 装饰器

- `@Controller(path?)` - 定义控制器
- `@Injectable()` - 标记可注入服务
- `@Module(options)` - 定义模块
- `@Get(path?)`, `@Post(path?)`, `@Put(path?)`, `@Delete(path?)` - HTTP 路由
- `@Body(dtoClass?)`, `@Param(key?)`, `@Query(key?)` - 参数注入
- `@IsString()`, `@IsEmail()`, `@IsNumber()` - 基础验证
- `@Custom(schema, options?)` - 自定义 TypeBox 验证

### 核心类

- `HestFactory` - 应用工厂
- `HttpException` - HTTP 异常基类
- `ValidationInterceptor` - 验证拦截器
- `Interceptor` - 拦截器接口
- `ExecutionContext` - 执行上下文

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

## 📄 许可证

[MIT](LICENSE)

## 🔗 相关链接

- [Hono](https://hono.dev/) - 快速、轻量级的 Web 框架
- [Bun](https://bun.sh/) - 快速的 JavaScript 运行时
- [TSyringe](https://github.com/microsoft/tsyringe) - 依赖注入容器
- [TypeBox](https://github.com/sinclairzx81/typebox) - JSON Schema 类型构建器

---

⭐ 如果这个项目对你有帮助，请给个 Star！
