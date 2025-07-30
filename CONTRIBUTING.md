# 贡献指南

感谢你对 HestJS 的兴趣。本仓库是 Turborepo 单仓多包结构，贡献前请先阅读以下约定。

## 环境准备

```bash
git clone https://github.com/aqz236/hestjs.git
cd hestjs
bun install
bun run build
```

需要 [Bun](https://bun.sh/) >= 1.2。

## 仓库结构

- `packages/*` —— 会发布到 npm 的库（`@hestjs/*`）
- `apps/*` —— 不发布的演示应用与脚手架
- `docs/` —— 框架设计文档

新增包时请在 `packages/` 下创建，并确保：

- `package.json` 的 `repository` 带 `directory` 字段
- `publishConfig.access` 为 `public`
- 内部依赖使用 `workspace:*`
- 插件类包把 `@hestjs/core` 放在 `peerDependencies`（`workspace:^`）而非 `dependencies`

## 提交前检查

以下命令必须全部通过，CI 会执行同样的检查：

```bash
bun run check-types
bun run build
bun run test
```

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat(core): 新增 @UseMiddleware 装饰器
fix(validation): 修正 UUID 校验对 nil UUID 的处理
docs(core): 补充拦截器执行顺序说明
chore(deps): 升级 hono 到 4.9
```

`type` 常用值：`feat` / `fix` / `docs` / `refactor` / `perf` / `test` / `chore`。
`scope` 用包名（`core`、`cqrs`、`validation`、`scalar`、`logger`）或 `ci`、`deps`、`monorepo`。

## 发布流程

本仓库用 [Changesets](https://github.com/changesets/changesets) 管理版本。

改动影响到 `packages/*` 的行为时，**必须**附带一个 changeset：

```bash
bun run changeset
```

选择受影响的包与语义化版本级别（`patch` / `minor` / `major`），写一段面向使用者的说明。
生成的 `.changeset/*.md` 需要一并提交。

合入 `main` 后，Release workflow 会：

1. 自动创建/更新「chore(release): 发布新版本」的 PR，汇总所有 changeset
2. 该 PR 合并后构建并发布新版本到 npm

## 分支与 PR

- 从 `main` 拉分支，命名如 `feat/use-middleware`、`fix/uuid-validation`
- PR 描述里说明动机、改动范围与验证方式
- 行为变更请补充测试；仓库目前测试覆盖不足（见 issue #2），欢迎一并补齐

## 报告问题

请使用 [Issue](https://github.com/aqz236/hestjs/issues)，并尽量附上：

- 最小可复现示例
- 期望行为与实际行为
- `bun --version` 与复现所用版本

## 许可证

贡献的代码将以 [MIT](./LICENSE) 许可发布。
