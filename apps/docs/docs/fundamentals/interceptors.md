# 拦截器

拦截器（Interceptor）是**面向 controller 方法**的横切能力。相比 Hono 中间件，它多知道一件事：**即将执行的是哪个方法**，因此可以依据方法上的装饰器元数据工作。

这正是参数级 DTO 校验（`@Body(UserDto)`）得以实现的基础 —— 中间件只持有路径，无法得知即将执行的方法，也就读不到该方法上的参数元数据。

## 🔄 与 Hono 中间件的关系

| | Hono 中间件 | HestJS 拦截器 |
| --- | --- | --- |
| 注册位置 | `app.getHonoInstance().use(...)` | `app.useGlobalInterceptors(...)` |
| 能拿到 | 路径、请求上下文 | 控制器类、方法名、请求上下文 |
| 适合 | CORS、压缩、日志、限流 | 参数校验、统一响应包装 |
| 粒度 | 全局 / 路径前缀 | 目前仅全局 |

**选型建议**：能用 Hono 中间件解决的，优先用中间件；只有在需要「按方法签名」区分处理时才使用拦截器。

## 📐 接口

```typescript
interface Interceptor<T = any, R = any> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<R> | Promise<Observable<R>> | Promise<R>;
}

interface ExecutionContext {
  /** 控制器类本身 */
  getClass(): any;
  /** 当前方法信息（注意：不是真实的方法引用，见下方注意事项） */
  getHandler(): any;
  /** 方法参数 */
  getArgs(): any[];
  getArgByIndex<T = any>(index: number): T;
  /** 切到 HTTP 视图，拿到原始 Hono Context / Request */
  switchToHttp(): HttpArgumentsHost;
}

interface HttpArgumentsHost {
  getRequest(): any;
  getResponse(): any;
}

interface CallHandler<T = any> {
  /** 调用链的下一环。最后一环会去解析参数并执行 controller 方法 */
  handle(): Observable<T> | Promise<T>;
}
```

## ✍️ 编写拦截器

```typescript
import type {
  CallHandler,
  ExecutionContext,
  Interceptor,
} from '@hestjs/core';
import { createLogger, Injectable } from '@hestjs/core';

const logger = createLogger('LoggingInterceptor');

@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const started = Date.now();

    try {
      return await next.handle();
    } finally {
      logger.info(
        `${request.method} ${request.url} -> ${handler.name} (${Date.now() - started}ms)`,
      );
    }
  }
}
```

### 统一响应包装

```typescript
@Injectable()
export class ResponseInterceptor implements Interceptor {
  async intercept(_context: ExecutionContext, next: CallHandler) {
    const started = Date.now();
    const data = await next.handle();

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - started}ms`,
    };
  }
}
```

## 🚀 注册

```typescript
const app = await HestFactory.create(new Hono(), AppModule);

// 注册顺序即执行顺序的外层到内层
app.useGlobalInterceptors(new ValidationInterceptor());
app.useGlobalInterceptors(new ResponseInterceptor());
```

## 🔀 执行顺序

```text
Hono 中间件
└─ 拦截器 1  前半
   └─ 拦截器 2  前半
      └─ 参数解析（@Body / @Param / @Query / @Context）
         └─ controller 方法
      ┌─ 拦截器 2  后半（next.handle() 返回之后）
   ┌─ 拦截器 1  后半
└─ 返回值处理
```

要点：

1. 按注册顺序**先进后出**，类似洋葱模型。
2. **参数解析发生在 `next.handle()` 内部**，而不是拦截器之前。因此拦截器可以包住参数解析与控制器调用。
3. 拦截器**可以选择不调用** `next.handle()`，从而短路整个处理流程。
4. 拦截器抛出的异常会继续向上传播，最终由[异常过滤器](./exception-filters)处理。

> ⚠️ 尚无 `@UseInterceptors()` 这类方法级装饰器，**目前只能全局注册**。见 [issue #5](https://github.com/aqz236/hestjs/issues/5)。

## ⚠️ 注意事项

### `getHandler()` 不是真实的方法引用

它返回的是 `{ name: '<方法名>' }` 形式的描述对象，只适合用来读取方法名或做日志标注，**不能调用**。

### `getArgs()` 目前恒为空数组

方法参数在 `next.handle()` 内部才被解析，此时拦截器已经拿到 `ExecutionContext`，因此 `getArgs()` 拿不到参数。需要在拦截器里访问参数时，可以从 `switchToHttp().getRequest()` 读取原始请求。

### 返回值会被统一序列化

拦截器返回的值会走与 controller 返回值相同的处理：

| 返回类型 | 响应 |
| --- | --- |
| `Response`（如 `c.json(...)`） | 原样返回，状态码保留 |
| 普通对象 | `c.json(result)` |
| 字符串 | `c.text(result)` |
| 其它 | `c.json({ data: result })` |

## 🔗 相关

- [异常过滤器](./exception-filters) —— 处理拦截器与控制器抛出的异常
- [验证系统](../techniques/validation) —— `ValidationInterceptor` 的实现基于本机制
