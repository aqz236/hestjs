# 第一个应用

通过创建一个简单的用户管理 API 来学习 HestJS 基础概念。

## 应用结构

我们将创建：
- 用户控制器 (UserController)
- 用户服务 (UserService)  
- 数据验证 (DTO)
- 错误处理

## 创建项目

```bash
bunx create-hest-app user-api
cd user-api
bun install
```

## 1. 定义数据结构

创建用户 DTO：

```typescript
// src/dto/user.dto.ts
import { IsString, IsEmail, IsNumber } from '@hestjs/validation';

export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 18, maximum: 120 })
  age!: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}
```

## 2. 创建服务

```typescript
// src/services/user.service.ts
import { injectable } from 'tsyringe';
import { logger } from '@hestjs/logger';
import { CreateUserDto, User } from '../dto/user.dto';

@injectable()
export class UserService {
  private users: User[] = [
    {
      id: '1',
      name: 'John Doe', 
      email: 'john@example.com',
      age: 28,
      createdAt: new Date()
    }
  ];

  findAll(): User[] {
    logger.info('获取用户列表');
    return this.users;
  }

  findById(id: string): User | null {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      logger.warn(`用户 ${id} 不存在`);
    }
    return user || null;
  }

  create(dto: CreateUserDto): User {
    // 检查邮箱重复
    const exists = this.users.find(u => u.email === dto.email);
    if (exists) {
      throw new Error('邮箱已存在');
    }

    const user: User = {
      id: Date.now().toString(),
      ...dto,
      createdAt: new Date()
    };

    this.users.push(user);
    logger.info(`创建用户: ${user.name}`);
    return user;
  }
}
```

## 3. 创建控制器

```typescript
// src/controllers/user.controller.ts
import { Controller, Get, Post, Param, NotFoundException } from '@hestjs/core';
import { Body } from '@hestjs/validation';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/user.dto';

@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getAllUsers() {
    return this.userService.findAll();
  }

  @Get('/:id')
  getUserById(@Param('id') id: string) {
    const user = this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  @Post()
  createUser(@Body(CreateUserDto) dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

## 4. 创建模块

```typescript
// src/modules/user.module.ts
import { Module } from '@hestjs/core';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';

@Module({
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
```

## 5. 创建根模块

```typescript
// src/app.module.ts
import { Module } from '@hestjs/core';
import { UserModule } from './modules/user.module';

@Module({
  imports: [UserModule]
})
export class AppModule {}
```

## 6. 应用入口

```typescript
// src/index.ts
import { HestFactory } from '@hestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HestFactory.create(AppModule);
  
  const port = 3002;
  
  Bun.serve({
    port,
    fetch: app.hono().fetch,
    reusePort: true,
  });
  
  console.log(`应用运行在 http://localhost:${port}`);
}

bootstrap();
```

## 7. 启动应用

```bash
bun run dev
```

## 8. 测试 API

应用启动后，测试以下端点：

**获取所有用户**
```bash
curl http://localhost:3002/users
```

**获取单个用户**  
```bash
curl http://localhost:3002/users/1
```

**创建用户**
```bash
curl -X POST http://localhost:3002/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25}'
```

## 完整目录结构

```
src/
├── index.ts                 # 应用入口
├── app.module.ts           # 根模块  
├── dto/
│   └── user.dto.ts         # 用户数据传输对象
├── services/
│   └── user.service.ts     # 用户服务
├── controllers/
│   └── user.controller.ts  # 用户控制器
└── modules/
    └── user.module.ts      # 用户模块
```

## 关键概念总结

1. **装饰器**: `@Controller`, `@Get`, `@Post` 定义路由
2. **依赖注入**: 构造函数自动注入依赖
3. **数据验证**: `@Body(CreateUserDto)` 自动验证请求数据
4. **模块化**: 用 `@Module` 组织相关组件
5. **错误处理**: 抛出异常自动转换为 HTTP 错误响应

下一步可以添加：
<!-- - [数据库集成](../fundamentals/database.md) -->
<!-- - [API 文档](../fundamentals/swagger.md)   -->
- [中间件和拦截器](../fundamentals/interceptors.md)
