# 异常过滤器

异常过滤器（Exception Filter）用于集中处理请求处理过程中抛出的异常，把内部错误转换成对客户端友好的响应。

## 📐 接口

```typescript
interface ExceptionFilter<T = any> {
  catch(exception: T, host: ArgumentsHost): any;
}

interface ArgumentsHost {
  /** 原始 Hono Context */
  getContext(): Context;
  getRequest(): any;
  getResponse(): any;
}
```

## 🎯 捕获范围

过滤器包裹整个 handler，因此以下环节抛出的异常都会被捕获：

1. 拦截器（`intercept` 中抛出，且未自行处理）
2. 参数解析（`@Body` / `@Param` / `@Query` 等）
3. controller 方法

```text
try {
  拦截器链
    └─ 参数解析
       └─ controller 方法
} catch (error) {
  → 异常过滤器
}
```

## 🚨 内置异常

`@hestjs/core` 提供了一组 HTTP 异常，它们的 `status` 会直接作为响应状态码：

| 异常 | 状态码 |
| --- | --- |
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |
| `UnprocessableEntityException` | 422 |
| `InternalServerErrorException` | 500 |

```typescript
import { NotFoundException } from '@hestjs/core';

@Controller('/users')
export class UserController {
  @Get('/:id')
  findOne(@Param('id') id: string) {
    const user = this.usersService.findOne(Number(id));
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }
    return user;
  }
}
```

### 结构化错误详情

第一个参数可以是字符串，也可以是对象。对象中除 `message` 与 `error` 之外的字段会被收集到 `details`，一并出现在响应体里：

```typescript
throw new BadRequestException({
  message: '参数校验失败',
  error: 'VALIDATION_FAILED',
  field: 'email',
  reason: 'invalid format',
});
```

响应：

```json
{
  "statusCode": 400,
  "message": "参数校验失败",
  "error": "VALIDATION_FAILED",
  "details": { "field": "email", "reason": "invalid format" }
}
```

## ✍️ 自定义过滤器

```typescript
import type { ArgumentsHost, ExceptionFilter } from '@hestjs/core';
import { HttpException } from '@hestjs/core';

export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const c = host.getContext();

    return c.json(
      {
        statusCode: exception.status,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      },
      exception.status,
    );
  }
}
```

### 按异常类型分别处理

过滤器不会按异常类型自动匹配，需要在 `catch` 里自行判断：

```typescript
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const c = host.getContext();

    if (exception instanceof HttpException) {
      return c.json(exception.getResponse(), exception.status);
    }

    // 非预期异常：记录完整堆栈，但不向客户端泄露细节
    logger.error('Unhandled exception', exception as Error);
    return c.json({ statusCode: 500, message: 'Internal Server Error' }, 500);
  }
}
```

## 🚀 注册

```typescript
const app = await HestFactory.create(new Hono(), AppModule);

app.useGlobalFilters(new HttpExceptionFilter());
```

## 🔀 匹配规则

按注册顺序依次尝试，**第一个不抛错的结果胜出**：

```text
for (const filter of globalFilters) {
  try {
    return filter.catch(error, host);   // 成功即返回
  } catch { /* 换下一个 */ }
}
// 全部失败 → DefaultExceptionFilter
```

`DefaultExceptionFilter` 的兜底行为：

- `HttpException` → 使用其 `status`
- 其它任何抛出物（包括非 `Error`）→ 500

## ⚠️ 注意事项

- **只有全局过滤器**，没有控制器级 / 方法级过滤器
- 过滤器**不会**按异常类型自动筛选，需自行判断
- 使用 Hono 的 `onError` 或中间件处理异常也是受支持的，两种方式可以共存；
  但 `onError` 只在异常逃出 handler 后触发，而过滤器在 handler 内就已经接管

## 🔗 相关

- [拦截器](./interceptors) —— 异常的另一个来源
- [验证系统](../techniques/validation) —— 校验失败会抛出异常，由过滤器呈现
