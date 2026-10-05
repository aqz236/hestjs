# 排障

## `MissingInjectError`：构造参数少标了 `@Inject()`

```
UserService 的第 1 个构造参数没有 @Inject()。
```

每个构造参数都要标。忘了会**在启动时**报错，不会留到运行时。

给参数一个默认值可以让它变成可选：

```ts
constructor(
  @Inject(Repository) private readonly repository: Repository,
  private readonly retries = 3,          // 有默认值，不用标
) {}
```

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

## `UnknownOverrideError`

```
测试替身 'typo' 没有对应的真实 provider。
```

`overrides` 只能替换本来就注册过的 token，不能凭空新增——
否则测试会通过，线上却少一个依赖。

## `experimentalDecorators` 漏掉的症状

装饰器元数据写不到表里，表现是**静默失效**：模块图是空的、
依赖注入找不到 provider，或者 `hono.routes` 里少了东西。

而且有一个连锁坑：**Bun 的转译器不解析包名形式的 `extends`**。

```json
// ❌ Bun 读不到，experimentalDecorators 不生效
{ "extends": "@hestjs/typescript-config/base.json" }

// ✅ 用相对路径
{ "extends": "../../packages/typescript-config/base.json" }
```

`tsc` 两种都能读，所以类型检查会通过、运行时却挂。

> 顺带澄清一个常见误解：**Bun 是支持 `emitDecoratorMetadata` 的**。
> HestJS 不用它，是因为依赖用 `@Inject()` 显式声明更可靠（换打包器不会静默失效），
> 不是因为 Bun 做不到。

## 中间件没包住路由

`middleware` 在 `routes` 之前执行。写在 `createApp` 之后的 `app.hono.use()`
就包不住已经注册的路由了。中间件放 `middleware` 里。

## `hc<AppType>` 拿到 `unknown`

说明路由不是链式注册的。检查 `routes` 的返回值：

```ts
// ✅ 返回链式结果
routes: (hono, resolve) => hono.get('/users', handler)

// ❌ 忘了 return，或者用了动态注册
routes: (hono) => { hono.on('GET', '/users', handler); }
```

`hc` 只能看到链式注册贡献的类型。

## `hc<AppType>` 的响应是 `unknown`

十有八九是给控制器方法标了返回类型：

```ts
detail(c: Context<Env, '/users/:id'>): Response {   // ← 去掉 `: Response`
  return c.json({ id: '1' });
}
```

`c.json()` 的类型信息被 `: Response` 擦掉了，Hono 推不出响应结构。
**参数类型可以标，返回类型不要标。**

## 全栈应用里 `document` 找不到

前端和服务端要分开检查：

```json title="tsconfig.json"
{ "include": ["src/**/*"], "exclude": ["node_modules", "dist", "src/web"] }
```

```json title="tsconfig.web.json"
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"], "types": ["bun"] }
}
```

服务端项目的 lib 里没有 DOM，如果 `src/web` 落进去，`document` 就会找不到。

前端 tsconfig 也继承了同一份预设 —— 因为它 `import type { AppType } from '../main'`
会把服务端文件一起检查，而服务端用了 `@Inject`，需要 `experimentalDecorators`。

## SPA 回退把 API 也吞了

```ts
// ❌ /api/nope 会返回一张 HTML
app.hono.get('*', serveStatic({ root: DIST, path: '/index.html' }));

// ✅ 把 /api/* 排除掉
app.hono.get('*', async (c, next) => {
  if (c.req.path.startsWith('/api/')) {
    await next();
    return;
  }
  return serveStatic({ root: DIST, path: '/index.html' })(c, next);
});
```

另外 `serveStatic` 要 `root` + **相对 root** 的 `path`，绝对 `path` 不生效
（会静默 404）。

## 文档里少了几条路由

`@hestjs/openapi` 只收录真实路由。裸的 `app.hono.use()` 注册出来的通配条目
（`ALL /*`）会被跳过——它们不是路由。

## 还是找不到原因

把这三样贴进 issue：

```ts
console.log(app.hono.routes);      // 实际注册了什么
console.log(app.graph.modules);    // 模块图长什么样
console.log(app.container.tokens()); // 容器里有哪些 token
```

元数据也能直接读，例如 `UserController[MODULE_META]`。
框架没有藏起来的东西。
