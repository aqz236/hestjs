# 🛡️ 拦截器

拦截器用于在请求处理前后执行自定义逻辑，如响应格式化、日志记录等。

## 基本用法

定义拦截器：

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@hestjs/core';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // 在请求处理前后自定义逻辑
    return next.handle().then(data => ({ success: true, data }));
  }
}
```

注册全局拦截器：

```typescript
import { Application } from '@hestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

const app = new Application(AppModule);
app.useGlobalInterceptors(new ResponseInterceptor());
```

## 应用场景

- 统一响应结构
- 日志采集
- 性能监控

> 🛡️ 拦截器让你的请求处理流程更灵活、更可控。

---

下一步：了解 HestJS 异常过滤器机制。
