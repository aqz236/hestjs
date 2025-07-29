# 创建第一个应用

本指南将带你一步步创建一个完整的 HestJS 应用，包含用户管理功能、数据验证、API 文档等特性。

## 🎯 应用概览

我们将创建一个用户管理 API，包含以下功能：
- 用户列表查询
- 创建新用户
- 获取用户详情
- 数据验证
- API 文档生成
- 全局异常处理

## 📁 项目结构

首先，让我们创建项目的基本结构：

```
src/
├── index.ts                    # 应用入口
├── app.module.ts              # 根模块
├── app.controller.ts          # 应用控制器
├── app.service.ts             # 应用服务
├── modules/                   # 功能模块
│   └── users/                 # 用户模块
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.module.ts
│       ├── dto/
│       │   ├── create-user.dto.ts
│       │   └── user.dto.ts
│       └── entities/
│           └── user.entity.ts
├── common/                    # 公共组件
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── response.interceptor.ts
└── config/
    └── env.ts
```

## 🏗️ 步骤 1: 创建实体和 DTO

### 用户实体
```typescript
// src/modules/users/entities/user.entity.ts
export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 用户 DTO
```typescript
// src/modules/users/dto/create-user.dto.ts
import { IsString, IsEmail, IsNumber } from '@hestjs/validation';

export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 0, maximum: 150 })
  age!: number;
}
```

```typescript
// src/modules/users/dto/user.dto.ts
export class UserDto {
  id!: string;
  name!: string;
  email!: string;
  age!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
```

## 🔧 步骤 2: 创建服务层

```typescript
// src/modules/users/users.service.ts
import { injectable } from 'tsyringe';
import { logger } from '@hestjs/logger';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@injectable()
export class UsersService {
  private users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 25,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  async findAll(): Promise<User[]> {
    logger.info('Fetching all users');
    return this.users;
  }

  async findById(id: string): Promise<User | null> {
    logger.info(`Fetching user with id: ${id}`);
    const user = this.users.find(user => user.id === id);
    if (!user) {
      logger.warn(`User with id ${id} not found`);
      return null;
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    logger.info('Creating new user', createUserDto);
    
    // 检查邮箱是否已存在
    const existingUser = this.users.find(user => user.email === createUserDto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: (this.users.length + 1).toString(),
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);
    logger.info(`User created with id: ${newUser.id}`);
    
    return newUser;
  }

  async update(id: string, updateData: Partial<CreateUserDto>): Promise<User | null> {
    logger.info(`Updating user with id: ${id}`, updateData);
    
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      logger.warn(`User with id ${id} not found for update`);
      return null;
    }

    const updatedUser = {
      ...this.users[userIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    this.users[userIndex] = updatedUser;
    logger.info(`User with id ${id} updated successfully`);
    
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    logger.info(`Deleting user with id: ${id}`);
    
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      logger.warn(`User with id ${id} not found for deletion`);
      return false;
    }

    this.users.splice(userIndex, 1);
    logger.info(`User with id ${id} deleted successfully`);
    
    return true;
  }
}
```

## 🎮 步骤 3: 创建控制器

```typescript
// src/modules/users/users.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param,
  HttpStatus
} from '@hestjs/core';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam 
} from '@hestjs/scalar';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@Controller('/api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all users', 
    description: 'Retrieve a list of all users' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users retrieved successfully',
    content: {
      'application/json': {
        example: {
          data: [
            {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com',
              age: 30,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z'
            }
          ],
          message: 'Users retrieved successfully'
        }
      }
    }
  })
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      data: users,
      message: 'Users retrieved successfully',
    };
  }

  @Get('/:id')
  @ApiOperation({ 
    summary: 'Get user by ID', 
    description: 'Retrieve a specific user by their ID' 
  })
  @ApiParam({ name: 'id', description: 'User ID', example: '1' })
  @ApiResponse({ 
    status: 200, 
    description: 'User found',
    content: {
      'application/json': {
        example: {
          data: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          message: 'User found'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      };
    }

    return {
      data: user,
      message: 'User found',
    };
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create a new user', 
    description: 'Create a new user with the provided information' 
  })
  @ApiBody({
    description: 'User creation data',
    content: {
      'application/json': {
        example: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    content: {
      'application/json': {
        example: {
          data: {
            id: '3',
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
            createdAt: '2024-01-03T00:00:00.000Z',
            updatedAt: '2024-01-03T00:00:00.000Z'
          },
          message: 'User created successfully'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  async create(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      return {
        statusCode: HttpStatus.CREATED,
        data: user,
        message: 'User created successfully',
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  @Put('/:id')
  @ApiOperation({ 
    summary: 'Update user', 
    description: 'Update an existing user by ID' 
  })
  @ApiParam({ name: 'id', description: 'User ID', example: '1' })
  @ApiBody({
    description: 'User update data',
    content: {
      'application/json': {
        example: {
          name: 'John Smith',
          age: 31
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateUserDto>
  ) {
    const user = await this.usersService.update(id, updateData);
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      };
    }

    return {
      data: user,
      message: 'User updated successfully',
    };
  }

  @Delete('/:id')
  @ApiOperation({ 
    summary: 'Delete user', 
    description: 'Delete a user by ID' 
  })
  @ApiParam({ name: 'id', description: 'User ID', example: '1' })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async delete(@Param('id') id: string) {
    const deleted = await this.usersService.delete(id);
    if (!deleted) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      };
    }

    return {
      message: 'User deleted successfully',
    };
  }
}
```

## 📦 步骤 4: 创建模块

```typescript
// src/modules/users/users.module.ts
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

## 🛡️ 步骤 5: 添加全局组件

### 异常过滤器
```typescript
// src/common/filters/http-exception.filter.ts
import { HttpExceptionFilter as BaseHttpExceptionFilter } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import type { Context } from 'hono';

export class HttpExceptionFilter extends BaseHttpExceptionFilter {
  catch(error: Error, c: Context): Response | Promise<Response> {
    logger.error('HTTP Exception:', {
      error: error.message,
      stack: error.stack,
      path: c.req.path,
      method: c.req.method,
    });

    // 处理自定义错误
    if (error.message.includes('already exists')) {
      return c.json({
        statusCode: 409,
        message: error.message,
        timestamp: new Date().toISOString(),
        path: c.req.path,
      }, 409);
    }

    // 处理验证错误
    if (error.message.includes('validation')) {
      return c.json({
        statusCode: 400,
        message: 'Validation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
        path: c.req.path,
      }, 400);
    }

    // 默认错误处理
    return c.json({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: c.req.path,
    }, 500);
  }
}
```

### 响应拦截器
```typescript
// src/common/interceptors/response.interceptor.ts
import { Interceptor, InterceptorContext } from '@hestjs/core';
import { logger } from '@hestjs/logger';

export class ResponseInterceptor implements Interceptor {
  async intercept(context: InterceptorContext, next: () => Promise<any>) {
    const start = Date.now();
    const { req } = context;
    
    logger.info(`→ ${req.method} ${req.path}`);
    
    const result = await next();
    
    const duration = Date.now() - start;
    logger.info(`← ${req.method} ${req.path} (${duration}ms)`);
    
    // 统一响应格式
    if (result && typeof result === 'object' && !result.statusCode) {
      return {
        success: true,
        timestamp: new Date().toISOString(),
        ...result,
      };
    }
    
    return result;
  }
}
```

## 🔧 步骤 6: 配置应用模块

```typescript
// src/app.controller.ts
import { Controller, Get } from '@hestjs/core';
import { ApiOperation, ApiResponse } from '@hestjs/scalar';

@Controller()
export class AppController {
  @Get('/health')
  @ApiOperation({ 
    summary: 'Health check', 
    description: 'Check if the application is running' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is healthy',
    content: {
      'application/json': {
        example: {
          status: 'ok',
          message: 'HestJS application is running!',
          timestamp: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
  health() {
    return {
      status: 'ok',
      message: 'HestJS application is running!',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ 
    summary: 'Welcome message', 
    description: 'Get a welcome message from the API' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Welcome message',
    content: {
      'application/json': {
        example: {
          message: 'Welcome to HestJS!',
          version: '1.0.0'
        }
      }
    }
  })
  welcome() {
    return {
      message: 'Welcome to HestJS!',
      version: '1.0.0',
    };
  }
}
```

```typescript
// src/app.service.ts
import { injectable } from 'tsyringe';
import { logger } from '@hestjs/logger';

@injectable()
export class AppService {
  getHello(): string {
    logger.info('Getting hello message');
    return 'Hello from HestJS!';
  }
}
```

```typescript
// src/app.module.ts
import { Module } from '@hestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## 🚀 步骤 7: 应用入口

```typescript
// src/index.ts
import { HestFactory } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import '@hestjs/scalar';
import { ValidationInterceptor } from '@hestjs/validation';
import { cors } from 'hono/cors';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    // 创建应用实例
    const app = await HestFactory.create(AppModule);
    
    // 配置 CORS
    app.hono().use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    }));

    // 注册全局拦截器
    app.useGlobalInterceptors(new ValidationInterceptor());
    app.useGlobalInterceptors(new ResponseInterceptor());

    // 注册全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    // 配置 API 文档
    app.useScalar({
      info: {
        title: 'HestJS User Management API',
        version: '1.0.0',
        description: '一个使用 HestJS 构建的用户管理 API 示例，展示框架的核心功能和最佳实践。',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
    }, {
      path: '/docs',
      theme: 'elysia',
      enableMarkdown: true,
    });

    const port = 3000;
    
    // 启动服务器
    Bun.serve({
      port,
      fetch: app.hono().fetch,
      reusePort: true,
    });

    logger.info(`🚀 Application is running on: http://localhost:${port}`);
    logger.info('📚 API Documentation available at:');
    logger.info(`  • Scalar UI: http://localhost:${port}/docs`);
    logger.info(`  • OpenAPI JSON: http://localhost:${port}/openapi.json`);
    logger.info('📊 Available endpoints:');
    logger.info('  • GET /health - Health check');
    logger.info('  • GET /api/users - Get all users');
    logger.info('  • POST /api/users - Create a user');
    logger.info('  • GET /api/users/:id - Get user by ID');
    logger.info('  • PUT /api/users/:id - Update user');
    logger.info('  • DELETE /api/users/:id - Delete user');

  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
```

## 🧪 步骤 8: 测试应用

启动开发服务器：
```bash
bun run dev
```

### 测试 API 端点

1. **健康检查**
```bash
curl http://localhost:3000/health
```

2. **获取所有用户**
```bash
curl http://localhost:3000/api/users
```

3. **创建新用户**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "age": 28
  }'
```

4. **获取特定用户**
```bash
curl http://localhost:3000/api/users/1
```

### 查看 API 文档
访问 `http://localhost:3000/docs` 查看自动生成的 API 文档。

## 🎉 完成！

恭喜！你已经成功创建了第一个 HestJS 应用。这个应用包含了：

✅ **RESTful API** - 完整的 CRUD 操作  
✅ **数据验证** - 基于 TypeBox 的验证系统  
✅ **依赖注入** - TSyringe 驱动的 DI 容器  
✅ **模块化架构** - 清晰的代码组织  
✅ **全局组件** - 拦截器和异常过滤器  
✅ **API 文档** - 自动生成的 OpenAPI 文档  
✅ **日志系统** - 结构化日志记录  
✅ **错误处理** - 统一的错误处理机制  

## 📚 下一步

继续深入学习 HestJS：

1. [项目结构说明](./project-structure.md) - 了解项目组织最佳实践
2. [基础概念](../fundamentals/controllers.md) - 深入学习控制器
3. [模块系统](../fundamentals/modules.md) - 理解模块化架构
4. [依赖注入](../fundamentals/dependency-injection.md) - 掌握 DI 系统

---

**上一步**: [← 安装和环境配置](./installation.md) | **下一步**: [项目结构说明 →](./project-structure.md)
