# 🚦 控制器与路由

控制器是 HestJS 中处理 HTTP 请求的核心，负责定义路由和业务逻辑。通过装饰器声明路由，代码简洁直观。

## 基本用法

```typescript
import { Controller, Get, Post, Param, Body } from '@hestjs/core';

@Controller('/api/users')
export class UsersController {
  @Get('/')
  getAllUsers() {
    // 获取所有用户
    return [];
  }

  @Get('/:id')
  getUser(@Param('id') id: string) {
    // 获取指定用户
    return { id };
  }

  @Post('/')
  createUser(@Body() data: any) {
    // 创建新用户
    return { ...data, id: 'new-id' };
  }
}
```

## 路由装饰器

- `@Controller(path)`：定义控制器基础路径
- `@Get(path)`、`@Post(path)` 等：声明 HTTP 路由
- `@Param(name)`、`@Body()`：参数注入

## 路由分组与模块化

建议将相关路由归类到同一控制器，并按业务拆分模块。

## 最佳实践

- 控制器只处理请求分发，业务逻辑建议放在 Service 层
- 路由路径应语义化，便于维护

> 🚦 控制器让你的 API 路由声明更优雅，业务更清晰。

---

下一步：了解 HestJS 模块系统。
