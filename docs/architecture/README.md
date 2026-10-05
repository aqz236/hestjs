# 架构演进记录

本目录记录 HestJS 的架构是如何一步步走到今天的：**每个决策由哪个提交做出、为什么、后来是否被推翻**。

这些内容此前只存在于 git 历史里 —— 29 份 `docs/1. hest框架设计/` 与 `docs/2. gitbook/` 的设计文档写的是「打算怎么做」，代码是「最后做成什么样」，**中间怎么演变、为什么改，没有留下任何记录**。本目录补的就是这一段。

> 本记录基于真实的提交历史整理，写于 2026-10-05。每条 ADR 都标注了对应决策的**原始提交**，
> 其中 2025-07 的决策均可直接在 `git log` 中查到。

## 时间线

| 时间 | 阶段 | 提交数 | 关键产出 |
| --- | --- | ---: | --- |
| 2025-07-27 09:43 – 23:26 | **核心成型** | 12 | DI 容器、装饰器、路由、异常与拦截器、验证模块、logger、包名定为 `@hestjs` |
| 2025-07-28 | **模块与生态** | 56 | CQRS 模块、Scalar/OpenAPI、gitbook 文档体系、demo 应用 |
| 2025-07-29 | **文档与站点** | 26 | README 体系、文档站首页与 i18n |
| 2025-07-30 09:33 – 11:27 | **容器与自动发现** | 42 | 逻辑容器概念、应用钩子、CQRS 自动发现、Scalar 自动发现 |
| 2025-07-30 15:18 | **重大重构** | — | `a4d7f2b` 移除过度封装，删除拦截器与异常过滤器 |
| 2025-07-30 18:00 – 20:38 | **单仓合并** | 12 | 13 个分散仓库合并为 Turborepo 单仓多包 |
| 2026-10-05 | **架构补完** | 11 | 模块作用域落地、拦截器恢复、测试体系、`@UseMiddleware` |

## 两次「推翻自己」

演进中最值得记录的不是新增，而是**两次明确的方向反转**：

1. **拦截器与异常过滤器：删掉又恢复**（[ADR-0004](./adr/0004-remove-over-abstraction.md) → [ADR-0005](./adr/0005-restore-interceptors-and-filters.md)）
   `a4d7f2b` 以「零抽象层」为由删除，但消费方从未同步修改，且参数级 DTO 校验**无法**用 Hono 中间件替代 —— 因为中间件拿不到「即将执行的是哪个方法」。

2. **仓库拆分：拆了又合**（[ADR-0006](./adr/0006-split-into-separate-repos.md) → [ADR-0007](./adr/0007-consolidate-into-monorepo.md)）
   拆成 13 个独立仓库后，跨包改动需要 13 次提交与发布，且版本漂移（`@hestjs/validation` 仓库为 `0.1.3`、npm 上已是 `0.1.5`）。单仓多包是纠正。

## 当前架构

```text
请求
 └─ Hono 全局中间件（app.getHonoInstance().use）
    └─ @UseMiddleware 类级中间件          ← ADR-0009
       └─ @UseMiddleware 方法级中间件
          └─ 全局拦截器                    ← ADR-0005
             └─ 参数解析（@Body/@Param/@Query/@Context）
                └─ controller 方法
             ┌─ 拦截器回程
          ┌─ 方法级中间件回程
       ┌─ 类级中间件回程
    └─ 返回值序列化
 抛错 → 全局异常过滤器（按注册顺序，回退 DefaultExceptionFilter）
```

模块系统方面，每个模块拥有独立的子容器，`imports` 与 `exports` 是**真实生效**的可见性边界（[ADR-0008](./adr/0008-module-scoping.md)）。

## ADR 索引

| 编号 | 标题 | 状态 | 决策时间 |
| --- | --- | --- | --- |
| [0001](./adr/0001-tech-foundation.md) | 技术底座：Hono + Bun + TSyringe | Accepted | 2025-07-27 |
| [0002](./adr/0002-decorator-driven-api.md) | 装饰器驱动的 API 形态 | Accepted | 2025-07-27 |
| [0003](./adr/0003-package-namespace.md) | 包命名空间 `@hest` → `@hestjs` | Accepted | 2025-07-27 |
| [0004](./adr/0004-remove-over-abstraction.md) | 移除过度封装：删除拦截器与异常过滤器 | **Superseded by 0005** | 2025-07-30 |
| [0005](./adr/0005-restore-interceptors-and-filters.md) | 恢复拦截器与异常过滤器 | Accepted | 2026-10-05 |
| [0006](./adr/0006-split-into-separate-repos.md) | 拆分为 13 个独立仓库 | **Superseded by 0007** | 2025-07-30 |
| [0007](./adr/0007-consolidate-into-monorepo.md) | 合并为 Turborepo 单仓多包 | Accepted | 2025-07-30 |
| [0008](./adr/0008-module-scoping.md) | 模块作用域：`imports`/`exports` 真实生效 | Accepted | 2026-10-05 |
| [0009](./adr/0009-cross-cutting-boundaries.md) | 横切能力的边界：中间件 / 拦截器 / 异常过滤器 | Accepted | 2026-10-05 |

## 遗留的设计债务

以下问题在演进中被记录但尚未解决，详见各 issue：

- `@hestjs/validation` 的仓库版本与 npm 已发布版本不一致（[#3](https://github.com/aqz236/hestjs/issues/3)）
- 尚无控制器级 / 方法级异常过滤器，也**不按异常类型自动匹配**（[ADR-0009](./adr/0009-cross-cutting-boundaries.md)）
- `ExecutionContext.getHandler()` 返回的是 `{ name }` 描述对象而非真实方法引用（[ADR-0005](./adr/0005-restore-interceptors-and-filters.md)）
- 测试覆盖仍不均衡：`packages/core` 的 `metadata/` 与 `utils/` 覆盖率偏低（[#2](https://github.com/aqz236/hestjs/issues/2)）

## 相关文档

- [2025 年设计文档](../1.%20hest框架设计/nest架构.md) —— 当时的原始设计稿
- [Gitbook 文档体系](../2.%20gitbook/hestjs-gitbook-design.md) —— 2025 年编写的概念文档
- [MIGRATION.md](../../MIGRATION.md) —— 13 仓合并为单仓的过程与逐项缺陷清单
