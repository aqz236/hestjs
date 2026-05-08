# 控制器和路由

控制器是 HestJS 应用程序中处理 HTTP 请求的核心组件。它们负责接收客户端请求、调用相应的业务逻辑，并返回响应。本指南将详细介绍如何创建和使用控制器。

## 🎯 控制器基础

### 创建控制器

使用 `@Controller()` 装饰器将一个类标记为控制器：

```typescript
import { Controller, Get } from '@hestjs/core';
import { Context } from 'hono';

@Controller('/api/users')
export class UsersController {
  @Get()
  findAll(c: Context) {
    return c.json({ users: [] });
  }
}
```

### 路由装饰器

HestJS 提供了完整的 HTTP 方法装饰器：

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Patch 
} from '@hestjs/core';
import { Context } from 'hono';

@Controller('/api/users')
export class UsersController {
  @Get()                    // GET /api/users
  findAll(c: Context) {
    return c.json({ users: [] });
  }

  @Get('/:id')             // GET /api/users/:id
  findById(c: Context) {
    return c.json({ user: {} });
  }

  @Post()                  // POST /api/users
  create(c: Context) {
    return c.json({ user: {}, message: 'Created' });
  }

  @Put('/:id')             // PUT /api/users/:id
  update(c: Context) {
    return c.json({ user: {}, message: 'Updated' });
  }

  @Delete('/:id')          // DELETE /api/users/:id
  remove(c: Context) {
    return c.json({ message: 'Deleted' });
  }

  @Patch('/:id')           // PATCH /api/users/:id
  partialUpdate(c: Context) {
    return c.json({ user: {}, message: 'Partially updated' });
  }
}
```

## 📝 路径参数处理

### 基本路径参数

```typescript
import { Controller, Get, Param } from '@hestjs/core';
import { Context } from 'hono';

@Controller('/api/users')
export class UsersController {
  @Get('/:id')
  findById(@Param('id') id: string, c: Context) {
    console.log('User ID:', id); // 从 URL 中提取的 ID
    return c.json({ user: { id } });
  }

  @Get('/:userId/posts/:postId')
  findUserPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
    c: Context
  ) {
    return c.json({ 
      user: { id: userId },
      post: { id: postId }
    });
  }
}
```

### 多个路径参数

```typescript
@Controller('/api')
export class ApiController {
  @Get('/users/:userId/orders/:orderId/items/:itemId')
  getOrderItem(
    @Param('userId') userId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    c: Context
  ) {
    return c.json({
      userId,
      orderId,
      itemId,
      item: {} // 实际的业务逻辑
    });
  }
}
```

## 🔍 查询参数处理

```typescript
import { Controller, Get, Query } from '@hestjs/core';
import { Context } from 'hono';

@Controller('/api/users')
export class UsersController {
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    c: Context
  ) {
    // 查询参数处理
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    console.log('Query params:', { page: pageNum, limit: limitNum, search });
    
    return c.json({
      users: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: 0
      }
    });
  }

  @Get('/search')
  search(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    c: Context
  ) {
    return c.json({
      query,
      category,
      sort,
      results: []
    });
  }
}
```

## 📦 请求体处理

### 基本请求体

```typescript
import { Controller, Post, Body } from '@hestjs/core';
import { Context } from 'hono';

interface CreateUserDto {
  name: string;
  email: string;
  age: number;
}

@Controller('/api/users')
export class UsersController {
  @Post()
  create(@Body() createUserDto: CreateUserDto, c: Context) {
    console.log('Received data:', createUserDto);
    
    // 业务逻辑处理
    const newUser = {
      id: Date.now().toString(),
      ...createUserDto,
      createdAt: new Date()
    };
    
    return c.json({
      success: true,
      user: newUser
    });
  }
}
```

### 结合验证的请求体

```typescript
import { Controller, Post, Body } from '@hestjs/core';
import { IsString, IsEmail, IsNumber } from '@hestjs/validation';

export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 0, maximum: 150 })
  age!: number;
}

@Controller('/api/users')
export class UsersController {
  @Post()
  create(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    // createUserDto 已经过验证，类型安全
    return {
      success: true,
      user: createUserDto
    };
  }
}
```

## 📋 请求头处理

```typescript
import { Controller, Get, Post, Headers } from '@hestjs/core';

@Controller('/api/users')
export class UsersController {
  @Get()
  findAll(@Headers('authorization') auth?: string) {
    if (!auth) {
      return { error: 'Authorization header required' };
    }
    
    // 处理认证逻辑
    const token = auth.replace('Bearer ', '');
    console.log('Token:', token);
    
    return { users: [] };
  }

  @Post()
  create(
    @Headers('content-type') contentType: string,
    @Headers('user-agent') userAgent: string,
    @Body() userData: any
  ) {
    console.log('Content-Type:', contentType);
    console.log('User-Agent:', userAgent);
    
    return { success: true };
  }
}
```

## 🔄 请求和响应对象

### 访问原始请求对象

```typescript
import { Controller, Get, Req, Res } from '@hestjs/core';
import type { Context } from 'hono';

@Controller('/api')
export class ApiController {
  @Get('/request-info')
  getRequestInfo(@Req() req: Context['req']) {
    return {
      method: req.method,
      url: req.url,
      path: req.path,
      headers: Object.fromEntries(req.headers.entries())
    };
  }

  @Get('/custom-response')
  customResponse(@Res() res: Context) {
    // 直接操作响应对象
    return res.json({
      message: 'Custom response',
      timestamp: new Date().toISOString()
    }, 200);
  }
}
```

## 🎯 状态码和响应

### 自定义状态码

```typescript
import { Controller, Post, HttpStatus } from '@hestjs/core';

@Controller('/api/users')
export class UsersController {
  @Post()
  create(@Body() userData: any) {
    try {
      // 业务逻辑
      const user = this.createUser(userData);
      
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        user
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message: error.message
      };
    }
  }

  @Post('/batch')
  createBatch(@Body() users: any[]) {
    if (users.length === 0) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No users provided'
      };
    }

    // 批量创建逻辑
    return {
      statusCode: HttpStatus.CREATED,
      message: `Created ${users.length} users`,
      users: []
    };
  }

  private createUser(userData: any) {
    // 模拟用户创建
    return { id: '1', ...userData };
  }
}
```

## 🔀 子控制器和嵌套路由

### 模块化路由组织

```typescript
// 主控制器
@Controller('/api/users')
export class UsersController {
  @Get()
  findAll() {
    return { users: [] };
  }
}

// 用户资料控制器
@Controller('/api/users/:userId/profile')
export class UserProfileController {
  @Get()
  getProfile(@Param('userId') userId: string) {
    return { profile: { userId } };
  }

  @Put()
  updateProfile(
    @Param('userId') userId: string,
    @Body() profileData: any
  ) {
    return { 
      message: 'Profile updated',
      profile: { userId, ...profileData }
    };
  }
}

// 用户订单控制器
@Controller('/api/users/:userId/orders')
export class UserOrdersController {
  @Get()
  getOrders(@Param('userId') userId: string) {
    return { 
      userId,
      orders: []
    };
  }

  @Post()
  createOrder(
    @Param('userId') userId: string,
    @Body() orderData: any
  ) {
    return {
      userId,
      order: { id: '1', ...orderData }
    };
  }
}
```

## 🔧 控制器依赖注入

### 注入服务

```typescript
import { Controller, Get, Post, Body, Param } from '@hestjs/core';
import { UsersService } from './users.service';
import { EmailService } from '../shared/email.service';
import { Logger } from '@hestjs/logger';

@Controller('/api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly logger: Logger
  ) {}

  @Get()
  async findAll() {
    this.logger.info('Fetching all users');
    return await this.usersService.findAll();
  }

  @Post()
  async create(@Body() userData: any) {
    this.logger.info('Creating new user', userData);
    
    const user = await this.usersService.create(userData);
    
    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(user.email, user.name);
    
    return {
      success: true,
      user
    };
  }
}
```

### 可选依赖

```typescript
import { Controller, Get } from '@hestjs/core';
import { optional, inject } from 'tsyringe';

@Controller('/api/stats')
export class StatsController {
  constructor(
    @inject('CacheService') 
    @optional() 
    private readonly cacheService?: CacheService
  ) {}

  @Get()
  async getStats() {
    let stats;
    
    // 如果缓存服务可用，尝试从缓存获取
    if (this.cacheService) {
      stats = await this.cacheService.get('stats');
    }
    
    if (!stats) {
      // 计算统计数据
      stats = await this.calculateStats();
      
      // 缓存结果（如果缓存服务可用）
      if (this.cacheService) {
        await this.cacheService.set('stats', stats, 300); // 5分钟
      }
    }
    
    return stats;
  }

  private async calculateStats() {
    // 实际统计计算逻辑
    return {
      users: 100,
      posts: 500,
      comments: 1200
    };
  }
}
```

## 🚨 错误处理

### 控制器级错误处理

```typescript
import { Controller, Get, Post, Body, HttpStatus } from '@hestjs/core';

@Controller('/api/users')
export class UsersController {
  @Get('/:id')
  async findById(@Param('id') id: string) {
    try {
      const user = await this.usersService.findById(id);
      
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found'
        };
      }
      
      return { user };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch user',
        error: error.message
      };
    }
  }

  @Post()
  async create(@Body() userData: any) {
    try {
      // 验证用户数据
      if (!userData.email) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email is required'
        };
      }

      // 检查邮箱是否已存在
      const existingUser = await this.usersService.findByEmail(userData.email);
      if (existingUser) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'User with this email already exists'
        };
      }

      const user = await this.usersService.create(userData);
      return {
        statusCode: HttpStatus.CREATED,
        user
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create user',
        error: error.message
      };
    }
  }
}
```

## 📊 完整示例

这里是一个完整的用户管理控制器示例：

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpStatus 
} from '@hestjs/core';
import { IsString, IsEmail, IsNumber, IsOptional } from '@hestjs/validation';
import { ApiOperation, ApiResponse, ApiBody } from '@hestjs/scalar';
import { UsersService } from './users.service';
import { Logger } from '@hestjs/logger';

// DTO 定义
export class CreateUserDto {
  @IsString({ minLength: 2, maxLength: 50 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 0, maximum: 150 })
  age!: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ minLength: 2, maxLength: 50 })
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber({ minimum: 0, maximum: 150 })
  age?: number;
}

@Controller('/api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string
  ) {
    this.logger.info('Fetching users', { page, limit, search });

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const result = await this.usersService.findAll({
      page: pageNum,
      limit: limitNum,
      search
    });

    return {
      users: result.users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: Math.ceil(result.total / limitNum)
      }
    };
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    this.logger.info('Fetching user by ID', { id });

    const user = await this.usersService.findById(id);
    
    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found'
      };
    }

    return { user };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ description: 'User data' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    this.logger.info('Creating new user', createUserDto);

    try {
      const user = await this.usersService.create(createUserDto);
      
      return {
        statusCode: HttpStatus.CREATED,
        user,
        message: 'User created successfully'
      };
    } catch (error) {
      this.logger.error('Failed to create user', error);
      
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message
      };
    }
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body(UpdateUserDto) updateUserDto: UpdateUserDto
  ) {
    this.logger.info('Updating user', { id, ...updateUserDto });

    try {
      const user = await this.usersService.update(id, updateUserDto);
      
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found'
        };
      }

      return {
        user,
        message: 'User updated successfully'
      };
    } catch (error) {
      this.logger.error('Failed to update user', error);
      
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message
      };
    }
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    this.logger.info('Deleting user', { id });

    const deleted = await this.usersService.remove(id);
    
    if (!deleted) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found'
      };
    }

    return {
      message: 'User deleted successfully'
    };
  }
}
```

## 📚 最佳实践

### 1. 路由组织
- 使用有意义的路径前缀
- 遵循 RESTful API 设计规范
- 保持路由结构清晰简洁

### 2. 错误处理
- 统一错误响应格式
- 提供有意义的错误消息
- 记录详细的错误日志

### 3. 验证和转换
- 使用 DTO 进行数据验证
- 在控制器层进行基本验证
- 将复杂业务逻辑移到服务层

### 4. 文档化
- 使用 OpenAPI 装饰器
- 提供清晰的接口描述
- 包含请求和响应示例

## 📚 下一步

学习了控制器后，继续深入：

1. [模块系统](./modules.md) - 组织代码结构
2. [依赖注入](./dependency-injection.md) - 管理组件依赖
<!-- 3. [服务和提供者](./services.md) - 业务逻辑处理 -->
<!-- 4. [中间件](./middleware.md) - 请求处理流程 -->

---

**上一步**: [← CLI 工具使用](../getting-started/cli-usage.md) | **下一步**: [模块系统 →](./modules.md)
