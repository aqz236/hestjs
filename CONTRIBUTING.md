# 贡献指南

## 环境准备

```bash
git clone https://github.com/aqz236/hestjs.git
cd hestjs
bun install
bun run check-types
bun run --filter @hestjs/example dev
```

需要 [Bun](https://bun.sh/) >= 1.2。这是本仓库唯一的运行时与包管理器。

## 仓库结构

- `packages/*` —— 框架本体与共享配置，**全部 `private`，不发布到 npm**
- `apps/*` —— 可运行的示例与站点
- `docs/` —— 设计稿

## 包与模块规则

### 不发布，直接引源码

所有 `package.json` 都是 `"private": true`，没有 `version` 语义、没有 `build` 步骤：

```json
{
  "exports": { ".": "./src/index.ts" },
  "scripts": { "check-types": "tsc --noEmit", "test": "bun test" }
}
```

改完源码立即生效，没有 `dist` 需要同步。

### tsconfig

两条必须遵守：

1. **`experimentalDecorators: true`**，同时**不要**开 `emitDecoratorMetadata`
2. **`extends` 用相对路径**，不要用包名

```json
{
  "extends": "../../packages/typescript-config/base.json"
}
```

原因：Bun 的转译器不解析包名形式的 `extends`。写成 `@hestjs/typescript-config/base.json`
时它读不到 `experimentalDecorators`，`@Get()` 会被当成 stage-3 标准装饰器，
签名不同，结果是一条路由都注册不上。`createApp()` 检测到这种情况会直接抛错。

### 依赖

| 场景 | 写法 |
| --- | --- |
| 依赖 `@hestjs/core` | `dependencies: { "@hestjs/core": "workspace:*" }` |
| 依赖 `hono` | `peerDependencies` 声明意图 + `devDependencies` 供本地开发 |

### 依赖注入

用 `static inject` 声明构造参数，不要引入反射：

```ts
@Injectable()
class UserService {
  static readonly inject = [Database, LOGGER] as const;

  constructor(
    private readonly db: Database,
    private readonly log: Logger,
  ) {}
}
```

## 提交前检查

```bash
bun run check-types
bun run test
```

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat(core): 容器支持 transient 作用域
fix(core): 修正 joinPath 对 '/:id' 的处理
docs: 补充中间件的执行顺序说明
```

`type` 常用值：`feat` / `fix` / `docs` / `refactor` / `perf` / `test` / `chore`。
`scope` 用包名（`core`、`example`）或 `repo`、`ci`、`deps`。

## 分支与 PR

- 从 `main` 拉分支，命名如 `feat/transient-scope`
- PR 描述里说明动机、改动范围与验证方式
- 破坏性改动请写清迁移方式

## 设计红线

改动前请先确认没有踩到这三条：

1. **不要把 Hono 实例藏起来。** 任何让用户拿不到 `app.hono` 的设计都不接受。
2. **不要引入反射。** 不引入 `reflect-metadata`，不开 `emitDecoratorMetadata`。
3. **不要新增运行时抽象层。** 能直接用 Hono 的 `Context` 就不要再包一层。

## 报告问题

请用 [Issue](https://github.com/aqz236/hestjs/issues)，附最小复现、期望与实际行为、`bun --version`。

## 许可证

贡献的代码将以 [MIT](./LICENSE) 许可发布。
