# HestJS 介绍

HestJS 是基于 **Hono + TSyringe** 的 TypeScript 后端框架，借鉴 NestJS 的设计理念，但更轻量、更快。

## 核心特性

### 装饰器 + 依赖注入

使用装饰器定义控制器和路由，TSyringe 提供依赖注入：

```typescript
@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  create(@Body(CreateUserDto) dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

### 模块化组织

用模块组织功能代码：

```typescript
@Module({
  imports: [LoggerModule],
  controllers: [UserController], 
  providers: [UserService]
})
export class UserModule {}
```

### 高性能运行时

- **Hono**: 极速的 Web 框架，比 Express 快数倍
- **Bun**: 高性能的 JavaScript 运行时，启动速度快，内存占用低
- **原生 TypeScript**: 直接支持 TypeScript，无需编译步骤

### 类型安全的验证系统

### 数据验证

基于 TypeBox 的验证装饰器：

```typescript
export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 18, maximum: 120 })
  age!: number;
}
```

### 其他特性

- **日志系统**: 基于 Pino 的高性能日志记录
- **API 文档**: 基于 Scalar 的 OpenAPI 文档生成
- **CQRS**: 命令查询职责分离模式支持
- **拦截器**: 请求/响应拦截处理

## 为什么选择 HestJS

**性能优势**

- 基于 Hono 的高性能路由
- Bun 运行时加速
- 轻量级依赖注入

**开发体验**

- 熟悉的 NestJS 风格 API
- 完整的 TypeScript 支持
- 快速热重载

**现代化**

- 简洁的架构设计
- 最小化样板代码

## 下一步

- [安装](./installation.md) - 开始安装 HestJS
- [第一个应用](./first-application.md) - 创建 Hello World 应用
