# HestJS 🚀

一个基于 **Hono + Bun + TSyringe** 的现代化 TypeScript 后端框架，提供类似 NestJS 的开发体验，但具有更轻量和更高性能的特点。

[![CI](https://github.com/aqz236/hestjs/actions/workflows/ci.yml/badge.svg)](https://github.com/aqz236/hestjs/actions/workflows/ci.yml)
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

## 📦 包

| 包 | 说明 |
| --- | --- |
| [`@hestjs/core`](./packages/core) | 核心框架：装饰器、DI 容器、路由、拦截器、异常过滤器 |
| [`@hestjs/cqrs`](./packages/cqrs) | CQRS 模块：Command / Query / Event 总线 |
| [`@hestjs/validation`](./packages/validation) | 基于 TypeBox 的验证模块与 DTO 装饰器 |
| [`@hestjs/scalar`](./packages/scalar) | OpenAPI 生成与 Scalar API 文档 UI |
| [`@hestjs/logger`](./packages/logger) | 基于 pino 的日志模块 |
| [`@hestjs/typescript-config`](./packages/typescript-config) | 共享 tsconfig |
| [`@hestjs/eslint-config`](./packages/eslint-config) | 共享 ESLint 配置 |
| [`create-hest-app`](./apps/create-hest-app) | 项目脚手架 |

## 🚀 快速开始

### 环境要求

- [Bun](https://bun.sh/) >= 1.2
- Node.js >= 18（仅部分工具链需要）

### 安装与构建

```bash
git clone https://github.com/aqz236/hestjs.git
cd hestjs

bun install
bun run build
```

### 运行示例应用

```bash
bun run --cwd apps/hestjs-demo dev
# 打开 http://localhost:3002，文档在 http://localhost:3002/docs
```

### 创建你的第一个应用

```bash
bun create hest-app my-app
cd my-app
bun run dev
```

## 📁 项目结构

本仓库是 Turborepo 单仓多包结构：

```
packages/
├── core/                     # 核心框架包
│   ├── decorators/           # 装饰器定义
│   ├── interfaces/           # 核心接口
│   ├── application/          # 应用核心
│   ├── interceptors/         # 拦截器
│   └── exceptions/           # 异常处理
├── validation/               # 验证模块
│   ├── decorators/           # 验证装饰器
│   ├── pipes/                # 验证管道
│   └── interceptors/         # 验证拦截器
├── cqrs/                     # CQRS 模块
├── scalar/                   # OpenAPI / Scalar 文档
├── logger/                   # 日志模块
├── typescript-config/        # 共享 tsconfig
└── eslint-config/            # 共享 ESLint 配置

apps/
├── hestjs-demo/              # 完整功能演示
├── playground/               # CQRS 示例
├── docs/                     # Docusaurus 文档站
└── create-hest-app/          # 脚手架

docs/                         # 框架设计文档
```

各包的提交历史自分散仓库合并而来，完整保留。

## 🎯 核心概念

### 应用启动

Hono 实例由调用方创建并传入，因此可以直接使用 Hono 的全部原生能力：

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HestFactory } from "@hestjs/core";
import { AppModule } from "./app.module";

const hono = new Hono();
const app = await HestFactory.create(hono, AppModule);

app.getHonoInstance().use(cors());

Bun.serve({ fetch: app.getHonoInstance().fetch });
```

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

拦截器与异常过滤器是**面向 controller 方法**的横切能力：它们能通过
`ExecutionContext.getClass()` / `getHandler()` 拿到即将执行的方法，
因此可以读取方法上的参数装饰器元数据 —— 这正是 `@Body(UserDto)`
参数级校验的实现基础，也是 Hono 中间件无法替代的部分。

**职责边界与执行顺序：**

```
Hono 中间件  →  全局拦截器（按注册顺序）  →  controller 方法  →  拦截器回程
                                                              ↓ 抛错时
                                                         全局异常过滤器
```

单纯的请求预处理、CORS、日志等优先用 Hono 原生中间件；
需要按方法签名做参数校验或统一响应包装时才使用拦截器。

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

也可以用 Hono 的 `onError` 或中间件处理异常，两种方式都受支持。

## 🔧 开发状态

### ✅ 已完成功能

- **Phase 1: 核心基础设施** ✅
  - 装饰器系统 (`@Controller`, `@Injectable`, `@Module`, 路由装饰器)
  - 依赖注入容器 (基于 TSyringe)
  - 应用工厂 (`HestFactory.create(honoInstance, moduleClass)`)
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

- **Monorepo 重构** ✅
  - 13 个分散仓库合并为 Turborepo 单仓多包
  - CI / Release / Docs 部署流水线
  - Changesets 版本管理

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

### 常用命令

```bash
bun install          # 安装依赖
bun run build        # 构建全部包（带 Turbo 缓存）
bun run check-types  # 类型检查
bun run test         # 运行测试
bun run lint         # Lint
bun run format       # 格式化

# 只操作单个包
bun run --filter @hestjs/core build
```

### 端到端测试

`apps/hestjs-demo/scripts/test-phase3.ts` 覆盖验证层的完整链路
（必填、长度、邮箱、数值范围、联合类型、UUID、手机号、经纬度、邮箱数组）。

```bash
# 终端 1：启动 demo
bun run --cwd apps/hestjs-demo dev

# 终端 2：跑端到端测试
bun run --cwd apps/hestjs-demo test:e2e
```

### 发布

版本与发布由 [Changesets](https://github.com/changesets/changesets) 管理：

```bash
bun run changeset          # 为本次改动记录 changeset
```

合入 `main` 后由 Release workflow 自动创建版本 PR 并发布到 npm。

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
- `ExceptionFilter` / `ArgumentsHost` - 异常过滤器
- `Interceptor` / `ExecutionContext` / `CallHandler` - 拦截器
- `ValidationInterceptor` - 验证拦截器

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

仓库从 13 个分散仓库合并而来，迁移过程与遗留问题记录在 [MIGRATION.md](./MIGRATION.md)。

## 📄 许可证

[MIT](LICENSE)

## 🔗 相关链接

- [在线文档](https://aqz236.github.io/hestjs/)
- [Hono](https://hono.dev/) - 快速、轻量级的 Web 框架
- [Bun](https://bun.sh/) - 快速的 JavaScript 运行时
- [TSyringe](https://github.com/microsoft/tsyringe) - 依赖注入容器
- [TypeBox](https://github.com/sinclairzx81/typebox) - JSON Schema 类型构建器

---

⭐ 如果这个项目对你有帮助，请给个 Star！
