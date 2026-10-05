# ADR-0006：拆分为 13 个独立仓库

- **状态**：**Superseded by [ADR-0007](./0007-consolidate-into-monorepo.md)**
- **决策时间**：2025-07-27 – 07-30
- **相关提交**：各包仓库的首个提交，例如
  [`0937b42`](https://github.com/aqz236/hestjs/commit/0937b42)（validation）、`6397f05`（logger）

## 背景

核心框架在 07-27 成型后，需要决定包的物理组织方式：单仓多包，还是每个包一个仓库。

## 原始决策

**每个包一个独立仓库**，共 13 个：

```
hest             Turborepo 骨架（create-turbo 生成）
hestjs           实为 @hestjs/demo 演示应用
hestjs-core      @hestjs/core
hestjs-cqrs      @hestjs/cqrs
hestjs-validation
hestjs-scalar
hest-logger
hestjs-docs
hestjs-typescript-config
hestjs-eslint-config
create-hest-app
hestjs-cqrs-demo
flow-orchestrator   独立项目，非本生态
```

同时用 `hest` 仓库尝试把它们以 **submodule** 的方式组织起来。

## 理由（推断）

独立仓库便于各包单独发布到 npm、单独设置 CI，也符合早期开源项目「一包一仓」的常见做法。

## 后果

**正面**

- 各包可独立发布，npm 上确实发布了 7 个 `@hestjs/*` 包与 `create-hest-app`

**负面 / 致命**

1. **`hest` 的 submodule 结构是坏的**
   `packages/` 下 7 个包 + `packages/shared/` 下 2 个全是 gitlink，但仓库**没有 `.gitmodules`**。任何人 `git clone` 后这些目录为空、无法构建；其 `.github/workflows/deploy-docs.yml` 引用的路径也不存在，CI 必然失败。

2. **跨包改动成本极高**
   一次涉及 core 的改动要同步 13 个仓库的依赖版本，产生 13 次提交与发布。

3. **版本漂移**
   `@hestjs/validation` 仓库内为 `0.1.3`，而 npm 上已发布 `0.1.5` —— 无法确定 npm 上的代码对应哪个提交状态。

4. **零工程化**
   13 个仓库中仅 `hest` 有 1 个 workflow；全部 0 Release、0 tag、0 topic，11 个无 LICENSE。

5. **核心框架的「主仓」实际不存在**
   名为 `hestjs` 的仓库装的是 demo 应用，框架本身没有主仓。

## 结局

这 13 个仓库最终被合并为单仓（[ADR-0007](./0007-consolidate-into-monorepo.md)），并在合并后**全部归档**，README 顶部加了指向 monorepo 的迁移提示。

## 相关

- [ADR-0007 合并为 Turborepo 单仓多包](./0007-consolidate-into-monorepo.md)
- [MIGRATION.md](../../../MIGRATION.md) —— 逐项记录了 13 仓的现状与缺陷
