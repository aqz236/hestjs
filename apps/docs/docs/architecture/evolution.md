# 架构演进

HestJS 的架构不是一次设计出来的，中间经历过两次明确的方向反转。本页是索引；完整的决策记录（ADR）在仓库里：

📁 **[docs/architecture/](https://github.com/aqz236/hestjs/tree/main/docs/architecture)**

## 时间线

| 时间 | 阶段 | 关键产出 |
| --- | --- | --- |
| 2025-07-27 | **核心成型** | DI 容器、装饰器、路由、异常与拦截器、验证模块、logger |
| 2025-07-28 | **模块与生态** | CQRS 模块、Scalar/OpenAPI、gitbook 文档体系 |
| 2025-07-29 | **文档与站点** | README 体系、文档站首页与 i18n |
| 2025-07-30 | **容器与自动发现** | 逻辑容器、应用钩子、CQRS 与 Scalar 自动发现 |
| 2025-07-30 | **重大重构** | `a4d7f2b` 移除过度封装，删除拦截器与异常过滤器 |
| 2025-07-30 | **单仓合并** | 13 个分散仓库合并为 Turborepo 单仓多包 |
| 2026-10-05 | **架构补完** | 模块作用域落地、拦截器恢复、测试体系、`@UseMiddleware` |

## 两次「推翻自己」

**1. 拦截器与异常过滤器：删掉又恢复**

`a4d7f2b` 以「零抽象层、完全交给 Hono」为由删除了 565 行，但：

- 消费方（`@hestjs/validation`、两个 demo）从未同步修改
- 最关键：参数级 DTO 校验需要 `ExecutionContext.getClass()` / `getHandler()` 定位到**方法**并读取其上的参数装饰器元数据，而 **Hono 中间件只持有路径**，拿不到「即将执行的是哪个方法」

结论：这部分抽象无法用中间件替代，因此恢复。但该次重构引入的新工厂签名 `HestFactory.create(hono, Module)` 是正确改进，予以保留。

**2. 仓库拆分：拆了又合**

拆成 13 个独立仓库后，跨包改动需要 13 次提交与发布，还出现了版本漂移（仓库 `0.1.3` vs npm `0.1.5`）。更糟的是，用来组织它们的 `hest` 仓库把各包挂成了 **submodule 却没有 `.gitmodules`** —— 克隆下来 `packages/` 全是空目录，CI 必然失败。

## 当前架构

```text
请求
 └─ Hono 全局中间件
    └─ @UseMiddleware 类级中间件
       └─ @UseMiddleware 方法级中间件
          └─ 全局拦截器
             └─ 参数解析（@Body / @Param / @Query / @Context）
                └─ controller 方法
             ┌─ 拦截器回程
          ┌─ 方法级中间件回程
       ┌─ 类级中间件回程
    └─ 返回值序列化
抛错 → 全局异常过滤器（按注册顺序，回退 DefaultExceptionFilter）
```

模块系统中，每个模块拥有独立子容器，`imports` 与 `exports` 是**真实生效**的可见性边界；越权依赖会在**启动时**报错，而不是运行期静默成功。

## 三条边界原则

1. **中间件 vs 拦截器**：按「能否拿到方法信息」划分。能用中间件解决的用中间件，只有需要按方法签名区分处理时才用拦截器。
2. **模块作用域必须显式校验**：子容器只建立结构，TSyringe 会直接构造未注册的类，所以依赖可见性需要 `validateModuleDependencies` 静态检查兜底。
3. **单例容器是已知约束**：`Container` 与 `ApplicationHooks` 均为单例，同一进程内多次 `HestFactory.create()` 会互相影响。

## 相关

- [完整 ADR 记录](https://github.com/aqz236/hestjs/tree/main/docs/architecture)
- [迁移说明](../migration/refactor-changes)
- [中间件](../fundamentals/middleware) · [拦截器](../fundamentals/interceptors) · [异常过滤器](../fundamentals/exception-filters)
