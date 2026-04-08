# 依赖注入

依赖注入（Dependency Injection, DI）是 HestJS 的核心特性之一。它基于 TSyringe 实现，提供了强大的依赖管理和自动注入功能。本指南将详细介绍如何使用 HestJS 的依赖注入系统。

## 🎯 依赖注入基础

### 什么是依赖注入

依赖注入是一种设计模式，它允许我们将对象的依赖关系从外部注入，而不是在对象内部创建。这提高了代码的可测试性、可维护性和灵活性。

```typescript
// ❌ 没有依赖注入 - 紧耦合
export class OrderService {
  private emailService: EmailService;
  private paymentService: PaymentService;

  constructor() {
    // 在构造函数中直接创建依赖
    this.emailService = new EmailService();
    this.paymentService = new PaymentService();
  }
}

// ✅ 使用依赖注入 - 松耦合
@injectable()
export class OrderService {
  constructor(
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService
  ) {}
}
```

## 🏗️ 基本用法

### 创建可注入的服务

使用 `@injectable()` 装饰器标记一个类为可注入：

```typescript
import { injectable } from 'tsyringe';
import { Logger } from '@hestjs/logger';

@injectable()
export class UsersService {
  constructor(private readonly logger: Logger) {}

  async findAll() {
    this.logger.info('Fetching all users');
    return [];
  }

  async create(userData: any) {
    this.logger.info('Creating user', userData);
    return { id: '1', ...userData };
  }
}
```

### 在控制器中注入服务

控制器会自动支持依赖注入：

```typescript
import { Controller, Get, Post, Body } from '@hestjs/core';
import { UsersService } from './users.service';

@Controller('/api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService
  ) {}

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Post()
  async create(@Body() userData: any) {
    return await this.usersService.create(userData);
  }
}
```

## 🔧 高级注入技术

### 接口注入

使用接口和令牌进行更灵活的注入：

```typescript
// 定义接口
export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

// 实现接口
@injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @inject('DATABASE_CONNECTION') private connection: any
  ) {}

  async findAll(): Promise<User[]> {
    // PostgreSQL 实现
    return this.connection.query('SELECT * FROM users');
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.connection.query(
      'SELECT * FROM users WHERE id = $1', 
      [id]
    );
    return result[0] || null;
  }

  // 其他方法实现...
}

// 内存实现（用于测试）
@injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  // 其他方法实现...
}
```

### 使用令牌注入

```typescript
// 定义注入令牌
export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY';
export const CACHE_SERVICE_TOKEN = 'CACHE_SERVICE';

@injectable()
export class UsersService {
  constructor(
    @inject(USER_REPOSITORY_TOKEN) 
    private readonly userRepository: IUserRepository,
    
    @inject(CACHE_SERVICE_TOKEN) 
    private readonly cacheService: ICacheService
  ) {}

  async findById(id: string): Promise<User | null> {
    // 尝试从缓存获取
    const cached = await this.cacheService.get(`user:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // 从数据库获取
    const user = await this.userRepository.findById(id);
    if (user) {
      // 缓存结果
      await this.cacheService.set(
        `user:${id}`, 
        JSON.stringify(user), 
        300 // 5分钟
      );
    }

    return user;
  }
}
```

## 📋 提供者配置

### 在模块中注册提供者

```typescript
import { Module } from '@hestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PostgresUserRepository } from './postgres-user.repository';
import { RedisCache } from '../shared/redis-cache.service';

@Module({
  controllers: [UsersController],
  providers: [
    // 基本提供者
    UsersService,
    
    // 使用类提供者
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PostgresUserRepository,
    },
    
    // 使用工厂提供者
    {
      provide: CACHE_SERVICE_TOKEN,
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          return new RedisCache(redisUrl);
        }
        return new InMemoryCache();
      },
    },
    
    // 使用值提供者
    {
      provide: 'DATABASE_CONFIG',
      useValue: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'myapp',
      },
    },
    
    // 使用现有提供者
    {
      provide: 'LOGGER',
      useExisting: Logger,
    },
  ],
  exports: [UsersService, USER_REPOSITORY_TOKEN],
})
export class UsersModule {}
```

### 工厂提供者详解

```typescript
// 复杂的工厂提供者
@Module({
  providers: [
    {
      provide: 'EMAIL_SERVICE',
      useFactory: (configService: ConfigService, logger: Logger) => {
        const emailConfig = configService.get('email');
        
        if (emailConfig.provider === 'smtp') {
          return new SMTPEmailService(emailConfig.smtp, logger);
        } else if (emailConfig.provider === 'sendgrid') {
          return new SendGridEmailService(emailConfig.sendgrid, logger);
        } else {
          return new MockEmailService(logger);
        }
      },
      inject: [ConfigService, Logger], // 注入依赖
    },
    
    // 异步工厂提供者
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        const connection = await createConnection(dbConfig);
        await connection.connect();
        return connection;
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
```

## 🔄 注入范围

### 单例模式（默认）

```typescript
@injectable()
export class ConfigService {
  private config: any;

  constructor() {
    // 配置只加载一次
    this.config = loadConfig();
  }

  get(key: string): any {
    return this.config[key];
  }
}
```

### 瞬态模式

```typescript
// 每次注入都创建新实例
@Module({
  providers: [
    {
      provide: 'REQUEST_ID_GENERATOR',
      useFactory: () => new RequestIdGenerator(),
      scope: 'transient', // 瞬态范围
    },
  ],
})
export class RequestModule {}

class RequestIdGenerator {
  generate(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 🧪 可选依赖

### 使用可选注入

```typescript
import { injectable, inject } from 'tsyringe';
import { optional } from 'tsyringe';

@injectable()
export class UsersService {
  constructor(
    @inject('USER_REPOSITORY') 
    private readonly userRepository: IUserRepository,
    
    @inject('CACHE_SERVICE') 
    @optional() 
    private readonly cacheService?: ICacheService,
    
    @inject('METRICS_SERVICE') 
    @optional() 
    private readonly metricsService?: IMetricsService
  ) {}

  async findById(id: string): Promise<User | null> {
    // 记录指标（如果可用）
    if (this.metricsService) {
      this.metricsService.increment('user.findById.calls');
    }

    // 尝试从缓存获取（如果可用）
    if (this.cacheService) {
      const cached = await this.cacheService.get(`user:${id}`);
      if (cached) {
        if (this.metricsService) {
          this.metricsService.increment('user.findById.cache.hits');
        }
        return JSON.parse(cached);
      }
    }

    // 从数据库获取
    const user = await this.userRepository.findById(id);
    
    // 缓存结果（如果缓存服务可用）
    if (user && this.cacheService) {
      await this.cacheService.set(`user:${id}`, JSON.stringify(user), 300);
    }

    return user;
  }
}
```

## 🔧 自定义装饰器

### 创建自定义注入装饰器

```typescript
// 创建自定义注入装饰器
export function InjectRepository(entity: any) {
  const token = `${entity.name}Repository`;
  return inject(token);
}

export function InjectCache() {
  return inject('CACHE_SERVICE');
}

export function InjectLogger() {
  return inject('LOGGER');
}

// 使用自定义装饰器
@injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) 
    private readonly userRepository: IUserRepository,
    
    @InjectCache() 
    private readonly cacheService: ICacheService,
    
    @InjectLogger() 
    private readonly logger: Logger
  ) {}
}
```

### 属性注入装饰器

```typescript
// 属性注入（较少使用，建议使用构造函数注入）
export class UsersController {
  @inject('USERS_SERVICE')
  private usersService!: UsersService;

  @inject('LOGGER')
  private logger!: Logger;

  @Get()
  async findAll() {
    this.logger.info('Fetching all users');
    return await this.usersService.findAll();
  }
}
```

## 🌍 全局容器操作

### 手动注册服务

```typescript
import { container } from 'tsyringe';

// 在应用启动时手动注册
export function setupContainer() {
  // 注册配置服务
  const configService = new ConfigService();
  container.registerInstance('CONFIG_SERVICE', configService);

  // 注册数据库连接
  container.register('DATABASE_CONNECTION', {
    useFactory: () => createDatabaseConnection(),
  });

  // 注册缓存服务
  container.register('CACHE_SERVICE', {
    useFactory: () => {
      const redisUrl = configService.get('REDIS_URL');
      return redisUrl ? new RedisCache(redisUrl) : new InMemoryCache();
    },
  });
}
```

### 容器清理

```typescript
// 在测试或应用关闭时清理容器
export function cleanupContainer() {
  container.clearInstances();
}

// 在测试中使用
describe('UsersService', () => {
  beforeEach(() => {
    // 设置测试容器
    container.registerInstance('USER_REPOSITORY', new MockUserRepository());
    container.registerInstance('LOGGER', new MockLogger());
  });

  afterEach(() => {
    // 清理容器
    cleanupContainer();
  });

  it('should create user', async () => {
    const service = container.resolve(UsersService);
    const user = await service.create({ name: 'John', email: 'john@test.com' });
    expect(user).toBeDefined();
  });
});
```

## 🧪 测试中的依赖注入

### 模拟依赖

```typescript
// 创建模拟服务
class MockUserRepository implements IUserRepository {
  private users: User[] = [
    { id: '1', name: 'John Doe', email: 'john@test.com', age: 30 },
    { id: '2', name: 'Jane Smith', email: 'jane@test.com', age: 25 },
  ];

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async create(user: User): Promise<User> {
    const newUser = { ...user, id: Date.now().toString() };
    this.users.push(newUser);
    return newUser;
  }

  // 其他方法的模拟实现...
}

// 测试用例
describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    
    // 创建测试容器
    const testContainer = container.createChildContainer();
    testContainer.registerInstance('USER_REPOSITORY', mockRepository);
    testContainer.registerInstance('LOGGER', new MockLogger());
    
    service = testContainer.resolve(UsersService);
  });

  it('should find user by id', async () => {
    const user = await service.findById('1');
    expect(user).toEqual({
      id: '1',
      name: 'John Doe',
      email: 'john@test.com',
      age: 30,
    });
  });

  it('should create new user', async () => {
    const userData = { name: 'Alice', email: 'alice@test.com', age: 28 };
    const user = await service.create(userData);
    
    expect(user).toMatchObject(userData);
    expect(user.id).toBeDefined();
  });
});
```

## 📊 依赖注入最佳实践

### 1. 构造函数注入优于属性注入

```typescript
// ✅ 推荐 - 构造函数注入
@injectable()
export class UsersService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: Logger
  ) {}
}

// ❌ 不推荐 - 属性注入
export class UsersService {
  @inject('USER_REPOSITORY')
  private userRepository!: IUserRepository;
}
```

### 2. 使用接口而不是具体类

```typescript
// ✅ 推荐 - 依赖接口
@injectable()
export class UsersService {
  constructor(
    @inject('USER_REPOSITORY') 
    private readonly userRepository: IUserRepository
  ) {}
}

// ❌ 不推荐 - 依赖具体类
@injectable()
export class UsersService {
  constructor(
    private readonly userRepository: PostgresUserRepository
  ) {}
}
```

### 3. 避免循环依赖

```typescript
// ❌ 避免循环依赖
@injectable()
export class UsersService {
  constructor(private readonly postsService: PostsService) {}
}

@injectable()
export class PostsService {
  constructor(private readonly usersService: UsersService) {} // 循环依赖
}

// ✅ 解决方案 - 引入中间层或重构
@injectable()
export class UsersService {
  constructor(private readonly userRepository: IUserRepository) {}
}

@injectable()
export class PostsService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository // 直接依赖仓储层
  ) {}
}
```

### 4. 合理使用作用域

```typescript
// 配置服务 - 单例
@injectable()
export class ConfigService {
  // 全局共享配置
}

// 请求处理器 - 瞬态
@Module({
  providers: [
    {
      provide: 'REQUEST_PROCESSOR',
      useClass: RequestProcessor,
      scope: 'transient', // 每次请求创建新实例
    },
  ],
})
export class RequestModule {}
```

## 📚 下一步

掌握了依赖注入后，继续学习：

1. [控制器详解](./controllers.md) - 学习路由和控制器
2. [模块系统](./modules.md) - 理解模块化架构
3. [项目结构](../getting-started/project-structure.md) - 了解项目组织
4. [CLI 工具](../getting-started/cli-usage.md) - 掌握开发工具

---

**上一步**: [← 模块系统](./modules.md) | **下一步**: [控制器详解 →](./controllers.md)
