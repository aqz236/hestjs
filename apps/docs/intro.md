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
`@Module()` / `@Controller()` / `@Get()` 只往几张表里写字，而那些表就直接挂在类上：

```ts
SomeController[ROUTES_META]   // 随时读，不是黑盒
```

## 包地图

| 包 | 作用 | 是否必装 |
| --- | --- | --- |
| `@hestjs/core` | 模块声明、依赖容器、Hono 接线 | 是 |
| `@hestjs/validation` | Standard Schema 请求校验 | 否 |
| `@hestjs/openapi` | OpenAPI 3.1 + Scalar UI | 否 |
| `@hestjs/cqrs` | 三总线，纯 TS 不碰 web | 否 |

插件之间互不依赖，都只依赖 `core`。

## 刻意不做的事

| 不做 | 用什么代替 |
| --- | --- |
| 自己的 Request / Response 抽象 | Hono 的 `Context`，控制器方法第一个参数就是它 |
| 自己的路由匹配 | `hono.on()` / `hono.all()`，注册完就能在 `app.hono.routes` 里看到 |
| 自己的校验 | 任何 Standard Schema 实现，或 Hono 自带的 `validator()` |
| 自己的日志 | 任何中间件，例如 `hono/logger` |
| 全局注册表 | 元数据直接挂在类上 |
| `emitDecoratorMetadata` | `static inject` |
| 发布到 npm | `workspace:*` 直接引源码 |

## 从 NestJS 借的是什么

只有两样：**模块化的心智模型**，和**声明式的开发体验**。

模块、provider、controller、生命周期钩子、构造函数注入的写法——都借来了。
但依赖是显式的，不是反射推断出来的；容器不包装 Hono，只往上面挂路由。

下一步：[快速开始](./getting-started.md)。
