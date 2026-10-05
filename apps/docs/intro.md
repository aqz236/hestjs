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

装饰器路由看起来更像 NestJS，但它有一个致命代价：

```ts
// 动态注册会摧毁 Hono 的类型推导
const dynamic = new Hono();
dynamic.on('GET', '/users/:id', handler);
const client = hc<typeof dynamic>('...');
client.users[':id']   // ❌ 'client' is of type 'unknown'
```

**Hono 最值钱的能力是端到端类型推导**（`hc` RPC 客户端）。
链式注册才有类型，动态注册没有——这是 Hono 的设计，不是实现细节。

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

代价只有一个：没有 `@Get('/:id')`。换来的是完整类型、零路径重复、零黑盒。

## 包地图

| 包 | 作用 | 是否必装 |
| --- | --- | --- |
| `@hestjs/core` | 模块、依赖注入、生命周期 | 是 |
| `@hestjs/validation` | Standard Schema 请求校验 | 否 |
| `@hestjs/openapi` | OpenAPI 3.1 + Scalar UI | 否 |
| `@hestjs/cqrs` | 三总线，纯 TS 不碰 web | 否 |
| `@hestjs/schedule` | 声明式定时任务（cron / interval / timeout） | 否 |
| `@hestjs/queue` | 后台任务：processor 声明 + 可替换 driver | 否 |
| `@hestjs/testing` | 启动应用、替换 provider、发请求 | 否 |

插件之间互不依赖，都只依赖 `core`。`openapi` 读的是 core 定义的元数据契约，
不是 `validation` 的导出。

## 刻意不做的事

| 不做 | 用什么代替 |
| --- | --- |
| 路由抽象 | Hono 的 `hono.get()` / `hono.post()` |
| 自己的 Request / Response | Hono 的 `Context`，控制器方法第一个参数就是它 |
| 自己的校验 | Standard Schema（zod / valibot / arktype），底层是 `@hono/standard-validator` |
| 自己的日志 | 任何 Hono 中间件，例如 `hono/logger` |
| 全局注册表 | 元数据直接挂在类上 |
| 扫描式动态模块 | `dynamicModule()`，显式、可组合、按引用去重 |
| `emitDecoratorMetadata` | `@Inject()` |
| 发布到 npm | `workspace:*` 直接引源码 |

下一步：[快速开始](./getting-started.md)。
