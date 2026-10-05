# ADR-0007：合并为 Turborepo 单仓多包

- **状态**：Accepted（**Supersedes [ADR-0006](./0006-split-into-separate-repos.md)**）
- **决策时间**：2025-07-30 18:00（实际合并完成于 2026-10-05）
- **相关提交**：
  - [`8f8c073`](https://github.com/aqz236/hestjs/commit/8f8c073) `chore(monorepo): 13 个分散仓库合并为 Turborepo 单仓多包`
  - `a3fdf40`、`d68b1d4` 等 12 个并入提交（其父提交是被 `git filter-repo` 重写路径后的各包完整历史）

## 背景

[ADR-0006](./0006-split-into-separate-repos.md) 的 13 仓结构在实践中有三个无法回避的问题：跨包改动需要 13 次提交、版本漂移（仓库 `0.1.3` vs npm `0.1.5`）、以及 `hest` 仓库的 submodule 结构**克隆即坏**（9 个 gitlink 却没有 `.gitmodules`）。

## 决策

合并为**单一 Turborepo 仓库**，命名为 `aqz236/hestjs` —— 让这个名字第一次真正指向框架主仓。

## 目标结构

```text
packages/   core  cqrs  validation  scalar  logger  typescript-config  eslint-config
apps/       docs  playground  create-hest-app  hestjs-demo
docs/       中文设计文档与 gitbook
```

依赖拓扑保持单向无环：

```
logger  ← 叶子
core    → logger
cqrs    → core, logger
scalar  → core
validation → core
```

## 关键约束：必须保留各包的原始历史

由于 `aqz236/hestjs` 是要替换掉的真实仓库，合并时必须让各包的提交历史完整成为子孙提交，而不是压成一次导入。做法：

```bash
git filter-repo --to-subdirectory-filter packages/core
git merge --allow-unrelated-histories
```

12 个包各自并入后，最终以一个 12 父提交的整合提交收口，因此 2025-07 的全部开发历史都作为祖先保留。

## 工程化补齐

合并同时补上了 13 仓时代完全缺失的部分：

- Bun workspaces + Turborepo 任务管道
- Changesets 版本与发布体系
- CI / Release / Docs 部署 / Dependabot
- 统一 LICENSE、EditorConfig、gitignore
- 内部依赖统一 `workspace:*`（插件包改为 peer + dev）

## 后果

**正面**

- 跨包改动回归单次提交
- 版本由 Changesets 统一管理，消除漂移
- 文档站、demo、包源码在同一仓库，改一处即可整体验证

**负面 / 遗留**

- **合并过程中暴露出大量历史缺陷**：`scalar`/`validation` 的 tsconfig 指向不存在的路径、`cqrs`/`playground` 隐式依赖 `@hestjs/logger` 未声明、`core` 同时进 dependencies 与 peerDependencies、`typescript-config` 的 `files` 不含实际产物等，共 12 项，详见 [MIGRATION.md](../../../MIGRATION.md)
- **`@hestjs/validation` 的版本基准问题仍未解决**：仓库内 `0.1.3`、npm 上 `0.1.5`，究竟是「已发布但未提交」还是「仅版本号跳变」尚未确认（[#3](https://github.com/aqz236/hestjs/issues/3)）
- 13 个旧仓库已归档，但历史 issue 与 PR 无法自动迁移

## 相关

- [ADR-0006 拆分为 13 个独立仓库](./0006-split-into-separate-repos.md)
- [MIGRATION.md](../../../MIGRATION.md)
