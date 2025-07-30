# HestJS 重构变更说明

本文档总结了最近重构中的主要变更，帮助开发者了解新的 API 和最佳实践。

## 🔄 主要变更

### 1. 应用启动方式

**之前的方式**:
```typescript
// 旧版 API
const app = await HestFactory.create(AppModule);
```

**现在的方式**:
```typescript
// 新版 API - 用户需要手动创建 Hono 实例
import { Hono } from 'hono';

const hono = new Hono();
const app = await HestFactory.create(hono, AppModule);
```

### 2. 中间件系统

**之前**:
```typescript
// 使用全局拦截器和异常过滤器
app.useGlobalInterceptors(new ResponseInterceptor());
app.useGlobalFilters(new HttpExceptionFilter());
```

**现在**:
```typescript
// 使用 Hono 中间件
import { exceptionMiddleware } from './common/middleware/exception.middleware';
import { responseMiddleware } from './common/middleware/response.middleware';

hono.use('*', exceptionMiddleware);
hono.use('*', responseMiddleware);
```

### 3. 控制器方法

**之前**:
```typescript
@Controller('/api/users')
export class UsersController {
  @Get()
  findAll() {
    return { users: [] };
  }
  
  @Post()
  create(@Body() dto: CreateUserDto) {
    return { user: newUser };
  }
}
```

**现在**:
```typescript
import { Context } from 'hono';

@Controller('/api/users')
export class UsersController {
  @Get()
  findAll(c: Context) {
    return c.json({ users: [] });
  }
  
  @Post()
  create(@Body() dto: CreateUserDto, c: Context) {
    return c.json({ user: newUser });
  }
}
```

### 4. 错误处理

**之前**:
```typescript
// 使用异常过滤器
export class HttpExceptionFilter extends BaseHttpExceptionFilter {
  catch(error: Error, c: Context): Response | Promise<Response> {
    // 处理逻辑
  }
}
```

**现在**:
```typescript
// 使用异常中间件
export const exceptionMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    logger.error('HTTP Exception:', error);
    return c.json({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: c.req.path,
    }, 500);
  }
};
```

### 5. 响应处理

**之前**:
```typescript
// 使用响应拦截器
export class ResponseInterceptor implements Interceptor {
  async intercept(context: InterceptorContext, next: () => Promise<any>) {
    const result = await next();
    return {
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    };
  }
}
```

**现在**:
```typescript
// 使用响应中间件
export const responseMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  
  // 跳过文档相关的路径
  if (c.req.path === '/openapi.json' || c.req.path === '/docs') {
    return;
  }
  
  const contentType = c.res.headers.get('content-type');
  if (contentType?.includes('application/json') && c.res.status >= 200 && c.res.status < 300) {
    try {
      const duration = Date.now() - start;
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
      console.warn('Failed to wrap response:', error);
    }
  }
};
```

### 6. 项目结构变更

**之前**:
```
src/
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── response.interceptor.ts
```

**现在**:
```
src/
├── common/
│   └── middleware/
│       ├── exception.middleware.ts
│       └── response.middleware.ts
```

## 🚨 已移除的功能

以下功能已从框架中移除：

1. **全局异常过滤器系统** - 替换为异常处理中间件
2. **全局拦截器系统** - 替换为 Hono 中间件
3. **app.hono() 方法** - 用户现在直接控制 Hono 实例
4. **app.useGlobalFilters()** - 使用 `hono.use()` 注册中间件
5. **app.useGlobalInterceptors()** - 使用 `hono.use()` 注册中间件

## 📈 新的优势

### 1. 更好的性能
- 直接使用 Hono 的高性能中间件系统
- 减少了额外的抽象层开销

### 2. 更简单的架构
- 用户直接控制 Hono 实例
- 减少了框架的复杂性
- 更容易理解和调试

### 3. 更好的可扩展性
- 可以直接使用 Hono 生态系统的中间件
- 更灵活的自定义配置

### 4. 类型安全
- 在控制器方法中直接访问 Hono Context
- 更好的 TypeScript 类型推导

## 🔧 迁移指南

### 步骤 1: 更新应用启动代码

```typescript
// 旧代码
const app = await HestFactory.create(AppModule);

// 新代码
import { Hono } from 'hono';
const hono = new Hono();
const app = await HestFactory.create(hono, AppModule);
```

### 步骤 2: 迁移异常过滤器

将异常过滤器改写为中间件，并在创建应用前注册：

```typescript
hono.use('*', exceptionMiddleware);
```

### 步骤 3: 迁移响应拦截器

将响应拦截器改写为中间件：

```typescript
hono.use('*', responseMiddleware);
```

### 步骤 4: 更新控制器方法

为所有控制器方法添加 `Context` 参数，并使用 `c.json()` 返回响应：

```typescript
@Get()
findAll(c: Context) {
  return c.json({ users: [] });
}
```

### 步骤 5: 更新启动代码

```typescript
// 使用 hono.fetch 而不是 app.hono().fetch
Bun.serve({
  port,
  fetch: hono.fetch,
  reusePort: true,
});
```

## 💡 最佳实践

1. **中间件顺序很重要** - 先注册异常处理，再注册响应包装
2. **路径排除** - 确保响应中间件不会干扰 API 文档路径
3. **错误处理** - 在异常中间件中妥善处理各种错误类型
4. **性能优化** - 利用 Hono 的高性能特性
5. **类型安全** - 充分利用 TypeScript 和 Context 类型

## 📚 相关文档

- [第一个应用](../getting-started/first-application.md) - 使用新 API 的完整示例
- [控制器](../fundamentals/controllers.md) - 控制器最佳实践
- [中间件](../fundamentals/middleware.md) - 中间件开发指南

---

这次重构简化了框架架构，提高了性能，并让开发者有更好的控制权。虽然需要一些迁移工作，但长期来看会带来更好的开发体验。
