# Monorepo 重构记录

本文档记录 HestJS 生态从 13 个分散仓库整合为 Turborepo 单仓多包的过程、依据与遗留问题。

- **重构执行时间**：2026-10-05
- **原始历史**：保留在 git 历史中，所有者为 `aqz236`，提交日期保持 2025-07 原样
- **备份**：`~/Developer/data/hestjs-mirrors/`（13 个 `--mirror` 克隆）

---

## 1. 重构前的状态

### 1.1 仓库清单

| 仓库 | 最后提交 | 提交数 | 说明 |
| --- | --- | --- | --- |
| `hest` | 2025-07-30 | 31 | Turborepo 骨架（`create-turbo` 生成），`packages/*` 全为 submodule |
| `hestjs` | 2025-07-29 | 41 | 实为 `@hestjs/demo` 演示应用 |
| `hestjs-core` | 2025-07-30 | 20 | `@hestjs/core@0.2.0` |
| `hestjs-cqrs` | 2025-07-30 | 13 | `@hestjs/cqrs@0.1.5` |
| `hestjs-validation` | 2025-07-28 | 1 | `@hestjs/validation@0.1.3` |
| `hestjs-scalar` | 2025-07-30 | 9 | `@hestjs/scalar@0.1.6` |
| `hest-logger` | 2025-07-28 | 12 | `@hestjs/logger@0.1.5` |
| `hestjs-docs` | 2025-07-30 | 16 | Docusaurus 文档站 |
| `hestjs-typescript-config` | 2025-07-27 | 1 | 共享 tsconfig |
| `hestjs-eslint-config` | 2025-07-27 | 1 | 共享 ESLint 配置 |
| `create-hest-app` | 2025-07-30 | 15 | 脚手架 |
| `hestjs-cqrs-demo` | 2025-07-28 | 13 | CQRS 示例 |
| `flow-orchestrator` | 2025-09-25 | 5 | **非 hest 生态，未并入** |

### 1.2 核心问题

1. **`hest` 的 monorepo 是坏的**：`packages/` 下 7 个包 + `packages/shared/` 下 2 个全是 gitlink，但仓库**没有 `.gitmodules`**。任何人 `git clone` 后这些目录为空，无法构建。其 `.github/workflows/deploy-docs.yml` 引用的 `packages/hestjs-docs/**` 路径也不存在，CI 必然失败。
2. **零工程化**：13 个仓库中仅 `hest` 有 1 个 workflow；全部 0 Release、0 tag、0 topic、11 个无 LICENSE。
3. **零测试**：除 `flow-orchestrator` 外没有任何测试文件。
4. **包版本漂移**：`@hestjs/validation` 仓库内为 `0.1.3`，npm 上已发布 `0.1.5`。

---

## 2. 重构后的结构

```
packages/
  core/               @hestjs/core            来自 hestjs-core
  cqrs/               @hestjs/cqrs            来自 hestjs-cqrs
  validation/         @hestjs/validation      来自 hestjs-validation
  scalar/             @hestjs/scalar          来自 hestjs-scalar
  logger/             @hestjs/logger          来自 hest-logger
  typescript-config/  @hestjs/typescript-config
  eslint-config/      @hestjs/eslint-config
apps/
  docs/               hestjs-docs             来自 hestjs-docs（Docusaurus）
  playground/         @hestjs/cqrs-demo       来自 hestjs-cqrs-demo
  create-hest-app/    create-hest-app         来自 create-hest-app
  hestjs-demo/        @hestjs/demo            来自 hestjs
docs/                中文设计文档 + gitbook   来自 hest
```

**依赖拓扑**（不变式：单向、无环）

```
logger  ← 叶子
core    → logger
cqrs    → core, logger
scalar  → core
validation → core
```

### 2.1 完成的工作

- [x] 13 个仓库全量 mirror 备份
- [x] `git filter-repo --to-subdirectory-filter` 逐仓并入，**保留全部原始提交历史与日期**
- [x] 清理 `hest` 遗留的失效 gitlink（`docs/1. hest框架设计/scalar/elysia-swagger`）
- [x] 根 `package.json` / `turbo.json` / `pnpm`→`bun` workspaces
- [x] 统一包元数据：`repository.directory`、`publishConfig.access=public`、`license`、`files`、`sideEffects`
- [x] 内部依赖统一为 `workspace:*`（plugin 包改为 peer + dev）
- [x] Changesets 版本发布体系（`.changeset/`）
- [x] CI（`ci.yml`）、Release（`release.yml`）、Docs 部署（`docs.yml`）、Dependabot
- [x] LICENSE (MIT)、`.editorconfig`、`.gitignore`
- [x] 恢复 core 的拦截器 / 异常过滤器系统并接回 router 管线（见 §4.1）
- [x] 消费方适配新工厂签名 `create(hono, Module)` + `getHonoInstance()`
- [x] 修复文档站构建（`webpackbar` 版本锁定）
- [x] `apps/wf-auth-svc` 抽离出仓（见 §4.3）

### 2.2 验收状态

```
bun run build        10/10 ✅
bun run check-types  15/15 ✅
bun run test          8/8  ✅
```

---

## 3. 重构过程中修复的历史缺陷

| # | 问题 | 位置 | 修复 |
| --- | --- | --- | --- |
| 1 | `tsconfig` extends 到不存在的 `../../tsconfig.json` | `packages/scalar`、`packages/validation` | 改为 `@hestjs/typescript-config/base.json` |
| 2 | 隐式依赖：import 了但未声明 | `packages/cqrs`、`apps/playground` 缺 `@hestjs/logger` | 补声明 |
| 3 | 构建产物 import 未声明的包 | `packages/scalar` 的 dist import `reflect-metadata` | 补进 dependencies |
| 4 | `@hestjs/core` 同时进 dependencies 与 peerDependencies | `packages/cqrs`、`packages/scalar` | 收敛为 peer + dev |
| 5 | `typescript-config` 的 `files` 不含实际产物 | `packages/typescript-config` | 改为 `["base.json","react.json"]` |
| 6 | `import.meta.dirname` 但未装 `@types/node` | `packages/eslint-config` | 补 `@types/node` |
| 7 | `noUnusedLocals` / `noUnusedParameters` 违规 | `packages/validation`、`packages/scalar` | 清理未使用导入与变量 |
| 8 | 演示应用直接 import `@sinclair/typebox` 未声明 | `apps/hestjs-demo`、`apps/playground` | 补声明 |
| 9 | 消费方仍用旧工厂签名 `create(Module)` 与已移除的 `app.hono()` | `apps/hestjs-demo`、`apps/playground`、`packages/cqrs/examples` | 改为 `create(hono, Module)` + `getHonoInstance()` |
| 10 | 调用已弃用的 `useScalarWithControllers()` | `apps/hestjs-demo` | 改用 `useSwagger()`（容器自动发现控制器） |
| 11 | `c.req.param()` 在新版 Hono 返回 `string \| undefined` | 3 个应用 + 6 个脚手架模板文件 | 非空断言 + `parseInt` 补 radix |
| 12 | `webpackbar` 6.0.1 与 webpack 5.111 不兼容（`this.options` 覆盖父类导致 webpack schema 校验失败） | 文档站构建 | 根 `overrides` 锁定 `webpackbar@^7.0.0` |

---

## 4. 已决策事项与遗留问题

### 4.1 【已解决】core 的拦截器 / 异常过滤器系统

提交 `a4d7f2b 🔄 重大重构: 移除过度封装，提供最大灵活性` 删除了 565 行，其中包含 core 的公开 API：

```
packages/core/src/interceptors/interceptor.ts        -154
packages/core/src/exceptions/exception-filter.ts      -88
packages/core/src/exceptions/http-exception.ts        -92
packages/core/src/exceptions/base-exception.ts        -43
packages/core/src/interceptors/index.ts                 -1
packages/core/src/exceptions/index.ts                   -3
packages/core/src/index.ts                              -2  （导出去掉了）
```

同一次提交还把 core 的 README 改为「拦截器系统 / 全局异常过滤器 —— 使用 Hono 中间件替代」。

**决策：恢复拦截器与异常过滤器，同时保留该次重构引入的新工厂签名。**

理由：

1. **异常处理**确实可以用 Hono 的 `onError` / 中间件替代，这部分重构是成立的。
2. 但**拦截器不能**。`@hestjs/validation` 的核心能力是按方法签名的参数级 DTO 校验
   （`@Body(UserDto) updateDto: UserDto`）：它需要 `context.getClass()` 与
   `context.getHandler()` 定位到具体 controller 方法，再读取该方法上的参数装饰器元数据。
   Hono 中间件只持有路径，拿不到「即将执行的是哪个方法」，因此这一能力在纯中间件模型下
   无法实现。
3. 两个 demo 与 `@hestjs/validation` 均依赖该 API，恢复属于从 git 历史取回既有实现，
   而非新造抽象。

**实施内容：**

- 取回 `a4d7f2b^` 的 6 个文件与 `router-explorer.ts`（其后无任何改动，可安全取回）
- `HestApplicationInstance` 恢复 `useGlobalFilters` / `useGlobalInterceptors` /
  `getGlobalFilters` / `getGlobalInterceptors`；**不恢复 `hono()`**，统一使用 `getHonoInstance()`
- `HestFactory.create(honoApp, moduleClass)` 保持重构后的新签名，仅补回两行
  `routerExplorer.setGlobal*()` 接线

### 4.2 【遗留】`hestjs-docs` 与 Node 24

Docusaurus 3.8.1 在 Node 24 下会因 `webpackbar` 与 webpack 版本不兼容而构建失败，已通过
根 `overrides` 锁定 `webpackbar@^7.0.0` 解决（见 §3 第 12 项）。本机 Node 24 下已验证可构建
（en + zh-CN 双语），CI 中未额外固定 Node 版本。

### 4.3 【已处理】`apps/wf-auth-svc` 移出

该应用 package.json 描述为 "A HestJS application"，但依赖 `@develop-x/nest-response`，
构建时因缺少 `class-validator` / `class-transformer`（`@nestjs/common` 的传递依赖）失败，
更可能属于 `flow-orchestrator` 项目。

已用 `git filter-repo --subdirectory-filter` 抽取为独立仓库并保留其提交历史：

```
~/Developer/data/hestjs-mirrors/wf-auth-svc-extracted.git
```

随后从 monorepo 移除。后续可将其推入 `flow-orchestrator` 或独立建仓。

### 4.4 【更正】`@hestjs/scalar` 的 prototype 取值**不是**缺陷

本文档早期版本曾判断下述代码有运行时缺陷：

```ts
const HestApplicationInstancePrototype =
  require("@hestjs/core").HestApplicationInstance.prototype;
```

该判断**有误**。`HestApplicationInstance` 是由 `packages/core/src/application/hest-application.ts`
导出的**类**（而非 `interfaces/application.ts` 中的 `HestApplication` 接口）。
已验证 `require('@hestjs/core').HestApplicationInstance` 在运行时为 `function`，
`.prototype` 取值正常。此处无需修改。

### 4.5 【遗留】其他

- `@hestjs/validation` 仓库版本为 `0.1.3`，落后于 npm 已发布的 `0.1.5`，需确认以哪一侧为准。
- 13 个旧仓库的处置（保留 / archive / 删除）未定。
- monorepo 尚无测试覆盖：除 `@hestjs/eslint-config` 与 `create-hest-app` 使用
  `node --test` 外，其余包无测试。
- `packages/logger/assets/`、`apps/hestjs-demo/assets/` 与 `apps/docs/docs/getting-started/assets/`
  存在重复的大图（各约 3MB），可考虑收敛。
