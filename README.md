# HestJS

把 Hono 组织起来，而不是替掉它。

HestJS 只做一件事：让你用模块声明「谁依赖谁、谁在什么时候初始化」，
然后把依赖注入进去。**路由不是它的事**——路由就是 Hono 的路由。

## 三条硬规矩

**1. Hono 实例是唯一真相。**
`createApp()` 返回的 `app.hono` 就是 Hono 实例本身——没有包装、没有代理。
路由、中间件、`c.req.raw`、`c.var`、`c.header()` 全部照旧。

**2. 零反射依赖注入。**
不依赖 `reflect-metadata`，不依赖 `emitDecoratorMetadata`。
依赖写在 `@Inject()` 里，一眼可见，换任何打包器都不会在编译期静默失效。

**3. 装饰器只写元数据，不接管执行。**
`@Module()` / `@Injectable()` / `@Inject()` 只往表里写字，
而那些表就直接挂在类上，随时能读出来。

## 为什么不用装饰器定义路由

装饰器路由看起来更像 NestJS，但代价是**丢掉 Hono 的类型推导**：

```ts
const dynamic = new Hono();
dynamic.on('GET', '/users/:id', handler);
hc<typeof dynamic>('...').users[':id']   // ❌ 'client' is of type 'unknown'
```

链式注册才有类型，动态注册没有——这是 Hono 的设计。
而 `hc`（端到端 RPC 客户端）是 Hono 最值钱的能力。

所以 HestJS 把路由交回 Hono：

```ts
const app = createApp(AppModule, {
  routes: (hono, resolve) => {
    const users = resolve(UserController);
    return hono
      .get('/users', (c) => users.list(c))
      .get('/users/:id', (c) => users.detail(c));
  },
});

export type AppType = typeof app.hono;   // hc<AppType> 类型完整
```

代价只有一个：没有 `@Get('/:id')`。换来完整类型、零路径重复、零黑盒。

## 快速开始

```ts title="src/app.module.ts"
import type { Context, Env } from 'hono';
import { Inject, Module } from '@hestjs/core';

class GreetingService {
  greet(name: string): string {
    return `hello ${name}`;
  }
}

class GreetingController {
  constructor(@Inject(GreetingService) private readonly greeting: GreetingService) {}

  say(c: Context<Env, '/greet/:name'>): Response {
    return c.json({ message: this.greeting.greet(c.req.param('name')) });
  }
}

@Module({ providers: [GreetingService, GreetingController] })
export class AppModule {}

export { GreetingController };
```

```ts title="src/main.ts"
import { logger } from 'hono/logger';
import { createApp } from '@hestjs/core';
import { AppModule, GreetingController } from './app.module';

const app = createApp(AppModule, {
  // middleware 在路由之前执行
  middleware: [logger()],

  routes: (hono, resolve) => {
    const greeting = resolve(GreetingController);
    return hono
      .get('/health', (c) => c.text('ok'))
      .get('/greet/:name', (c) => greeting.say(c));
  },
});

app.hono.notFound((c) => c.json({ message: 'not found' }, 404));

await app.start();

export type AppType = typeof app.hono;
export default { port: Number(process.env.PORT ?? 3000), fetch: app.hono.fetch };
```

```bash
bun install
bun run --filter @hestjs/example dev
```

完整可运行版本见 [`apps/example`](./apps/example)。生成新应用：

```bash
bun run new my-app
bun install
bun run --filter @hestjs/my-app dev
```

## 模块作用域是真的

`imports` 会变成指向对方容器的 alias，`exports` 是唯一能借出去的东西。

```ts
@Module({ providers: [UserRepository], exports: [UserRepository] })
class DataModule {}

@Module({ imports: [DataModule], providers: [UserService] })
class UsersModule {}
```

把 `exports` 删掉，`createApp()` 会在**启动前**抛 `ProviderNotFoundError`——
不是运行时某个请求才炸。

以下问题全部在启动前报错，不会漏到运行期：

| 情况 | 错误 |
| --- | --- |
| 同一个模块里 provider 写了两遍 | `DuplicateProviderError` |
| 自己提供的 token 与 import 撞名 | `AmbiguousProviderError` |
| `exports` 了不存在的东西 | `UnresolvedExportError` |
| 模块 import 成环 | `ModuleCycleError`（带完整链路） |
| 构造参数少标 `@Inject()` | `MissingInjectError` |
| `overrides` 替换了不存在的 token | `UnknownOverrideError` |

## 生命周期

模块是纯声明，钩子挂在**有资源的东西**上：

```ts
class Postgres implements OnStart, OnStop {
  async onStart() { await this.pool.connect() }
  async onStop() { await this.pool.end() }
}
```

`app.start()` 先构造**全部**单例（构造错误在这一步集中暴露），
再按依赖顺序执行 `onStart()`；`app.stop()` 逆序执行 `onStop()`。

## 包

| 包 | 说明 | 必装 |
| --- | --- | --- |
| [`@hestjs/core`](./packages/core) | 模块、依赖注入、生命周期 | 是 |
| [`@hestjs/validation`](./packages/validation) | Standard Schema 请求校验 | 否 |
| [`@hestjs/openapi`](./packages/openapi) | OpenAPI 3.1 + Scalar UI | 否 |
| [`@hestjs/cqrs`](./packages/cqrs) | 三总线，纯 TS 不碰 web | 否 |
| [`@hestjs/testing`](./packages/testing) | 启动应用、替换 provider、发请求 | 否 |
| [`create-hest-app`](./packages/create-hest-app) | 最小生成器 | 否 |

插件之间互不依赖，都只依赖 `core`。

### `@hestjs/validation`

只认 [Standard Schema](https://github.com/standard-schema/standard-schema)，
底层是 Hono 官方的 `@hono/standard-validator`：

```ts
hono.post('/users',
  validate({ body: CreateUser, jsonSchema: { body: z.toJSONSchema(CreateUser) } }),
  (c) => users.create(c),
)
```

做成**中间件**而不是包装 handler——包装会破坏 Hono 的链式类型推导。

### `@hestjs/openapi`

```ts
app.hono.route('/', openApiRoutes({ hono: app.hono, info: { title: 'HestJS API', version: '1.0.0' } }));
// GET /openapi.json   GET /docs
```

只写它**真的知道**的东西：路由表、`validate()` 登记的 schema、`documented()` 里的说明。
猜不出来就不写。

### `@hestjs/cqrs`

三总线 + 装饰器，不依赖 web 层。handler 必须显式列出来——不扫目录、不建全局注册表。

### `@hestjs/testing`

```ts
const app = await createTestApp(AppModule, {
  routes,
  overrides: [{ provide: Database, useValue: new FakeDatabase() }],
});
```

`overrides` 只能替换本来就注册过的 token，写错名字立刻抛错。

## 仓库结构

```
packages/
├── core/                     # 模块、依赖容器、生命周期
├── validation/               # Standard Schema 校验
├── openapi/                  # OpenAPI 3.1 + Scalar UI
├── cqrs/                     # 三总线，纯 TS
├── testing/                  # 测试工具
├── create-hest-app/          # 最小生成器
├── typescript-config/        # 共享 tsconfig
└── eslint-config/            # 共享 ESLint 配置

apps/
├── example/                  # 完整示例
└── docs/                     # VitePress 文档站
```

所有包都是 `private`，不发布到 npm：通过 `workspace:*` 直接引用 TypeScript 源码，
没有构建步骤，改完即生效。

## 环境要求

- Bun >= 1.2（唯一运行时与包管理器）
- TypeScript >= 5.8
- 每个 tsconfig 必须显式打开 `experimentalDecorators`

> ⚠️ Bun 的转译器**不解析包名形式的 `extends`**。请用相对路径：
> `"extends": "../../packages/typescript-config/base.json"`。
> 漏掉 `experimentalDecorators` 会让装饰器元数据写不到表里，表现是静默失效。
>
> 不需要 `emitDecoratorMetadata`——Bun 支持它，但 HestJS 不用它，
> 因为 `@Inject()` 显式声明更可靠。

## 文档

https://aqz236.github.io/hestjs/

## 许可

[MIT](./LICENSE)
