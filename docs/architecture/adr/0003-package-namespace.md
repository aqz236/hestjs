# ADR-0003：包命名空间 `@hest` → `@hestjs`

- **状态**：Accepted
- **决策时间**：2025-07-27
- **相关提交**：[`7ebdd4d`](https://github.com/aqz236/hestjs/commit/7ebdd4d) `refactor(代码): 将包名从 @hest 改为 @hestjs`
- **后继影响**：`07-28` 的早期提交中仍可见 `@hest` 残留（如 `chore: 项目更名`）

## 背景

项目最早以 `hest` 命名（仓库 `aqz236/hest`、包作用域 `@hest`）。在 07-27 一天之内经历了两次命名调整。

## 决策

统一为 **`@hestjs`** 作用域，仓库与文档中的产品名统一写作 **HestJS**。

## 理由

- 避免与既有 npm 包名冲突，便于在 npm 上以 `@hestjs/*` 统一发布
- 产品名 `HestJS` 与作用域 `@hestjs` 一致，文档与代码中的称呼不再分裂

## 后果

**正面**

- 后续所有包（`core`、`cqrs`、`validation`、`scalar`、`logger`、`typescript-config`、`eslint-config`）都挂在同一作用域下，发布与检索统一

**负面 / 遗留**

- **仓库名与包名长期错位**：包作用域是 `@hestjs`，但仓库一度叫 `hest`；而名为 `hestjs` 的仓库里装的其实是 `@hestjs/demo` 演示应用。这一错位直到 2026-10-05 单仓合并时才理清 —— `aqz236/hestjs` 成为 monorepo 主仓（[ADR-0007](./0007-consolidate-into-monorepo.md)）
- 旧包名 `@hest` 在部分历史提交与文档中残留，检索时需同时尝试两种写法

## 相关

- [ADR-0007 合并为 Turborepo 单仓多包](./0007-consolidate-into-monorepo.md)
- [MIGRATION.md](../../../MIGRATION.md) —— 记录了「仓库名与包名错位」的完整排查过程
