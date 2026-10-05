# ADR-0009：横切能力的边界 —— 中间件 / 拦截器 / 异常过滤器

- **状态**：Accepted
- **决策时间**：2026-10-05
- **相关提交**：
  - [`0650014`](https://github.com/aqz236/hestjs/commit/0650014) 恢复拦截器与异常过滤器
  - [`0178ffa`](https://github.com/aqz236/hestjs/commit/0178ffa) `feat(core): 实现 @UseMiddleware() 装饰器`

## 背景

框架里存在三种横切能力，历史上它们的职责边界一直不清晰：

- 原生 Hono 中间件
- 自建拦截器 / 异常过滤器（曾被删除又恢复，见 [ADR-0004](./0004-remove-over-abstraction.md) / [ADR-0005](./0005-restore-interceptors-and-filters.md)）
- `@UseMiddleware()` 声明式中间件（2026-10 新增）

边界不清导致过两次判断失误：`a4d7f2b` 认为拦截器可用中间件替代而删除；后续又发现替代不了。

## 决策

按**「能否拿到方法信息」**划分边界：

| | 注册方式 | 能拿到 | 典型用途 |
| --- | --- | --- | --- |
| Hono 全局中间件 | `app.getHonoInstance().use(...)` | 路径、请求上下文 | CORS、压缩、限流 |
| `@UseMiddleware()` | 控制器类 / 方法装饰器 | 路径、请求上下文 | 鉴权、请求 ID、缓存 |
| 拦截器 | `app.useGlobalInterceptors(...)` | 控制器类、**方法名**、请求上下文 | 参数校验、统一响应包装 |
| 异常过滤器 | `app.useGlobalFilters(...)` | 抛出的异常、请求上下文 | 错误响应整形 |

**选型原则**：能用中间件解决的用中间件；**只有需要按方法签名区分处理时**才使用拦截器。

## 执行顺序

```text
Hono 全局中间件
└─ @UseMiddleware 类级         ← 声明顺序，先进后出
   └─ @UseMiddleware 方法级
      └─ 全局拦截器（按注册顺序）
         └─ 参数解析（@Body / @Param / @Query / @Context）
            └─ controller 方法
         ┌─ 拦截器回程
      ┌─ 方法级中间件回程
   ┌─ 类级中间件回程
└─ 返回值序列化
抛错 → 全局异常过滤器（按注册顺序，全部未命中则回退 DefaultExceptionFilter）
```

要点：

1. **参数解析发生在 `next.handle()` 内部**，而不是拦截器之前 —— 因此拦截器可以包住参数解析与控制器调用，也可以选择短路
2. 中间件注册在 Hono 层，因此**天然位于拦截器之外**
3. 中间件里 `await next()` 之后的代码在拦截器与控制器之后执行

## 理由

- 三者本质区别在于**持有多少信息**。方法级元数据是拦截器独有的能力，也是参数级 DTO 校验的唯一实现路径
- 中间件是 Hono 的原生概念，声明式挂载（`@UseMiddleware`）只是糖，不引入新的运行时语义
- 异常过滤器与拦截器共用同一套「面向方法」的上下文，合并到同一条链上比拆开更简单

## 后果

**正面**

- 三种能力各司其职，`a4d7f2b` 那类误判有了明确的判断依据
- `@UseMiddleware` 让鉴权、请求 ID 这类需求不必挤进全局中间件

**负面 / 遗留**

- **拦截器只能全局注册**，尚无 `@UseInterceptors()` 方法级装饰器
- **异常过滤器只有全局的**，没有控制器级 / 方法级，也**不按异常类型自动匹配**，需在 `catch` 中自行判断
- `ExecutionContext.getHandler()` 返回 `{ name }` 描述对象而非真实方法引用；`getArgs()` 恒为空数组
- 中间件是运行时执行的，**不受容器依赖注入**；需要依赖时请从 `c.get(...)` 或闭包获取

## 相关

- [ADR-0004 移除过度封装](./0004-remove-over-abstraction.md)
- [ADR-0005 恢复拦截器与异常过滤器](./0005-restore-interceptors-and-filters.md)
- [中间件](https://aqz236.github.io/hestjs/docs/fundamentals/middleware) · [拦截器](https://aqz236.github.io/hestjs/docs/fundamentals/interceptors) · [异常过滤器](https://aqz236.github.io/hestjs/docs/fundamentals/exception-filters)
