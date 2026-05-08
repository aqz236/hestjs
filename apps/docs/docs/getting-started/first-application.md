# 创建第一个应用

本指南将带你一步步创建一个完整的 HestJS 应用，包含用户管理功能、数据验证、API 文档等特性。

## 🎯 应用概览

我们将创建一个用户管理 API，包含以下功能：
- 用户列表查询
- 创建新用户
- 获取用户详情
- 数据验证
- API 文档生成
- 中间件错误处理

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
│   └── middleware/
│       ├── exception.middleware.ts
│       └── response.middleware.ts
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
  Param
} from '@hestjs/core';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam 
} from '@hestjs/scalar';
import { Context } from 'hono';
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
  async findAll(c: Context) {
    const users = await this.usersService.findAll();
    return c.json({
      data: users,
      message: 'Users retrieved successfully',
    });
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
  async findById(@Param('id') id: string, c: Context) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return c.status(404).json({
        statusCode: 404,
        message: 'User not found',
      });
    }

    return c.json({
      data: user,
      message: 'User found',
    });
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
  async create(@Body(CreateUserDto) createUserDto: CreateUserDto, c: Context) {
    try {
      const user = await this.usersService.create(createUserDto);
      return c.status(201).json({
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      return c.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to create user',
      });
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
    @Body() updateData: Partial<CreateUserDto>,
    c: Context
  ) {
    const user = await this.usersService.update(id, updateData);
    if (!user) {
      return c.status(404).json({
        message: 'User not found',
      });
    }

    return c.json({
      data: user,
      message: 'User updated successfully',
    });
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
  async delete(@Param('id') id: string, c: Context) {
    const deleted = await this.usersService.delete(id);
    if (!deleted) {
      return c.status(404).json({
        message: 'User not found',
      });
    }

    return c.json({
      message: 'User deleted successfully',
    });
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

## 🛡️ 步骤 5: 添加中间件

### 异常处理中间件
```typescript
// src/common/middleware/exception.middleware.ts
import { Context, Next } from 'hono';
import { logger } from '@hestjs/logger';

export const exceptionMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    logger.error('HTTP Exception:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: c.req.path,
      method: c.req.method,
    });

    const err = error instanceof Error ? error : new Error('Unknown error');

    // 处理自定义错误
    if (err.message.includes('already exists')) {
      return c.json({
        statusCode: 409,
        message: err.message,
        timestamp: new Date().toISOString(),
        path: c.req.path,
      }, 409);
    }

    // 处理验证错误
    if (err.message.includes('validation')) {
      return c.json({
        statusCode: 400,
        message: 'Validation failed',
        details: err.message,
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
};
```

### 响应包装中间件
```typescript
// src/common/middleware/response.middleware.ts
import { Context, Next } from 'hono';
import { logger } from '@hestjs/logger';

export const responseMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  
  logger.info(`→ ${c.req.method} ${c.req.path}`);
  
  await next();
  
  // 跳过文档相关的路径
  if (c.req.path === '/openapi.json' || c.req.path === '/docs' || c.req.path.startsWith('/api-docs')) {
    return;
  }
  
  const duration = Date.now() - start;
  logger.info(`← ${c.req.method} ${c.req.path} (${duration}ms)`);
  
  // 只包装JSON响应，且响应状态为2xx
  const contentType = c.res.headers.get('content-type');
  if (contentType?.includes('application/json') && c.res.status >= 200 && c.res.status < 300) {
    try {
      // 克隆响应以避免消耗原始响应体
      const responseClone = c.res.clone();
      const originalResponse = await responseClone.json();
      
      const wrappedResponse = {
        success: true,
        data: originalResponse,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      };
      
      return c.json(wrappedResponse);
    } catch (error) {
      // 如果无法解析JSON，就保持原响应
      console.warn('Failed to wrap response:', error);
    }
  }
};
```

## 🔧 步骤 6: 配置应用模块

```typescript
// src/app.controller.ts
import { Controller, Get } from '@hestjs/core';
import { ApiOperation, ApiResponse } from '@hestjs/scalar';
import { Context } from 'hono';

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
  health(c: Context) {
    return c.json({
      status: 'ok',
      message: 'HestJS application is running!',
      timestamp: new Date().toISOString(),
    });
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
  welcome(c: Context) {
    return c.json({
      message: 'Welcome to HestJS!',
      version: '1.0.0',
    });
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
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HestFactory } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import '@hestjs/scalar';
import { AppModule } from './app.module';
import { exceptionMiddleware } from './common/middleware/exception.middleware';
import { responseMiddleware } from './common/middleware/response.middleware';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    // 创建 Hono 实例
    const hono = new Hono();
    
    // 配置 CORS
    hono.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    }));

    // 注册全局中间件
    hono.use('*', exceptionMiddleware);
    hono.use('*', responseMiddleware);

    // 创建应用实例
    const app = await HestFactory.create(hono, AppModule);

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
      fetch: hono.fetch,
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
✅ **中间件系统** - 异常处理和响应包装  
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
