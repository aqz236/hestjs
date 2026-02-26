# HestJS Demo Application 🚀

一个基于 **HestJS** 框架的现代化 TypeScript 演示应用，展示了类似 NestJS 的开发体验，但具有更轻量和更高性能的特点。内置支持通过注解自动生成 **OpenAPI 3.0** 规范的 Swagger 文档。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-latest-orange.svg)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-green.svg)](https://hono.dev/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-brightgreen.svg)](https://swagger.io/specification/)
[![Scalar](https://img.shields.io/badge/Scalar-API%20Docs-purple.svg)](https://scalar.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ 主要特性

- 🎯 **类 NestJS 语法**：熟悉的装饰器和模块化架构
- ⚡ **极致性能**：基于 Hono 和 Bun，提供卓越的运行时性能
- 📚 **自动 API 文档**：通过注解自动生成 OpenAPI 3.0 规范
- 🎨 **美观文档界面**：集成 Scalar，提供现代化的 API 文档体验
- 🔧 **依赖注入**：完整的 IoC 容器支持
- 🛡️ **类型安全**：完全的 TypeScript 支持
- 🚀 **快速开发**：热重载和快速构建

## 📖 API 文档

本应用集成了强大的 API 文档功能，支持通过注解自动生成符合 OpenAPI 3.0 规范的 Swagger 文档：

### 🌐 在线访问

启动应用后，可通过以下地址访问 API 文档：

- **📱 Scalar UI**: [http://localhost:3002/docs](http://localhost:3002/docs) - 现代化的交互式 API 文档界面
- **📄 OpenAPI JSON**: [http://localhost:3002/openapi.json](http://localhost:3002/openapi.json) - 原始 OpenAPI 3.0 规范文件
- **🤖 Markdown**: [http://localhost:3002/api-docs.md](http://localhost:3002/api-docs.md) - 为 LLM 优化的 Markdown 格式文档

### 🔧 注解支持

使用简单的装饰器即可为你的 API 生成完整的文档：

#### 控制器级别注解

```typescript
import { Controller, Get, Post } from '@hestjs/core';
import { ApiTags, ApiOperation, ApiResponse } from '@hestjs/scalar';

@Controller('/api/users')
@ApiTags('Users') // 为控制器添加标签
export class UsersController {
  // ...
}
```

#### 方法级别注解

```typescript
@Get('/')
@ApiOperation({
  summary: 'Get all users',
  description: 'Returns a list of all users in the system',
  tags: ['Users', 'List'], // 可以覆盖控制器级别的标签
})
@ApiResponse('200', {
  description: 'Successful response',
  content: {
    'application/json': {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-123' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
          },
        },
      },
    },
  },
})
async getUsers() {
  return this.usersService.findAll();
}
```

#### 参数注解

```typescript
@Get('/:id')
@ApiParam('id', {
  description: 'User unique identifier',
  schema: { type: 'string' },
  example: 'user-123',
})
@ApiResponse('200', {
  description: 'User found',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
    },
  },
})
@ApiResponse('404', {
  description: 'User not found',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'User not found' },
        },
      },
    },
  },
})
async getUserById(@Param('id') id: string) {
  return this.usersService.findById(id);
}
```

#### 请求体注解

```typescript
@Post('/')
@ApiOperation({
  summary: 'Create a new user',
  description: 'Creates a new user with the provided data',
})
@ApiBody(
  {
    'application/json': {
      schema: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', example: 'John Doe' },
          email: { 
            type: 'string', 
            format: 'email', 
            example: 'john@example.com' 
          },
        },
      },
    },
  },
  {
    description: 'User creation data',
    required: true,
  }
)
@ApiResponse('201', {
  description: 'User created successfully',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
})
async createUser(@Body() userData: CreateUserDto) {
  return this.usersService.create(userData);
}
```

### 🎨 可用装饰器

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@ApiTags(...)` | 为控制器或方法添加标签 | `@ApiTags('Users', 'Admin')` |
| `@ApiOperation(...)` | 描述 API 操作 | `@ApiOperation({ summary: '获取用户' })` |
| `@ApiResponse(status, spec)` | 定义响应格式 | `@ApiResponse('200', { description: '成功' })` |
| `@ApiParam(name, spec)` | 描述路径参数 | `@ApiParam('id', { type: 'string' })` |
| `@ApiQuery(name, spec)` | 描述查询参数 | `@ApiQuery('page', { type: 'number' })` |
| `@ApiBody(schema, options)` | 描述请求体 | `@ApiBody({ schema: userSchema })` |

### ⚙️ 配置选项

```typescript
// 在 main.ts 中配置 API 文档
app.useScalarWithControllers(
  [AppController, UsersController], // 需要生成文档的控制器
  {
    // OpenAPI 基本信息
    info: {
      title: 'HestJS Demo API',
      version: '1.0.0',
      description: 'HestJS 框架演示应用的 API 文档',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    // 服务器配置
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
  },
  {
    // Scalar 配置
    path: '/docs',                    // 文档访问路径
    theme: 'elysia',                 // 主题样式
    title: 'HestJS API Documentation', // 页面标题
    enableMarkdown: true,            // 启用 Markdown 导出
    markdownPath: '/api-docs.md',    // Markdown 访问路径
  }
);
```

## 🏗️ 项目结构

```
src/
├── index.ts                   # 应用入口点
├── app.module.ts              # 根模块
├── app.controller.ts          # 应用控制器（含 API 文档注解示例）
├── app.service.ts             # 应用服务
├── common/                    # 公共组件
│   ├── filters/               # 全局过滤器
│   │   └── http-exception.filter.ts
│   └── interceptors/          # 全局拦截器
│       └── response.interceptor.ts
└── modules/                   # 功能模块
    ├── users/                 # 用户模块
    │   ├── dto/               # 数据传输对象
    │   │   └── user.dto.ts
    │   ├── users.controller.ts # 用户控制器（含完整 API 注解）
    │   ├── users.service.ts
    │   └── users.module.ts
    └── custom-validation/     # 自定义验证模块
        ├── dto/
        │   └── custom-validation.dto.ts
        ├── custom-validation.controller.ts
        ├── custom-validation.service.ts
        └── custom-validation.module.ts
```

## 🚀 快速开始

### 前置要求

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0 （可选，Bun 包含 Node.js 兼容层）

### 安装依赖

```bash
bun install
```

### 开发环境

```bash
# 开发模式（热重载）
bun run dev

# 或者在 monorepo 根目录
turbo run dev --filter=@hestjs/demo
```

### 构建和部署

```bash
# 构建
bun run build

# 生产环境运行
bun run start:prod

# 创建独立可执行文件
bun run build:binary
./dist/hest-demo
```

## 📡 API 文档

### 基础端点

- `GET /api` - 应用信息
- `GET /api/health` - 健康检查

### 用户管理 (`/users`)

- `GET /users` - 获取所有用户
- `GET /users/:id` - 获取特定用户
- `POST /users` - 创建新用户
- `POST /users/:id` - 更新用户信息

#### 请求示例：

```bash
# 创建用户
curl -X POST http://localhost:3002/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "password": "password123"
  }'
```

### 自定义验证 (`/api/custom`)

- `GET /api/custom` - 验证功能说明
- `POST /api/custom/validate` - 测试自定义验证
- `POST /api/custom/search` - 测试搜索参数验证
- `GET /api/custom/examples` - 获取验证示例

#### 请求示例：

```bash
# 自定义验证
curl -X POST http://localhost:3002/api/custom/validate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe123",
    "role": "user",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "phoneNumber": "13812345678",
    "location": { "lat": 39.9042, "lng": 116.4074 },
    "emails": ["john@example.com", "john.doe@company.com"]
  }'
```

## 🛠️ 核心功能

### 1. 模块化架构

- **清晰的模块分离**：每个功能模块都有自己的控制器、服务、DTO 和实体
- **依赖注入**：使用 `@Injectable()` 和 `@Module()` 装饰器
- **模块导入/导出**：支持模块间的依赖关系

### 2. 强类型验证

- **TypeBox 集成**：使用 TypeBox 进行运行时类型验证
- **自定义验证器**：支持复杂的业务逻辑验证
- **联合类型支持**：支持 TypeScript 的高级类型特性

### 3. 中间件和拦截器

- **全局异常过滤器**：统一的错误处理
- **响应拦截器**：统一的响应格式
- **CORS 支持**：跨域资源共享配置
- **请求日志**：自动记录请求和响应

### 4. 配置管理

- **环境变量支持**：通过 `.env` 文件配置
- **类型安全配置**：使用 TypeScript 确保配置的类型安全

### 5. CQRS 支持

- **命令查询职责分离**：支持 CQRS 架构模式
- **事件驱动**：内置事件总线支持
- **命令和查询处理器**：独立的命令和查询处理逻辑
- **事件溯源**：支持事件驱动的业务逻辑

> 📝 **CQRS 演示应用**：完整的 CQRS 实现示例请参考 [HestJS CQRS Demo](https://github.com/aqz236/hestjs-cqrs-demo)

## 🔧 验证功能展示

### 基础验证

```typescript
export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber()
  @Min(0)
  @Max(120)
  age!: number;
}
```

### 高级验证

```typescript
export class CustomValidationDto {
  // 正则表达式验证
  @Custom(
    Type.String({ minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_]+$' }),
    { message: '用户名必须是3-20位字母、数字或下划线' },
  )
  username!: string;

  // 联合类型验证
  @Custom(
    Type.Union([
      Type.Literal('admin'),
      Type.Literal('user'),
      Type.Literal('guest'),
    ]),
    { message: '角色必须是 admin、user 或 guest' },
  )
  role!: 'admin' | 'user' | 'guest';

  // UUID 验证
  @CommonValidators.UUID()
  userId!: string;

  // 中国手机号验证
  @Custom(SchemaFactory.chinesePhoneNumber(), { optional: true })
  phoneNumber?: string;

  // 嵌套对象验证
  @Custom(
    Type.Object({
      lat: Type.Number({ minimum: -90, maximum: 90 }),
      lng: Type.Number({ minimum: -180, maximum: 180 }),
    }),
    { optional: true },
  )
  location?: { lat: number; lng: number };
}
```

## 🎯 架构特点

### 1. NestJS 风格的目录结构

- 模块化组织：每个功能模块独立管理
- 清晰的职责分离：控制器、服务、DTO、实体分离
- 可扩展性：易于添加新功能模块

### 2. 现代 TypeScript 开发

- 严格的类型检查
- 装饰器模式
- 依赖注入
- 接口优先设计

### 3. 高性能运行时

- Bun 运行时支持
- Hono 高性能 Web 框架
- 端口复用优化
- 生产环境优化

### 4. CQRS 架构支持

- 命令查询职责分离模式
- 事件驱动架构
- 独立的读写模型
- 可扩展的处理器模式

> 🔗 **完整 CQRS 示例**：查看专门的 CQRS 演示应用 → [HestJS CQRS Demo](https://github.com/aqz236/hestjs-cqrs-demo)

## 📦 部署

### Docker 部署

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# 复制依赖文件
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN bun run build

# 运行应用
CMD ["bun", "run", "start:prod"]
EXPOSE 3002
```

### 二进制部署

```bash
# 构建独立可执行文件
bun run build:binary

# 部署单个文件
./dist/hest-demo
```

## 🧪 测试

```bash
# 运行测试
bun test

# 覆盖率测试
bun test --coverage
```

## 📝 开发指南

### 添加新模块

1. 在 `src/modules/` 下创建新目录
2. 创建 `*.module.ts`、`*.controller.ts`、`*.service.ts`
3. 在 `app.module.ts` 中导入新模块

### 添加验证规则

1. 在模块的 `dto/` 目录下创建 DTO 类
2. 使用 `@Custom()` 装饰器定义验证规则
3. 在控制器中使用 `@Body()` 装饰器应用验证

### 环境配置

```bash
# .env 文件
PORT=3002
NODE_ENV=development
CORS_ORIGIN=*
```

## 🔗 相关项目

### HestJS CQRS Demo

完整的 CQRS（命令查询职责分离）架构演示应用，展示了如何在 HestJS 框架中实现：

- ✅ 命令处理器 (Command Handlers)
- ✅ 查询处理器 (Query Handlers)
- ✅ 事件处理器 (Event Handlers)
- ✅ 事件总线 (Event Bus)
- ✅ 用户管理完整流程

🔗 **仓库地址**：[https://github.com/aqz236/hestjs-cqrs-demo](https://github.com/aqz236/hestjs-cqrs-demo)

该项目展示了在现代 TypeScript 应用中如何优雅地实现 CQRS 模式，适合需要复杂业务逻辑和高可扩展性的企业级应用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
