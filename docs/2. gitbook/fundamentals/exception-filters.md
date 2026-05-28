# 🚨 异常过滤器

异常过滤器用于捕获和处理应用中的错误，统一异常响应格式。

## 基本用法

定义异常过滤器：

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@hestjs/core';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // 统一异常响应
    return {
      status: exception.getStatus(),
      message: exception.message,
    };
  }
}
```

注册全局过滤器：

```typescript
import { Application } from '@hestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const app = new Application(AppModule);
app.useGlobalFilters(new HttpExceptionFilter());
```

## 应用场景

- 统一错误响应格式
- 日志采集与错误追踪

> 🚨 异常过滤器让你的 API 错误处理更优雅、更安全。

---

下一步：深入数据验证系统。
