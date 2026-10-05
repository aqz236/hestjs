# 贡献指南

## 环境准备

```bash
git clone https://github.com/aqz236/hestjs.git
cd hestjs
bun install
bun run check-types
bun run test
bun run --filter @hestjs/example dev
```

需要 [Bun](https://bun.sh/) >= 1.2。这是本仓库唯一的运行时与包管理器。

## 仓库结构

- `packages/*` —— 框架本体与可选插件，**全部 `private`，不发布到 npm**
  - `core` 是唯一必装项
  - `validation` / `openapi` / `cqrs` / `schedule` / `queue` / `testing` 是可选包，
    只能依赖 `core`，彼此之间不要互相依赖
  - 能用 Hono 官方生态件就别自己写：校验用的是 `@hono/standard-validator`
- `apps/*` —— 可运行的示例与站点
  - 新增应用用 `bun run new <name>`，别手抄
  - 文档站在 `apps/docs`，不再有单独的 `docs/` 目录

新插件必须建立在 core 暴露的扩展点上（目前是 `addRouteMiddleware()`），
不要让 `core` 反过来认识插件。

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

1. **`experimentalDecorators: true`**（不需要 `emitDecoratorMetadata`）
2. **`extends` 用相对路径**，不要用包名

```json
{
  "extends": "../../packages/typescript-config/base.json"
}
```

原因：Bun 的转译器不解析包名形式的 `extends`。写成 `@hestjs/typescript-config/base.json`
时它读不到 `experimentalDecorators`，装饰器会被当成 stage-3 标准装饰器，
签名不同，结果是一条路由都注册不上。`createApp()` 检测到这种情况会直接抛错。

### 依赖

| 场景 | 写法 |
| --- | --- |
| 依赖 `@hestjs/core` | `dependencies: { "@hestjs/core": "workspace:*" }` |
| 依赖 `hono` | `peerDependencies` 声明意图 + `devDependencies` 供本地开发 |

### 依赖注入

用 `@Inject()` 声明每个构造参数，不要引入反射：

```ts
class UserService {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(LOGGER) private readonly log: Logger,
  ) {}
}
```

少标一个会在启动时抛 `MissingInjectError`。给参数一个默认值可以让它变成可选。

### 模块边界

一个模块一个容器。`imports` 变成 alias，`exports` 是唯一能借出去的东西：

- 需要别人用的 provider，**必须**写进 `exports`
- 只在本模块用，就别 export——这样别人想误用会立刻报错
- 不要靠 `imports` 去拿别人的内部实现；拿不到是设计如此

图校验全部前置到 `createApp()`，下面这些会在启动前直接抛错：
重复 provider、与 import 撞名、`exports` 了不存在的东西、模块成环、路由撞车。

### 生命周期

不要往模块上挂钩子。资源类实现 `OnStart` / `OnStop`：

```ts
@Injectable()
class Redis implements OnStart, OnStop {
  onStart(): void { this.connect() }
  onStop(): void { this.disconnect() }
}
```

`app.start()` 先构造全部单例，再按依赖顺序跑 `onStart()`；`stop()` 逆序。

### 测试

用 `bun test`，测试文件与被测源码同目录，命名 `*.test.ts`。
不需要容器也能测 HTTP：`createApp()` 之后直接 `app.hono.request('/path')`。

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
2. **不要引入反射。** 不引入 `reflect-metadata`，不开 `emitDecoratorMetadata`——依赖靠 `@Inject()` 显式声明。
3. **不要新增运行时抽象层。** 能直接用 Hono 的 `Context` 就不要再包一层。
4. **不要包装路由 handler。** 包装会让 Hono 的链式类型推导失效，
   进而毁掉 `hc<typeof app.hono>`。需要横切逻辑就用中间件。

## 报告问题

请用 [Issue](https://github.com/aqz236/hestjs/issues)，附最小复现、期望与实际行为、`bun --version`。

## 许可证

贡献的代码将以 [MIT](./LICENSE) 许可发布。
