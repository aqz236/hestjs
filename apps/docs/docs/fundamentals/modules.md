# 模块系统

模块是 HestJS 应用程序的基本组织单元。它们用于将相关的控制器、服务和其他提供者组织在一起，形成一个内聚的功能单元。本指南将详细介绍如何创建和使用模块。

## 🏗️ 模块基础

### 创建模块

使用 `@Module()` 装饰器定义一个模块：

```typescript
import { Module } from '@hestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

### 模块元数据

`@Module()` 装饰器接受以下属性：

| 属性 | 类型 | 描述 |
|------|------|------|
| `controllers` | `any[]` | 该模块中的控制器列表 |
| `providers` | `any[]` | 该模块中的提供者（服务）列表 |
| `imports` | `any[]` | 导入的其他模块列表 |
| `exports` | `any[]` | 导出给其他模块使用的提供者列表 |

## 📦 模块组织结构

### 功能模块

每个功能模块通常包含：

```
users/
├── users.module.ts          # 模块定义
├── users.controller.ts      # 控制器
├── users.service.ts         # 服务
├── dto/                     # 数据传输对象
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── entities/                # 实体定义
│   └── user.entity.ts
└── interfaces/              # 接口定义
    └── user.interface.ts
```

### 完整的用户模块示例

```typescript
// users/users.module.ts
import { Module } from '@hestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './user.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    // 可以包含更多提供者
  ],
  exports: [
    UsersService, // 导出给其他模块使用
  ],
})
export class UsersModule {}
```

## 🔗 模块间依赖

### 导入其他模块

```typescript
// posts/posts.module.ts
import { Module } from '@hestjs/core';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UsersModule } from '../users/users.module'; // 导入用户模块

@Module({
  imports: [UsersModule], // 导入模块以使用其导出的服务
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
```

### 使用导入模块的服务

```typescript
// posts/posts.service.ts
import { injectable } from 'tsyringe';
import { UsersService } from '../users/users.service';
import { Logger } from '@hestjs/logger';

@injectable()
export class PostsService {
  constructor(
    private readonly usersService: UsersService, // 使用从 UsersModule 导入的服务
    private readonly logger: Logger
  ) {}

  async createPost(userId: string, postData: any) {
    // 验证用户是否存在
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    this.logger.info('Creating post for user', { userId, postData });

    // 创建帖子逻辑
    const post = {
      id: Date.now().toString(),
      userId,
      ...postData,
      createdAt: new Date(),
    };

    return post;
  }
}
```

## 🌍 全局模块

### 创建全局模块

某些模块（如日志、配置）可能需要在整个应用中使用，可以创建为全局模块：

```typescript
// shared/logger.module.ts
import { Module } from '@hestjs/core';
import { Logger } from '@hestjs/logger';

@Module({
  providers: [
    {
      provide: 'Logger',
      useFactory: () => {
        return new Logger({
          level: 'info',
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          },
        });
      },
    },
  ],
  exports: ['Logger'],
})
export class LoggerModule {}
```

### 配置模块

```typescript
// config/config.module.ts
import { Module } from '@hestjs/core';
import { ConfigService } from './config.service';

@Module({
  providers: [
    ConfigService,
    {
      provide: 'DATABASE_CONFIG',
      useFactory: (configService: ConfigService) => ({
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
      }),
      inject: [ConfigService],
    },
  ],
  exports: [ConfigService, 'DATABASE_CONFIG'],
})
export class ConfigModule {}
```

## 🔄 动态模块

### 工厂函数模式

创建可配置的动态模块：

```typescript
// database/database.module.ts
import { Module } from '@hestjs/core';

interface DatabaseModuleOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions) {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_CONNECTION',
          useFactory: () => {
            // 创建数据库连接
            return createConnection(options);
          },
        },
        DatabaseService,
      ],
      exports: ['DATABASE_CONNECTION', DatabaseService],
    };
  }

  static forFeature(entities: any[]) {
    const providers = entities.map(entity => ({
      provide: `${entity.name}Repository`,
      useFactory: (connection: any) => {
        return new Repository(connection, entity);
      },
      inject: ['DATABASE_CONNECTION'],
    }));

    return {
      module: DatabaseModule,
      providers,
      exports: providers.map(p => p.provide),
    };
  }
}

// 数据库服务
@injectable()
class DatabaseService {
  constructor(@inject('DATABASE_CONNECTION') private connection: any) {}
  
  async query(sql: string, params: any[]) {
    return this.connection.query(sql, params);
  }
}

function createConnection(options: DatabaseModuleOptions) {
  // 实际的数据库连接创建逻辑
  return {
    query: (sql: string, params: any[]) => {
      console.log('Executing query:', sql, params);
      return Promise.resolve([]);
    },
  };
}
```

### 使用动态模块

```typescript
// app.module.ts
import { Module } from '@hestjs/core';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    // 配置数据库连接
    DatabaseModule.forRoot({
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'myapp',
    }),
    UsersModule,
    PostsModule,
  ],
})
export class AppModule {}
```

## 🏛️ 根模块

### 应用根模块

每个应用都有一个根模块，它是应用的入口点：

```typescript
// app.module.ts
import { Module } from '@hestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './shared/logger.module';

@Module({
  imports: [
    // 全局模块
    ConfigModule,
    LoggerModule,
    
    // 功能模块
    AuthModule,
    UsersModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## 🎯 模块的最佳实践

### 1. 单一职责原则

每个模块应该专注于一个特定的业务领域：

```typescript
// ✅ 好的模块设计
@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}

// ❌ 避免的设计 - 混合多个职责
@Module({
  controllers: [UsersController, PostsController, CommentsController],
  providers: [UsersService, PostsService, CommentsService],
})
export class MixedModule {} // 职责不清晰
```

### 2. 适当的模块大小

```typescript
// ✅ 适中大小的模块
@Module({
  controllers: [UsersController, UserProfileController],
  providers: [
    UsersService,
    UserProfileService,
    UserRepository,
    ProfileRepository,
  ],
  exports: [UsersService, UserProfileService],
})
export class UsersModule {}

// ❌ 过大的模块
@Module({
  controllers: [/* 10+ controllers */],
  providers: [/* 20+ providers */],
  // 考虑拆分成多个相关模块
})
export class MegaModule {}
```

### 3. 清晰的依赖关系

```typescript
// 用户模块 - 基础模块，不依赖其他业务模块
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

// 帖子模块 - 依赖用户模块
@Module({
  imports: [UsersModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}

// 评论模块 - 依赖用户和帖子模块
@Module({
  imports: [UsersModule, PostsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
```

## 🔧 模块高级用法

### 条件模块导入

```typescript
// 根据环境条件导入不同的模块
const DatabaseModule = process.env.NODE_ENV === 'test' 
  ? MockDatabaseModule 
  : ProductionDatabaseModule;

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule,
  ],
  // ... 其他配置
})
export class AppModule {}
```

### 模块中的提供者工厂

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: 'UsersRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new UsersRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'CacheService',
      useFactory: () => {
        if (process.env.REDIS_URL) {
          return new RedisCache(process.env.REDIS_URL);
        }
        return new InMemoryCache();
      },
    },
  ],
  exports: ['UsersRepository', 'CacheService'],
})
export class UsersModule {}
```

## 🧪 模块测试

### 模块单元测试

```typescript
// users.module.spec.ts
import { Test } from '@hestjs/testing';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

describe('UsersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide UsersService', () => {
    const service = module.get<UsersService>(UsersService);
    expect(service).toBeDefined();
  });

  it('should provide UsersController', () => {
    const controller = module.get<UsersController>(UsersController);
    expect(controller).toBeDefined();
  });
});
```

### 集成测试

```typescript
// users.integration.spec.ts
import { Test } from '@hestjs/testing';
import { HestFactory } from '@hestjs/core';
import { UsersModule } from './users.module';

describe('Users Integration', () => {
  let app: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    app = await HestFactory.create(module);
  });

  it('should handle user creation', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@test.com',
      age: 30,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: userData,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      success: true,
      user: expect.objectContaining(userData),
    });
  });
});
```

## 📊 模块依赖图示

```
AppModule
├── ConfigModule (全局)
├── LoggerModule (全局)
├── DatabaseModule (全局)
├── AuthModule
│   └── imports: [UsersModule]
├── UsersModule (基础模块)
├── PostsModule
│   └── imports: [UsersModule]
├── CommentsModule
│   └── imports: [UsersModule, PostsModule]
└── NotificationsModule
    └── imports: [UsersModule, PostsModule]
```

## 📚 下一步

学习了模块系统后，继续深入：

1. [依赖注入](./dependency-injection.md) - 理解 DI 容器
<!-- 2. [服务和提供者](./services.md) - 创建业务逻辑 -->
<!-- 3. [中间件](./middleware.md) - 处理请求流程 -->
<!-- 4. [拦截器](./interceptors.md) - 增强功能 -->

---

**上一步**: [← 控制器详解](./controllers.md) | **下一步**: [依赖注入 →](./dependency-injection.md)
