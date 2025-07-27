# HestJS 框架架构设计

## 概述

HestJS 是一个基于 Hono + Bun + TSyringe 的现代化 TypeScript 后端框架，采用面向对象编程 (OOP) 和依赖注入 (DI) 模式，提供类似 NestJS 的开发体验，但具有更轻量和更高性能的特点。

## 核心设计原则

1. **装饰器驱动** - 使用装饰器定义控制器、服务、中间件等
2. **依赖注入** - 基于 TSyringe 实现完整的 DI 容器
3. **模块化架构** - 采用模块系统组织代码
4. **性能优先** - 基于 Hono 和 Bun 获得最佳性能
5. **TypeScript 原生** - 完全的类型安全支持

## 项目结构设计

```
packages/
├── core/                     # 核心框架包
│   ├── src/
│   │   ├── decorators/       # 装饰器定义
│   │   │   ├── controller.ts
│   │   │   ├── injectable.ts
│   │   │   ├── module.ts
│   │   │   ├── route.ts      # Get, Post, Put, Delete 等
│   │   │   ├── middleware.ts
│   │   │   ├── guard.ts
│   │   │   └── index.ts
│   │   ├── interfaces/       # 核心接口定义
│   │   │   ├── application.ts
│   │   │   ├── module.ts
│   │   │   ├── controller.ts
│   │   │   ├── middleware.ts
│   │   │   ├── guard.ts
│   │   │   └── index.ts
│   │   ├── application/      # 应用核心
│   │   │   ├── hest-application.ts
│   │   │   ├── application-factory.ts
│   │   │   └── index.ts
│   │   ├── container/        # DI 容器封装
│   │   │   ├── container.ts
│   │   │   ├── injection-token.ts
│   │   │   └── index.ts
│   │   ├── router/           # 路由系统
│   │   │   ├── router-explorer.ts
│   │   │   ├── route-metadata.ts
│   │   │   └── index.ts
│   │   ├── metadata/         # 元数据管理
│   │   │   ├── metadata-scanner.ts
│   │   │   ├── reflector.ts
│   │   │   └── index.ts
│   │   ├── exceptions/       # 异常处理
│   │   │   ├── base-exception.ts
│   │   │   ├── http-exception.ts
│   │   │   ├── exception-filter.ts
│   │   │   └── index.ts
│   │   ├── utils/           # 工具函数
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── common/                   # 通用功能包
│   ├── src/
│   │   ├── guards/          # 内置守卫
│   │   │   ├── auth.guard.ts
│   │   │   ├── rate-limit.guard.ts
│   │   │   └── index.ts
│   │   ├── middlewares/     # 内置中间件
│   │   │   ├── cors.middleware.ts
│   │   │   ├── logger.middleware.ts
│   │   │   ├── compression.middleware.ts
│   │   │   └── index.ts
│   │   ├── pipes/           # 数据转换管道
│   │   │   ├── validation.pipe.ts
│   │   │   ├── transform.pipe.ts
│   │   │   └── index.ts
│   │   ├── interceptors/    # 拦截器
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── cache.interceptor.ts
│   │   │   └── index.ts
│   │   ├── dto/            # 数据传输对象基类
│   │   │   ├── base.dto.ts
│   │   │   └── index.ts
│   │   ├── enums/          # 枚举定义
│   │   │   ├── http-status.enum.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── validation/              # 验证模块
│   ├── src/
│   │   ├── decorators/
│   │   │   ├── class-validator.ts
│   │   │   ├── is-email.ts
│   │   │   ├── is-string.ts
│   │   │   └── index.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── config/                  # 配置模块
│   ├── src/
│   │   ├── decorators/
│   │   │   ├── config.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── config.service.ts
│   │   │   └── index.ts
│   │   ├── interfaces/
│   │   │   ├── config-options.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── logger/                  # 日志模块
│   ├── src/
│   │   ├── services/
│   │   │   ├── logger.service.ts
│   │   │   └── index.ts
│   │   ├── interfaces/
│   │   │   ├── logger-options.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── testing/                 # 测试工具
│   ├── src/
│   │   ├── testing-module.ts
│   │   ├── test-bed.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── cli/                     # CLI 工具
    ├── src/
    │   ├── commands/
    │   │   ├── generate.ts
    │   │   ├── new.ts
    │   │   └── index.ts
    │   ├── templates/
    │   │   ├── controller.template.ts
    │   │   ├── service.template.ts
    │   │   ├── module.template.ts
    │   │   └── index.ts
    │   └── index.ts
    ├── package.json
    └── tsconfig.json

apps/
├── example-app/             # 示例应用
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── controllers/
│   │   │   ├── app.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── services/
│   │   │   ├── app.service.ts
│   │   │   └── user.service.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   └── middlewares/
│   │       └── logging.middleware.ts
│   ├── package.json
│   └── tsconfig.json
│
└── benchmark/               # 性能测试应用
    ├── src/
    │   ├── main.ts
    │   └── benchmark.controller.ts
    ├── package.json
    └── tsconfig.json
```

## 核心模块设计

### 1. Core 模块 (@hest/core)

核心模块提供框架的基础功能：

- **装饰器系统**: 提供 `@Controller`、`@Injectable`、`@Module`、`@Get`、`@Post` 等装饰器
- **DI 容器**: 基于 TSyringe 的依赖注入容器封装
- **应用工厂**: `HestFactory.create()` 创建应用实例
- **路由系统**: 自动扫描和注册路由
- **异常处理**: 统一的异常处理机制

### 2. Common 模块 (@hest/common)

通用功能模块：

- **内置守卫**: 认证、授权、限流等
- **内置中间件**: CORS、日志、压缩等
- **管道**: 数据验证和转换
- **拦截器**: 请求/响应拦截处理
- **DTO 基类**: 数据传输对象基础类

### 3. Validation 模块 (@hest/validation)

数据验证模块：

- **验证装饰器**: 类似 class-validator 的验证装饰器
- **验证管道**: 自动数据验证
- **自定义验证器**: 支持自定义验证逻辑

### 4. Config 模块 (@hest/config)

配置管理模块：

- **配置服务**: 统一的配置管理
- **环境变量**: 自动加载和类型转换
- **配置验证**: 配置项验证

### 5. Logger 模块 (@hestjs/logger)

日志模块：

- **结构化日志**: JSON 格式日志输出
- **日志级别**: 支持多种日志级别
- **日志中间件**: 自动记录请求日志

## API 设计示例

### 基础应用

```typescript
// main.ts
import { HestFactory } from "@hest/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await HestFactory.create(AppModule);
  await app.listen(3000);
  console.log("Application is running on: http://localhost:3000");
}

bootstrap();
```

### 模块定义

```typescript
// app.module.ts
import { Module } from "@hest/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 控制器定义

```typescript
// app.controller.ts
import { Controller, Get, Post, Body, Param } from "@hest/core";
import { AppService } from "./app.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("/api/users")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  async getUsers() {
    return this.appService.getUsers();
  }

  @Get("/:id")
  async getUser(@Param("id") id: string) {
    return this.appService.getUser(id);
  }

  @Post("/")
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.appService.createUser(createUserDto);
  }
}
```

### 服务定义

```typescript
// app.service.ts
import { Injectable } from "@hest/core";

@Injectable()
export class AppService {
  private users = [];

  async getUsers() {
    return this.users;
  }

  async getUser(id: string) {
    return this.users.find((user) => user.id === id);
  }

  async createUser(userData: any) {
    const user = { id: Date.now().toString(), ...userData };
    this.users.push(user);
    return user;
  }
}
```

## 性能特性

1. **Bun 运行时**: 利用 Bun 的高性能 JavaScript 运行时
2. **Hono 路由**: 使用 Hono 的高效路由系统
3. **编译时优化**: 通过装饰器元数据预处理减少运行时开销
4. **懒加载**: 支持模块和服务的懒加载
5. **缓存机制**: 内置缓存拦截器和服务

## 开发计划 (Todo List)

### Phase 1: 核心基础设施 (Week 1-2) ✅ **已完成**

#### Core 包开发 ✅

- [x] 设置项目基础结构和构建配置
- [x] 实现基础装饰器系统
  - [x] `@Controller` 装饰器
  - [x] `@Injectable` 装饰器
  - [x] `@Module` 装饰器
  - [x] 路由装饰器 (`@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`)
  - [x] 参数装饰器 (`@Body`, `@Param`, `@Query`, `@Header`, `@Req`, `@Res`)
- [x] 实现 DI 容器封装
  - [x] 容器初始化和管理
  - [x] 服务注册和解析
  - [x] TSyringe 集成（用户透明）
- [x] 实现元数据扫描器
  - [x] 装饰器元数据收集
  - [x] 类型反射工具
- [x] 实现路由系统
  - [x] 路由自动发现和注册
  - [x] 路径参数解析
  - [x] 基础中间件集成

#### 应用工厂开发 ✅

- [x] 实现 `HestFactory.create()` 方法
- [x] 应用生命周期管理
- [x] 模块初始化流程
- [x] Hono 应用集成

#### 示例应用验证 ✅

- [x] 创建功能完整的示例应用
- [x] 验证装饰器系统工作正常
- [x] 验证 API 端点功能
- [x] 确保用户无需直接使用 TSyringe

**Phase 1 总结:**

- ✅ 核心框架基础设施已完成
- ✅ 装饰器系统工作正常，API 与 NestJS 类似
- ✅ DI 系统正常工作，用户无需接触 TSyringe
- ✅ 路由系统能正确处理 GET、POST 等请求
- ✅ 参数注入（@Body、@Param、@Query）工作正常
- ✅ 示例应用运行成功，验证了核心功能

### Phase 2: 中间件和异常处理 (Week 2-3) ✅ **已完成**

#### 异常处理系统 ✅

- [x] 基础异常类设计 (BaseException)
- [x] HTTP 异常类实现 (HttpException, NotFoundException, BadRequestException 等)
- [x] 全局异常过滤器 (DefaultExceptionFilter)
- [x] 自定义异常过滤器支持 (ExceptionFilter 接口)
- [x] 异常过滤器应用机制 (app.useGlobalFilters)

#### 拦截器系统 ✅

- [x] 拦截器接口定义 (Interceptor - 重构命名更简洁)
- [x] 执行上下文实现 (ExecutionContext, CallHandler)
- [x] 全局拦截器支持 (app.useGlobalInterceptors)
- [x] 内置拦截器实现
  - [x] 响应拦截器 (ResponseInterceptor)
  - [x] 日志拦截器 (LoggingInterceptor)
  - [x] 验证拦截器 (ValidationInterceptor - Phase 3)

#### 中间件系统 ✅

- [x] 中间件装饰器 `@Middleware`
- [x] 中间件接口定义 (MiddlewareConsumer)
- [x] 内置中间件实现
  - [x] CORS 中间件
  - [x] 日志中间件
  - [x] 压缩中间件（基础实现）

#### API 增强 ✅

- [x] 类似 NestJS 的全局配置 API
  - [x] `app.useGlobalInterceptors(new ResponseInterceptor())`
  - [x] `app.useGlobalFilters(new HttpExceptionFilter())`
- [x] 完整的异常处理链
- [x] 拦截器执行链

**Phase 2 总结:**

- ✅ 异常处理系统完全实现，支持自定义异常类和过滤器
- ✅ 拦截器系统完整实现，支持请求/响应拦截和转换
- ✅ 中间件系统基础实现，支持装饰器和函数式中间件
- ✅ API 设计完全兼容 NestJS 风格
- ✅ 全局配置机制工作正常
- ✅ 示例应用验证所有功能正常工作

### Phase 3: 验证系统 (Week 3-4) ✅ **已完成**

#### Validation 包开发 ✅

- [x] 验证装饰器实现
  - [x] `@IsString`, `@IsNumber`, `@IsEmail` 等基础验证
  - [x] `@IsOptional`, `@IsArray` 等复合验证
  - [x] `@Custom()` 自定义验证装饰器支持 (完全 TypeBox API)
- [x] 验证管道集成
  - [x] ValidationInterceptor 自动验证请求体
  - [x] 详细验证错误处理和友好错误消息
  - [x] TypeBox 类型转换支持
- [x] DTO 类型安全
  - [x] 基于 TypeBox 的运行时类型验证
  - [x] 完整的编译时类型检查
- [x] 高级验证功能
  - [x] SchemaFactory 便捷构建器
  - [x] CommonValidators 常用验证器
  - [x] 复杂嵌套对象验证
  - [x] 数组和联合类型验证

**Phase 3 总结:**

- ✅ 基于 TypeBox 的完整验证系统已实现
- ✅ @Body() 装饰器自动触发验证拦截器
- ✅ 基础验证装饰器（@IsString, @IsEmail 等）工作正常
- ✅ @Custom() 装饰器支持完全的 TypeBox API 自定义验证
- ✅ 验证错误处理提供详细且友好的错误信息
- ✅ 支持复杂验证场景：嵌套对象、数组、联合类型、条件验证
- ✅ 所有验证功能已通过完整测试验证 (100% 通过率)

**Phase 3 功能详细清单:**

_基础验证装饰器:_

- @IsString(options) - 字符串验证，支持长度、模式匹配
- @IsNumber(options) - 数字验证，支持范围、倍数验证
- @IsEmail() - 邮箱验证，使用正则表达式
- @IsUrl() - URL验证，使用正则表达式
- @IsOptional() - 可选字段标记
- @IsArray(options) - 数组验证

_自定义验证功能:_

- @Custom(schema, options) - 完全的 TypeBox API 支持
- SchemaFactory.\* - 便捷构建器方法
- CommonValidators.\* - 常用验证器 (UUID, 中国手机号等)

_验证系统特性:_

- ValidationInterceptor - 自动拦截和验证请求体
- 详细错误报告 - 包含字段路径、值、约束信息
- 类型转换 - 基于 TypeBox 的自动类型转换
- 嵌套验证 - 支持复杂对象结构验证

_测试覆盖:_

- 基础验证测试 (有效/无效数据)
- 自定义验证测试 (复杂 TypeBox schema)
- 错误处理测试 (验证失败场景)
- 完整端到端集成测试

### Phase 4: 配置和日志系统 (Week 4-5)

#### Config 包开发

- [ ] 配置服务实现
- [ ] 环境变量自动加载
- [ ] 配置验证机制
- [ ] 配置热重载支持

#### Logger 包开发

- [ ] 日志服务实现
- [ ] 多种日志级别支持
- [ ] 结构化日志输出
- [ ] 日志中间件集成

### Phase 5: 拦截器和管道系统 (Week 5-6)

#### 拦截器系统

- [x] `@Interceptor` 装饰器
- [x] 拦截器接口定义
- [x] 内置拦截器实现
  - [x] 日志拦截器
  - [ ] 缓存拦截器
  - [ ] 转换拦截器

#### 管道系统

- [ ] `@Pipe` 装饰器
- [ ] 管道接口定义
- [ ] 内置管道实现
  - [ ] 验证管道
  - [ ] 转换管道
  - [ ] 解析管道

### Phase 6: CLI 工具开发 (Week 6-7)

#### CLI 包开发

- [ ] CLI 基础框架搭建
- [ ] 项目生成命令
  - [ ] `hest new <project-name>`
  - [ ] 项目模板生成
- [ ] 代码生成命令
  - [ ] `hest generate controller <name>`
  - [ ] `hest generate service <name>`
  - [ ] `hest generate module <name>`
- [ ] 开发服务器命令
  - [ ] `hest dev` (热重载开发服务器)

### Phase 7: 测试工具和文档 (Week 7-8)

#### Testing 包开发

- [ ] 测试模块工厂
- [ ] Mock 服务工具
- [ ] 集成测试工具
- [ ] 单元测试辅助工具

#### 示例应用开发

- [ ] 基础 CRUD 示例应用
- [ ] 认证授权示例
- [ ] 微服务示例
- [ ] 数据库集成示例

#### 文档和生态

- [ ] API 文档生成
- [ ] 使用指南编写
- [ ] 最佳实践文档
- [ ] 性能基准测试

### Phase 8: 高级特性和优化 (Week 8-10)

#### 高级特性

- [ ] 微服务支持
  - [ ] 服务发现
  - [ ] 负载均衡
  - [ ] 熔断器
- [ ] WebSocket 支持
- [ ] GraphQL 集成
- [ ] 缓存系统增强
- [ ] 数据库 ORM 集成支持

#### 性能优化

- [ ] 启动时间优化
- [ ] 内存使用优化
- [ ] 请求处理优化
- [ ] 构建大小优化

#### 生态系统

- [ ] 第三方集成适配器
  - [ ] Prisma 集成
  - [ ] Redis 集成
  - [ ] PostgreSQL/MySQL 集成
- [ ] 社区插件系统
- [ ] VS Code 扩展

### Phase 9: 稳定性和发布 (Week 10-12)

#### 质量保证

- [ ] 全面的单元测试覆盖
- [ ] 集成测试套件
- [ ] 性能回归测试
- [ ] 安全性审计

#### 发布准备

- [ ] 版本管理策略
- [ ] 变更日志维护
- [ ] 发布流程自动化
- [ ] 社区反馈收集

## 技术栈依赖

### 运行时依赖

- **Bun**: JavaScript/TypeScript 运行时
- **Hono**: 高性能 Web 框架
- **TSyringe**: 依赖注入容器
- **reflect-metadata**: 元数据反射支持

### 开发依赖

- **TypeScript**: 类型系统
- **Turbo**: Monorepo 构建工具
- **Vitest**: 测试框架
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化

## 发布策略

1. **Alpha 版本** (Week 8): 核心功能完成，内部测试
2. **Beta 版本** (Week 10): 功能完整，社区测试
3. **RC 版本** (Week 11): 发布候选，最终测试
4. **正式版本** (Week 12): 稳定发布

## 社区和生态

1. **文档网站**: 详细的 API 文档和教程
2. **示例项目**: 多种场景的示例应用
3. **插件生态**: 第三方插件和扩展
4. **社区支持**: Discord/GitHub 讨论区

这个架构设计为 HestJS 提供了清晰的分层结构，确保了框架的可扩展性、可维护性和高性能。每个模块都有明确的职责，便于并行开发和后续维护。
