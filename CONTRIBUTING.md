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

- `packages/*` —— 会发布到 npm 的包（库与 CLI，`@hestjs/*` 或无 scope 的包名）
- `apps/*` —— 私有应用，一律 `private: true`，不发布
- `docs/` —— 框架设计文档

判断标准只有一条：**会不会发布到 npm**。会发布的放 `packages/`，不发布的放 `apps/`。

### 依赖声明规则

| 场景 | 写在哪 | 版本写法 |
| --- | --- | --- |
| 宿主框架 `@hestjs/core`（插件/扩展包） | `peerDependencies` | `workspace:^` |
| 同上一项，仅为本地开发与测试 | `devDependencies` | `workspace:*` |
| 其他内部包 | `dependencies` | `workspace:*` |
| 纯 tsconfig 预设（通过 `extends` 使用） | `devDependencies` | `workspace:*` |

`@hestjs/core` 绝不能进 `dependencies`：它由使用方提供，写进 `dependencies` 会装出第二份容器实例，
导致装饰器注册的 provider 与业务代码解析到的容器不是同一个。

### 新增包检查清单

- `package.json` 的 `repository` 带 `directory` 字段
- `publishConfig.access` 为 `public`
- `files` 字段包含实际产物（`dist` 等）与 `README.md`
- 涉及 `apps/` 的包一律补 `private: true`

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

## 测试与评审

- 新增行为请配单元测试，测试文件与被测源码同目录，命名为 `*.test.ts`
- 修缺陷时优先写一个能复现的测试，再改实现；这样回归时能立刻发现
- 测试配置见仓库根目录的 `vitest.shared.mts`，说明见
  `docs/2. gitbook/techniques/testing.md`
- PR 上的 `Check changeset` 步骤会拦住「改了 `packages/*` 但没写 changeset」
  的情况，本地可以先跑 `node scripts/check-changeset.mjs` 自查
- 评审只要求两件事：行为变化有测试覆盖，公开 API 的变化有 changeset 与文档

## 报告问题

请使用 [Issue](https://github.com/aqz236/hestjs/issues)，并尽量附上：

- 最小可复现示例
- 期望行为与实际行为
- `bun --version` 与复现所用版本

## 许可证

贡献的代码将以 [MIT](./LICENSE) 许可发布。
