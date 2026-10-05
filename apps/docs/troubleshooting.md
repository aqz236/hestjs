# 排障

## `NoRoutesRegisteredError`：控制器一个路由都没注册

```
检测到 2 个控制器（UserController, HealthController），但一条路由都没注册。
```

这是最常见的一个，原因基本只有一个：

**tsconfig 缺 `experimentalDecorators`。** 没有它，`@Get()` 会被当成
stage-3 标准装饰器处理，签名完全不同，元数据写到了别处。

而且有一个连锁坑：**Bun 的转译器不解析包名形式的 `extends`**。

```json
// ❌ Bun 读不到，experimentalDecorators 不生效
{ "extends": "@hestjs/typescript-config/base.json" }

// ✅ 用相对路径
{ "extends": "../../packages/typescript-config/base.json" }
```

`tsc` 两种都能读，所以类型检查会通过、运行时却挂——这就是为什么
`createApp()` 要专门为它准备一条错误信息。

## `ProviderNotFoundError`

```
UserRepository 在这层容器里不可见。
```

按顺序检查：

1. 它写进某个模块的 `providers` 了吗
2. 提供它的模块把它写进 `exports` 了吗
3. 当前模块 `imports` 了那个模块吗

三条缺一条都拿不到。这是设计如此，不是 bug。

## `AmbiguousProviderError`

```
UsersModule 既从 imports 里拿到 UserService，又自己提供了它。
```

本地 provider 和 import 撞名了。二选一：改掉 import，或者改掉本地 provider 的名字。

NestJS 允许本地覆盖 import，这里直接报错——**provider 的顺序不该决定谁生效**。

## `ModuleCycleError`

```
模块 import 成环：A → B → A。拆掉其中一条边。
```

通常意味着两个模块共享了不该共享的东西。把公共部分下沉到第三个模块，
让 A 和 B 都 import 它。

## `DuplicateRouteError`

```
GET /users 被注册了两次。
```

两个控制器的完整路径撞了。注意 `@Controller('/users')` + `@Get('/')` 和
`@Controller('/')` + `@Get('/users')` 是同一条路由。

## `TS2377: Constructors for derived classes must contain a 'super' call`

继承 `Command` / `Query` / `Event` 的消息类，构造函数里要调 `super()`：

```ts
class CreateUser extends Command<string> {
  constructor(readonly name: string) {
    super();
  }
}
```

tsc 会拦住，不会留到运行时。

## 中间件没包住控制器

`configure()` 在控制器挂载**之前**跑。写在 `createApp()` 返回之后的
`app.hono.use()` 就包不住已挂载的控制器路由了。中间件放 `configure` 里。

## 文档里少了几条路由

`@hestjs/openapi` 只收录走控制器的路由。裸的 `hono.get()` 没有元数据可读，
文档里就不会出现——这是诚实，不是遗漏。要收录就把它写成控制器方法。

## 还是找不到原因

把这三样贴进 issue：

```ts
console.log(app.hono.routes);   // 实际注册了什么
console.log(app.graph.modules); // 模块图长什么样
```

`META` 常量也能直接读，例如 `UserController[ROUTES_META]`。
框架没有藏起来的东西。
