# HestJS Demo Application 🚀

一个基于 **HestJS** 框架的现代化 TypeScript 演示应用，展示了类似 NestJS 的开发体验，但具有更轻量和更高性能的特点。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-latest-orange.svg)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-green.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🏗️ 项目结构

```
src/
├── main.ts                    # 应用入口点
├── app.module.ts              # 根模块
├── app.controller.ts          # 应用控制器
├── app.service.ts             # 应用服务
├── config/                    # 配置文件
│   └── app.config.ts          # 应用配置
├── common/                    # 公共组件
│   ├── filters/               # 全局过滤器
│   │   └── http-exception.filter.ts
│   └── interceptors/          # 全局拦截器
│       └── response.interceptor.ts
└── modules/                   # 功能模块
    ├── users/                 # 用户模块
    │   ├── dto/               # 数据传输对象
    │   │   └── user.dto.ts
    │   ├── entities/          # 实体定义
    │   │   └── user.entity.ts
    │   ├── users.controller.ts
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

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
