# ADR-0005：恢复拦截器与异常过滤器

- **状态**：Accepted（**Supersedes [ADR-0004](./0004-remove-over-abstraction.md)**）
- **决策时间**：2026-10-05
- **决策提交**：[`0650014`](https://github.com/aqz236/hestjs/commit/0650014) `feat(core): 实现模块作用域，exports 成为真实边界`（同一批修复中恢复）

## 背景

[ADR-0004](./0004-remove-over-abstraction.md) 以「零抽象层」为由删除了拦截器与异常过滤器。但几个月后回头审视，发现：

1. 消费方从未同步修改 —— `@hestjs/validation`、两个 demo 都仍在导入这些类型
2. core 的 README 被改为「用 Hono 中间件替代」，但**文档站与 README 仍在宣传拦截器功能**，形成自相矛盾
3. 最关键：**其中一部分能力无法用中间件替代**

## 决策

**恢复拦截器与异常过滤器**，同时保留 ADR-0004 引入的新工厂签名。

## 理由

### 拦截器不能删

`@hestjs/validation` 的核心能力是**参数级 DTO 校验**：

```typescript
@Post('/')
create(@Body(CreateUserDto) dto: CreateUserDto) {}
```

它需要 `ExecutionContext.getClass()` 与 `getHandler()` 定位到具体 controller 方法，再读取该方法上的参数装饰器元数据。**Hono 中间件只持有路径，拿不到「即将执行的是哪个方法」**，因此在纯中间件模型下无法实现。

### 异常过滤器的取舍

单纯把一个异常转换成 HTTP 响应，确实可以用 Hono 的 `onError` 或中间件完成，这部分 ADR-0004 的判断是成立的。但保留自建过滤器能与拦截器共用同一套「面向方法」的上下文，且实现已在 git 历史中，恢复成本低于重写。

### 不是新增抽象

恢复的内容全部来自 `a4d7f2b^`，属于从历史取回，而非新造 API。

## 实施

- 取回 `a4d7f2b^` 的 6 个文件与 `router-explorer.ts`（其后无任何改动，可安全取回）
- `HestApplicationInstance` 恢复 `useGlobalFilters` / `useGlobalInterceptors` / `getGlobalFilters` / `getGlobalInterceptors`
- **不恢复** `app.hono()` —— 统一使用 `getHonoInstance()`
- `HestFactory.create(honoApp, moduleClass)` 保持 ADR-0004 的新签名，仅补回两行 `setGlobal*()` 接线
- 消费方适配：`apps/hestjs-demo`、`apps/playground`、`packages/cqrs/examples` 改用新工厂签名

## 后果

**正面**

- 参数级 DTO 校验恢复可用
- core、validation 与两个 demo 的编译状态重新一致

**负面 / 遗留**

- `ExecutionContext.getHandler()` 返回的是 `{ name: '<方法名>' }` 描述对象，**不是真实的方法引用**，不能调用
- `getArgs()` 目前恒为空数组（参数在 `next.handle()` 内部才解析）
- 异常过滤器**不按异常类型自动匹配**，需在 `catch` 中自行判断
- 尚无控制器级 / 方法级过滤器

## 验证

恢复后以真实请求验证：`GET /users/999` 正确返回 `404`（此前因另一缺陷返回 `200 {}`）。

## 相关

- [ADR-0004 移除过度封装](./0004-remove-over-abstraction.md)
- [ADR-0009 横切能力的边界](./0009-cross-cutting-boundaries.md)
- [拦截器文档](https://aqz236.github.io/hestjs/docs/fundamentals/interceptors)
