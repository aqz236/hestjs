# ADR-0004：移除过度封装 —— 删除拦截器与异常过滤器

- **状态**：**Superseded by [ADR-0005](./0005-restore-interceptors-and-filters.md)**
- **决策时间**：2025-07-30 15:18
- **决策提交**：[`a4d7f2b`](https://github.com/aqz236/hestjs/commit/a4d7f2b) `🔄 重大重构: 移除过度封装，提供最大灵活性`

## 背景

核心框架在 07-27 一天内实现了完整的异常处理与拦截器系统（[`9350d93`](https://github.com/aqz236/hestjs/commit/9350d93)）。到 07-30，作者认为这层抽象「包装了 Hono」，与「基于 Hono 的 OOP 框架」这一目标不符。

## 原始决策

删除 565 行，把抽象层交还给 Hono：

```
packages/core/src/interceptors/interceptor.ts        -154
packages/core/src/exceptions/exception-filter.ts      -88
packages/core/src/exceptions/http-exception.ts        -92
packages/core/src/exceptions/base-exception.ts        -43
packages/core/src/interceptors/index.ts                 -1
packages/core/src/exceptions/index.ts                   -3
packages/core/src/index.ts                              -2   导出去掉了
```

同时移除 `app.useGlobalFilters()` 与 `app.hono()`，并引入新的工厂签名：

```typescript
// 旧
const app = await HestFactory.create(AppModule);
const hono = app.hono();

// 新
const hono = new Hono();
const app = await HestFactory.create(hono, AppModule);
```

提交信息中列出的理由：最大灵活性、零抽象层、原生体验、简化架构。

## 后果（当时未察觉）

这次重构**只改了 core，没有同步消费方**。以下代码在重构后立刻处于编译不过的状态，并一直持续到 2026-10-05：

- `packages/validation/src/interceptors/validation.interceptor.ts` —— 仍从 `@hestjs/core` 导入 `Interceptor` / `ExecutionContext` / `CallHandler`
- `apps/hestjs-demo` 的 `ResponseInterceptor` 与 `HttpExceptionFilter`
- `apps/playground`、`packages/cqrs/examples` 仍使用 `HestFactory.create(Module)` 与 `app.hono()`
- core 的 README 被同步改为「用 Hono 中间件替代」，但**文档站与 demo 仍在宣传拦截器功能**

此外，删除的核心能力中有一部分**无法**用 Hono 中间件替代：参数级 DTO 校验依赖 `ExecutionContext.getClass()` / `getHandler()` 定位方法并读取其上的参数装饰器元数据，而中间件只持有路径。这一点在 [ADR-0005](./0005-restore-interceptors-and-filters.md) 中被确认并推翻。

## 保留的部分

新工厂签名 `HestFactory.create(honoApp, moduleClass)` 与统一使用 `getHonoInstance()`（不再恢复 `app.hono()`）是**正确的改进**，在 ADR-0005 中被保留。

## 相关

- [ADR-0005 恢复拦截器与异常过滤器](./0005-restore-interceptors-and-filters.md) —— 推翻本决策
- [ADR-0009 横切能力的边界](./0009-cross-cutting-boundaries.md)
