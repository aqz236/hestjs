# ADR-0001：技术底座 —— Hono + Bun + TSyringe

- **状态**：Accepted
- **决策时间**：2025-07-27
- **初始提交**：[`f5639e7`](https://github.com/aqz236/hestjs/commit/f5639e7) `feat(core): implement HestJS core framework with dependency injection, routing, and application factory`

## 背景

项目起点需要选定三件事：HTTP 框架、运行时、依赖注入容器。当时的目标是「提供类似 NestJS 的开发体验，但更轻量、更高性能」。

## 决策

| 层 | 选型 | 替代方案 |
| --- | --- | --- |
| HTTP | **Hono** | Express、Fastify、ElysiaJS |
| 运行时 | **Bun** | Node.js、Deno |
| DI | **TSyringe** | 自研容器、InversifyJS |

## 理由

- **Hono**：轻量、类型友好、原生支持中间件与多运行时；后续「不封装 Hono」的取向（[ADR-0004](./0004-remove-over-abstraction.md)）正是建立在这一选型之上
- **Bun**：启动与构建速度是当时的主要卖点（文档中多次以「54ms 构建」为宣传点），且原生支持 TypeScript 与装饰器
- **TSyringe**：与 TypeScript 装饰器配合紧密，`@injectable()` 会读取 `design:paramtypes` 元数据，无需为每个构造参数手写 `@Inject`

## 后果

**正面**

- 三者组合使「装饰器 + DI + 轻量 HTTP」这一形态很快成型，07-27 一天内就跑通了核心链路

**负面 / 遗留**

- TSyringe 的两个装饰器行为不同，后来的 DI 缺陷正源于此（见 [ADR-0002](./0002-decorator-driven-api.md) 的「后续影响」）
- 运行时强绑定 Bun：`build` 脚本使用 `bun build`，`.npmrc`、`bun.lock` 等也随 Bun 的约定（后续单仓仍沿用 Bun workspaces）
- Hono 版本演进会带来类型破坏：`c.req.param()` 在新版返回 `string | undefined`，升级时需批量适配消费者

## 相关

- [ADR-0002 装饰器驱动的 API 形态](./0002-decorator-driven-api.md)
- [ADR-0004 移除过度封装](./0004-remove-over-abstraction.md)
