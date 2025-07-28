# 🧩 模块系统

HestJS 采用模块化架构，提升项目可维护性和扩展性。每个模块可包含控制器、服务、DTO 等，独立管理业务逻辑。

## 定义模块

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

## 根模块

根模块组织所有子模块和全局服务：

```typescript
import { Module } from '@hestjs/core';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [UsersModule],
})
export class AppModule {}
```

## 模块化优势

- 业务隔离，易于维护
- 支持依赖注入和生命周期管理
- 便于团队协作和功能扩展

> 🧩 合理拆分模块，让你的项目结构更清晰、更可扩展。

---

下一步：了解 HestJS 依赖注入机制。
