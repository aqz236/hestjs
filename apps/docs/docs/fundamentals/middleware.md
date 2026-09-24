# 中间件

HestJS 不封装 Hono 的中间件体系，你可以直接使用 Hono 生态里的任何中间件。`@UseMiddleware()` 装饰器只是把它们**声明式地**挂到控制器或具体路由上。

## 🔄 三种横切能力的分工

| | 注册方式 | 能拿到 | 典型用途 |
| --- | --- | --- | --- |
| Hono 中间件 | `app.getHonoInstance().use(...)` | 路径、请求上下文 | CORS、压缩、限流 |
| `@UseMiddleware()` | 控制器类 / 方法装饰器 | 路径、请求上下文 | 鉴权、请求 ID、缓存 |
| [拦截器](./interceptors) | `app.useGlobalInterceptors(...)` | 控制器类、**方法名**、请求上下文 | 参数校验、统一响应包装 |

**选型原则**：能用中间件解决的用中间件；只有需要「按方法签名」区分处理时才用拦截器。

## ✍️ 使用

### 类级

作用于该控制器下的**所有**路由：

```typescript
import { Controller, Get, UseMiddleware } from '@hestjs/core';
import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

const requestId: MiddlewareHandler = async (c, next) => {
  const id = crypto.randomUUID();
  c.header('X-Request-Id', id);
  c.set('requestId', id);
  await next();
};

@Controller('/users')
@UseMiddleware(requestId, cors())
export class UsersController {
  @Get('/')
  findAll() {
    return { users: [] };
  }
}
```

### 方法级

只作用于声明它的那个方法：

```typescript
const requireAuth: MiddlewareHandler = async (c, next) => {
  if (!c.req.header('authorization')) {
    return c.json({ message: 'Unauthorized' }, 401);
  }
  await next();
};

@Controller('/users')
export class UsersController {
  @Get('/')
  findAll() {
    return { users: [] };
  }

  @Delete('/:id')
  @UseMiddleware(requireAuth)
  remove(@Param('id') id: string) {
    return { removed: id };
  }
}
```

## 🔀 执行顺序

```text
类级中间件 1
└─ 类级中间件 2
   └─ 方法级中间件 1
      └─ 全局拦截器 1
         └─ 全局拦截器 2
            └─ 参数解析（@Body / @Param / @Query / @Context）
               └─ controller 方法
            ┌─ 全局拦截器 2  后半
         ┌─ 全局拦截器 1  后半
      ┌─ 方法级中间件 1  后半
   ┌─ 类级中间件 2  后半
┌─ 类级中间件 1  后半
```

按声明顺序**先进后出**。类级始终排在方法级之前，中间件整体排在拦截器之外。

## ☑️ 中间件能做什么

### 短路请求

不调用 `next()` 即可终止后续流程 —— 控制器与拦截器都不会执行：

```typescript
const maintenance: MiddlewareHandler = async (c) => {
  if (process.env.MAINTENANCE === '1') {
    return c.json({ message: '维护中' }, 503);
  }
  await next();
};
```

### 追加响应头

`await next()` 之后仍可修改响应：

```typescript
const timing: MiddlewareHandler = async (c, next) => {
  const started = Date.now();
  await next();
  c.header('X-Response-Time', `${Date.now() - started}ms`);
};
```

### 抛异常

中间件抛出的异常会由[异常过滤器](./exception-filters)接管，与控制器抛出的异常走同一条路径。

## 🗂️ 与全局中间件的区别

`app.getHonoInstance().use(...)` 注册的中间件对**所有**路由生效，包括没有经过控制器的路由；而 `@UseMiddleware()` 只作用于它所在的控制器 / 方法，并且注册顺序在全局中间件之后。

## ⚠️ 注意事项

- 多个 `@UseMiddleware()` 叠加时按声明顺序累积（装饰器自下而上求值，因此写在**下面**的会先执行）
- 方法级中间件必须先于 `@Get()` 等方法装饰器书写时不要混淆：装饰器求值顺序是自下而上，但两者写的是不同的元数据，互不影响
- 中间件是**运行时**执行的，因此 `Container` 的依赖注入不会注入到中间件里；需要依赖时请从 `c.get(...)` 或闭包中获取

## 🔗 相关

- [拦截器](./interceptors)
- [异常过滤器](./exception-filters)
- [控制器和路由](./controllers)
