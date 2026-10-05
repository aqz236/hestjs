# HestJS

把 Hono 组织起来，而不是替掉它。

HestJS 不提供自己的请求/响应抽象，不接管你的服务器，也不把 Hono 实例藏起来。
它只做一件事：让你用模块和装饰器声明「谁依赖谁、哪个方法响应哪个路径」，
然后把这些声明翻译成普通的 `hono.get()` / `hono.post()`。

## 三条硬规矩

**1. Hono 实例是唯一真相。**
`createApp()` 返回的 `app.hono` 就是 Hono 实例本身——没有包装、没有代理。
`hono.route()`、`hono.use()`、`c.req.raw`、`c.var`、`c.header()` 全部照旧。

**2. 零反射依赖注入。**
不依赖 `reflect-metadata`，不依赖 `emitDecoratorMetadata`。
依赖写在 `static inject` 里，一眼可见；换成任何打包器都不会在编译期静默失效。

**3. 装饰器只写元数据，不接管执行。**
`@Module()` / `@Controller()` / `@Get()` 只往几张表里写字。
真正的组装发生在 `createApp()`，而那几张表你可以直接读出来看。

## 快速开始

```ts
import type { Context } from 'hono';
import { logger } from 'hono/logger';
import { Controller, Get, Injectable, Module, createApp } from '@hestjs/core';

@Injectable()
class GreetingService {
  greet(name: string): string {
    return `hello ${name}`;
  }
}

@Controller('/greet')
class GreetingController {
  static readonly inject = [GreetingService] as const;

  constructor(private readonly greeting: GreetingService) {}

  @Get('/:name')
  say(c: Context<Env, '/greet/:name'>): Response {
    return c.json({ message: this.greeting.greet(c.req.param('name')) });
  }
}

@Module({ providers: [GreetingService], controllers: [GreetingController] })
class AppModule {}

const app = createApp(AppModule, {
  // configure 在控制器之前执行，中间件才能包住它们
  configure(hono) {
    hono.use(logger());
  },
});

// app.hono 就是 Hono，想加什么加什么
app.hono.get('/health', (c) => c.text('ok'));

export default { port: 3000, fetch: app.hono.fetch };
```

完整可运行版本见 [`apps/example`](./apps/example)：

```bash
bun install
bun run --filter @hestjs/example dev
```

生成一个新的应用：

```bash
bun run new my-app
bun install
bun run --filter @hestjs/my-app dev
```

生成器只吐三个源文件，不扫目录、不弹交互、不带会腐坏的模板。


## 模块作用域是真的

`imports` 会变成指向对方容器的 alias，`exports` 是唯一能借出去的东西。

```ts
@Module({ providers: [UserRepository], exports: [UserRepository] })
class DataModule {}

@Module({ imports: [DataModule], providers: [UserService], controllers: [UserController] })
class UsersModule {}
```

`UserService` 看得见 `UserRepository`，因为 `DataModule` 把它 export 了。
把 `exports: [UserRepository]` 删掉，`createApp()` 会在启动前直接抛
`ProviderNotFoundError`——不是运行时某个请求才炸。

**这是隔离，不是覆盖。** 两个模块各自提供同名 token 互不干扰；一个模块
既 import 又自己提供同一个 token，直接报 `AmbiguousProviderError`。

以下问题全部在**启动前**报错，不会漏到运行期：

| 情况 | 错误 |
| --- | --- |
| 同一个模块里 provider 写了两遍 | `DuplicateProviderError` |
| 自己提供的 token 与 import 撞名 | `AmbiguousProviderError` |
| `exports` 了不存在的东西 | `UnresolvedExportError` |
| 模块 import 成环 | `ModuleCycleError` |
| 两条路由撞在一起 | `DuplicateRouteError` |

## 生命周期

模块是纯声明，钩子挂在**有资源的东西**上：

```ts
@Injectable()
class Postgres implements OnStart, OnStop {
  async onStart() { await this.pool.connect() }
  async onStop() { await this.pool.end() }
}
```

`app.start()` 会先构造**全部**单例（构造错误在这一步集中暴露），
再按依赖顺序执行 `onStart()`；`app.stop()` 逆序执行 `onStop()`。

## 路由类型

动态注册拿不到 Hono 的路径推导。把完整路径写成类型参数就能找回来：

```ts
@Get('/:id')
detail(c: RouteContext<'/users/:id'>): Response {
  const id = c.req.param('id');  // string
  return c.json({ id });
}
```

`createApp<Env>()` 也带泛型，`c.set()` / `c.get()` 的类型跟着走。

## 仓库结构

```
packages/
├── core/                     # 模块声明、依赖容器、Hono 接线
├── validation/               # Standard Schema 校验（可选）
├── openapi/                  # OpenAPI 3.1 + Scalar UI（可选）
├── cqrs/                     # 三总线，纯 TS 不碰 web（可选）
├── testing/                  # 测试工具：启动应用、替换 provider（可选）
├── typescript-config/        # 共享 tsconfig
└── eslint-config/            # 共享 ESLint 配置

apps/
├── example/                  # 完整示例：作用域、生命周期、校验、文档
└── docs/                     # Docusaurus 文档站
```

`core` 是唯一的必装项。另外三个都是可选插件，各自独立，互不依赖
（`openapi` 会读 `validation` 登记的元数据，但也只有这一条边）。

所有包都是 `private`，不发布到 npm：`@hestjs/core` 通过 `workspace:*` 直接引用
TypeScript 源码，没有构建步骤，改完即生效。

## 可选插件

三个插件都建立在同一套扩展点上：**路由级中间件**。core 只提供
`addRouteMiddleware()`，其余一律由插件自己实现，core 不知道它们存在。

### `@hestjs/validation`

只认 [Standard Schema](https://github.com/standard-schema/standard-schema)，
不绑定任何校验库——zod / valibot / arktype 都能用：

```ts
import { z } from 'zod';
import { Body, type InferInput, type ValidatedBody } from '@hestjs/validation';

const CreateUser = z.object({ name: z.string().min(1) });
type CreateUserInput = InferInput<typeof CreateUser>;

@Post('/')
@Body(CreateUser, { jsonSchema: z.toJSONSchema(CreateUser) })
create(c: RouteContext<'/users', ValidatedBody<CreateUserInput>>): Response {
  const input = c.req.valid('json');
  return c.json({ name: input.name }, 201);
}
```

底层就是 Hono 的 `validator()`，所以 `c.req.valid('json')` 是原生的那套。
不做隐式类型转换：query 里全是字符串，要数字就自己写 `z.coerce.number()`。

### `@hestjs/openapi`

```ts
const app = createApp(AppModule);
app.hono.route('/', openApiRoutes({
  graph: app.graph,
  info: { title: 'HestJS API', version: '1.0.0' },
}));
// GET /openapi.json   GET /docs（Scalar UI）
```

只写它**真的知道**的东西：路由表、校验装饰器登记的 schema、`@Describe` 里的说明。
裸的 `hono.get()` 路由没有元数据可读，文档里就不会出现它。

### `@hestjs/cqrs`

三总线 + 装饰器，不依赖 web 层。handler 必须显式列出来——不扫目录、不建全局注册表：

```ts
@Module({
  providers: [...cqrs({
    commands: [CreateUserHandler],
    queries: [GetUserHandler],
    events: [NotifyOnUserCreated, AuditOnUserCreated],
  })],
})
class UserModule {}
```

## 从 NestJS 借的是什么

只有两样：**模块化的心智模型**，和**声明式的开发体验**。

- 模块、provider、controller、生命周期钩子
- 构造函数注入的写法（但依赖是显式的，不是反射推断的）

## 刻意不做的事

| 不做 | 用什么代替 |
| --- | --- |
| 自己的 Request / Response 抽象 | Hono 的 `Context`，控制器方法第一个参数就是它 |
| 自己的路由匹配 | `hono.on()` / `hono.all()`，注册完你就能在 `app.hono.routes` 里看到 |
| 自己的校验 | Hono 的 `validator()`，或任何 Standard Schema 实现 |
| 自己的日志 | 任何中间件；`apps/example` 里用的是 `hono/logger` |
| 全局注册表 | 元数据直接挂在类上：`SomeController[ROUTES_META]` |
| `emitDecoratorMetadata` | `static inject` |
| 发布到 npm | `workspace:*` 直接引源码 |

## 环境要求

- Bun >= 1.2（唯一运行时与包管理器）
- TypeScript >= 5.8
- 每个 tsconfig 必须显式打开 `experimentalDecorators`

> ⚠️ Bun 的转译器**不解析包名形式的 `extends`**（`@hestjs/typescript-config/base.json`）。
> 请用相对路径：`"extends": "../../packages/typescript-config/base.json"`。
> 漏掉 `experimentalDecorators` 时，`@Get()` 会被当成 stage-3 标准装饰器处理，
> 结果是一条路由都注册不上——`createApp()` 会直接抛错告诉你怎么修。

## 许可

[MIT](./LICENSE)
