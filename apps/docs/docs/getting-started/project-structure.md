# 项目结构说明

本指南将详细介绍 HestJS 项目的标准结构和组织方式，基于官方 `create-hest-app` 模板，帮助你创建可维护、可扩展的应用程序。

## 📁 模板类型

HestJS 提供两种主要的项目模板：

### Base 模板 - 基础项目结构
适合简单应用和快速开始：

```
my-hest-app/
├── src/                           # 源代码目录
│   ├── index.ts                   # 应用入口文件
│   ├── app.module.ts              # 根模块
│   ├── app.controller.ts          # 应用级控制器
│   ├── app.service.ts             # 应用级服务
│   │
│   ├── modules/                   # 功能模块目录
│   │   ├── users/                 # 用户模块
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/               # 数据传输对象
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── user.dto.ts
│   │   │   └── entities/          # 实体定义
│   │   │       └── user.entity.ts
│   │   │
│   │   └── custom-validation/     # 自定义验证模块
│   │       ├── custom-validation.module.ts
│   │       ├── custom-validation.controller.ts
│   │       ├── custom-validation.service.ts
│   │       └── dto/
│   │           └── custom-validation.dto.ts
│   │
│   └── common/                    # 公共组件
│       ├── filters/               # 异常过滤器
│       │   └── http-exception.filter.ts
│       └── interceptors/          # 拦截器
│           └── response.interceptor.ts
│
├── .vscode/                       # VS Code 配置
│   ├── extensions.json            # 推荐扩展
│   ├── launch.json               # 调试配置
│   └── settings.json             # 编辑器设置
│
├── .prettierrc                    # 代码格式化配置
├── eslint.config.ts              # ESLint 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目配置和依赖
└── README.md                     # 项目说明文档
```

### CQRS 模板 - 高级项目结构
适合复杂应用和企业级开发：

```
my-hest-app/
├── src/
│   ├── index.ts                   # 应用入口
│   ├── app.module.ts              # 根模块
│   ├── app.controller.ts          # 应用控制器
│   ├── app.service.ts             # 应用服务
│   ├── test-error-scenarios.ts    # 错误场景测试
│   │
│   ├── modules/                   # 功能模块 (传统结构)
│   │   ├── users/                 # 用户模块
│   │   └── custom-validation/     # 验证模块
│   │
│   ├── users/                     # CQRS 用户领域 (新架构)
│   │   ├── index.ts               # 模块导出
│   │   ├── user.controller.ts     # 用户控制器
│   │   ├── user.module.ts         # 用户模块
│   │   │
│   │   ├── commands/              # 命令定义
│   │   │   ├── create-user.command.ts
│   │   │   ├── update-user.command.ts
│   │   │   └── delete-user.command.ts
│   │   │
│   │   ├── queries/               # 查询定义
│   │   │   ├── get-user.query.ts
│   │   │   └── get-users.query.ts
│   │   │
│   │   ├── handlers/              # 命令和查询处理器
│   │   │   ├── command/
│   │   │   │   ├── create-user.handler.ts
│   │   │   │   ├── update-user.handler.ts
│   │   │   │   └── delete-user.handler.ts
│   │   │   └── query/
│   │   │       ├── get-user.handler.ts
│   │   │       └── get-users.handler.ts
│   │   │
│   │   ├── events/                # 事件定义
│   │   │   ├── user-created.event.ts
│   │   │   ├── user-updated.event.ts
│   │   │   └── user-deleted.event.ts
│   │   │
│   │   ├── entities/              # 实体和聚合
│   │   │   └── user.entity.ts
│   │   │
│   │   └── repositories/          # 仓储接口和实现
│   │       ├── user.repository.interface.ts
│   │       └── user.repository.ts
│   │
│   └── common/                    # 公共组件
│       ├── filters/
│       └── interceptors/
│
├── .vscode/                       # VS Code 配置
├── .prettierrc                    # 代码格式化
├── eslint.config.ts              # ESLint 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目配置
└── README.md                     # 项目文档
```

## 🎯 目录结构详解

### 📂 src/ - 源代码目录

#### 🏠 应用根文件

| 文件 | 作用 | 说明 |
|------|------|------|
| `index.ts` | 应用入口 | 启动应用，配置全局组件和中间件 |
| `app.module.ts` | 根模块 | 应用的主模块，导入所有功能模块 |
| `app.controller.ts` | 应用控制器 | 处理全局路由，如健康检查 |
| `app.service.ts` | 应用服务 | 应用级别的业务逻辑 |

#### 📦 modules/ - 功能模块 (Base 模板)

Base 模板采用传统的模块化结构，每个功能模块包含：

```typescript
// users/users.module.ts - 模块定义
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

#### 🏛️ CQRS 领域结构 (CQRS 模板)

CQRS 模板采用领域驱动设计，将业务逻辑按照命令查询职责分离：

| 目录 | 用途 | 说明 |
|------|------|------|
| `commands/` | 命令定义 | 修改数据的操作（创建、更新、删除） |
| `queries/` | 查询定义 | 读取数据的操作（获取单个、列表） |
| `handlers/` | 处理器 | 命令和查询的具体实现逻辑 |
| `events/` | 事件定义 | 领域事件和集成事件 |
| `entities/` | 实体聚合 | 业务对象和聚合根 |
| `repositories/` | 仓储层 | 数据访问接口和实现 |

#### 🔧 common/ - 公共组件

Base 模板包含的公共组件：

| 子目录 | 用途 | 文件示例 |
|--------|------|----------|
| `filters/` | 异常过滤器 | `http-exception.filter.ts` |
| `interceptors/` | 拦截器 | `response.interceptor.ts` |

#### ⚙️ 配置文件

根目录的重要配置文件：

| 文件 | 用途 | 说明 |
|------|------|------|
| `package.json` | 项目配置 | 依赖管理、脚本定义 |
| `tsconfig.json` | TypeScript 配置 | 编译选项、路径映射 |
| `eslint.config.ts` | ESLint 配置 | 代码质量检查规则 |
| `.prettierrc` | Prettier 配置 | 代码格式化规则 |
| `.vscode/` | VS Code 配置 | 编辑器设置、扩展推荐 |

### 🏗️ 模块设计原则

#### 1. 单一职责原则
每个模块专注于一个特定的业务领域：

```typescript
// ✅ 好的模块设计
users/           # 用户管理
auth/           # 身份认证
posts/          # 文章管理
notifications/  # 通知系统

// ❌ 避免的设计
common-stuff/   # 过于宽泛
mixed-logic/    # 混合多个职责
```

#### 2. 依赖层次
```
Controllers  →  Services  →  Repositories  →  Database
     ↓            ↓            ↓
   HTTP层      业务逻辑     数据访问
```

#### 3. 模块间通信
```typescript
// 通过模块导入/导出进行通信
@Module({
  imports: [UsersModule], // 导入其他模块
  providers: [PostsService],
  exports: [PostsService], // 导出供其他模块使用
})
export class PostsModule {}
```

## 📝 命名约定

### 文件命名
| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 控制器 | `*.controller.ts` | `users.controller.ts` |
| 服务 | `*.service.ts` | `users.service.ts` |
| 模块 | `*.module.ts` | `users.module.ts` |
| DTO | `*.dto.ts` | `create-user.dto.ts` |
| 实体 | `*.entity.ts` | `user.entity.ts` |
| 接口 | `*.interface.ts` | `user.interface.ts` |
| 守卫 | `*.guard.ts` | `auth.guard.ts` |
| 拦截器 | `*.interceptor.ts` | `response.interceptor.ts` |
| 过滤器 | `*.filter.ts` | `http-exception.filter.ts` |
| 测试 | `*.spec.ts` | `users.service.spec.ts` |

### 类命名
```typescript
// 控制器：PascalCase + Controller
export class UsersController {}

// 服务：PascalCase + Service
export class UsersService {}

// DTO：PascalCase + Dto
export class CreateUserDto {}

// 实体：PascalCase
export class User {}

// 接口：PascalCase + Interface (可选)
export interface UserInterface {}
```

## 🗂️ DTO 和实体组织

### DTO 结构
```typescript
// dto/create-user.dto.ts
export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;
}

// dto/update-user.dto.ts
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

// dto/user.dto.ts - 响应 DTO
export class UserDto {
  id!: string;
  name!: string;
  email!: string;
  createdAt!: Date;
}
```

### 实体结构
```typescript
// entities/user.entity.ts
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// entities/post.entity.ts
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: User; // 关联关系
  createdAt: Date;
  updatedAt: Date;
}
```

## 🧪 测试结构

### 测试文件组织
```
src/
├── modules/
│   └── users/
│       ├── __tests__/
│       │   ├── users.controller.spec.ts
│       │   ├── users.service.spec.ts
│       │   └── users.integration.spec.ts
│       ├── users.controller.ts
│       └── users.service.ts
```

### 测试示例
```typescript
// __tests__/users.service.spec.ts
import { Test } from '@hestjs/testing';
import { UsersService } from '../users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should create a user', async () => {
    const userData = { name: 'John', email: 'john@test.com', age: 30 };
    const user = await service.create(userData);
    
    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
  });
});
```

## 📈 扩展建议

### 大型项目结构
对于大型项目，可以考虑按领域划分：

```
src/
├── domains/                   # 领域划分
│   ├── user-management/       # 用户管理领域
│   │   ├── users/
│   │   ├── profiles/
│   │   └── roles/
│   ├── content-management/    # 内容管理领域
│   │   ├── posts/
│   │   ├── comments/
│   │   └── categories/
│   └── order-management/      # 订单管理领域
│       ├── orders/
│       ├── payments/
│       └── shipping/
├── shared/                    # 跨领域共享
└── infrastructure/            # 基础设施
    ├── database/
    ├── external-services/
    └── monitoring/
```

### 微服务架构
```
apps/                          # 多个应用
├── user-service/             # 用户服务
├── order-service/            # 订单服务
├── payment-service/          # 支付服务
└── gateway/                  # API 网关

packages/                     # 共享包
├── shared-types/             # 共享类型
├── shared-utils/             # 共享工具
└── shared-config/            # 共享配置
```

## 💡 最佳实践

### 1. 保持模块独立
```typescript
// ✅ 好的实践 - 通过接口依赖
@injectable()
export class OrderService {
  constructor(
    private readonly userService: UserService,
    private readonly paymentService: PaymentService
  ) {}
}

// ❌ 避免 - 直接导入其他模块的实现细节
import { User } from '../users/entities/user.entity';
```

### 2. 使用索引文件
```typescript
// modules/users/index.ts
export * from './users.controller';
export * from './users.service';
export * from './users.module';
export * from './dto';
export * from './entities';
```

### 3. 配置集中管理
```typescript
// config/index.ts
export * from './env';
export * from './database.config';
export * from './cache.config';
export * from './logger.config';
```

### 4. 类型安全
```typescript
// 使用严格的类型定义
export interface CreateUserRequest {
  name: string;
  email: string;
  age: number;
}

export interface CreateUserResponse {
  user: UserDto;
  message: string;
}
```

## 📚 下一步

了解了项目结构后，继续学习：

1. [CLI 工具使用](./cli-usage.md) - 掌握开发工具
2. [控制器详解](../fundamentals/controllers.md) - 深入学习控制器
3. [模块系统](../fundamentals/modules.md) - 理解模块化架构
4. [依赖注入](../fundamentals/dependency-injection.md) - 掌握 DI 系统

---

**上一步**: [← 创建第一个应用](./first-application.md) | **下一步**: [CLI 工具使用 →](./cli-usage.md)
