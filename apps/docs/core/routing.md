# 路由

**HestJS 没有自己的路由系统。** 路由就是 Hono 的路由。

```ts
const app = createApp(AppModule, {
  routes: (hono, resolve) => {
    const users = resolve(UserController);

    return hono
      .get('/users', (c) => users.list(c))
      .get('/users/:id', (c) => users.detail(c))
      .post('/users', (c) => users.create(c));
  },
});
```

`routes` 收到两个东西：

- `hono` —— Hono 实例（已经装好 `middleware`）
- `resolve` —— 容器解析函数，用它把 provider 拿进来

返回的链式 Hono 决定了 `app.hono` 的类型。

## 为什么这么设计

Hono 的类型推导是**链式**的：每次 `.get()` 返回一个新的、带路由信息的类型。
动态注册（`hono.on(method, path, handler)`）不贡献任何类型信息。

```ts
// 链式：类型完整
const a = new Hono().get('/users/:id', (c) => c.json({ id: c.req.param('id') }));
hc<typeof a>('x').users[':id'].$get({ param: { id: '1' } });   // ✅

// 动态：类型全丢
const b = new Hono();
b.on('GET', '/users/:id', (c) => c.json({ id: '' }));
hc<typeof b>('x').users[':id'].$get(...);                      // ❌ unknown
```

装饰器路由（`@Get('/:id')`）必然是动态注册，所以**用它就必然丢掉 RPC 类型**。
HestJS 选择保住类型。

代价只有一个：路径写在 `routes` 里，而不是装饰器上。

## 类型化客户端

```ts title="src/main.ts"
export type AppType = typeof app.hono;
```

```ts title="client.ts"
import { hc } from 'hono/client';
import type { AppType } from './server/main';

const client = hc<AppType>('https://api.example.com');

const res = await client.users[':id'].$get({ param: { id: '1' } });
const user = await res.json();   // 类型自动推出来
```

不用写任何 schema、不用生成代码。

## ⚠️ 不要给控制器方法标注返回类型

```ts
// ❌ 前端 hc 会拿到 unknown
detail(c: Context<Env, '/users/:id'>): Response {
  return c.json({ id: '1' });
}

// ✅ 让 TS 自己推导
detail(c: Context<Env, '/users/:id'>) {
  return c.json({ id: '1' });
}
```

`c.json()` 返回的是一个**带类型信息的**响应对象，`: Response` 把它擦成基础类型。
Hono 靠这个类型推导 `hc` 的响应类型，擦掉之后前端就只能拿到 `unknown`。

实测：

```
标注 : Response   →   a.message   ❌ 'a' is of type 'unknown'
不标注            →   b.message   ✅
```

**这是从 NestJS 过来最容易踩的坑。** 在 NestJS 里给方法标 `: Response` 是好习惯，
在这里它会静默摧毁前端的类型 —— 没有报错，只是类型悄悄退化了。

参数类型该标还是要标（`Context<Env, '/users/:id'>`），只有**返回类型**不能标。

## 路径参数的类型

控制器方法要拿到 `c.req.param()` 的类型，把完整路径写成类型参数：

```ts
detail(c: Context<Env, '/users/:id'>): Response {
  const id = c.req.param('id');   // string，不是 string | undefined
}
```

**这里要写完整路径**（控制器前缀 + 相对路径），因为 TS 读不到
`routes` 里那个字符串。写错了不会报错，只会退化成 `string | undefined`——
所以如果你要参数类型，建议直接把路径写成常量：

```ts
const USER_DETAIL = '/users/:id' as const;

routes: (hono, resolve) => hono.get(USER_DETAIL, (c) => resolve(Users).detail(c))
//                                          ↑ 和下面的类型参数同源，不会漂移
detail(c: Context<Env, typeof USER_DETAIL>): Response { ... }
```

## middleware 与 routes 的顺序

`middleware` 先执行，`routes` 后执行。这不是实现细节，是 Hono 的语义：

```ts
createApp(AppModule, {
  middleware: [logger()],   // ✅ 会包住下面所有路由
  routes: (hono) => hono.get('/users', handler),
});
```

写成 `app.hono.use(...)`（在 `createApp` 之后）就包不住已经注册的路由了。

## 裸 Hono 路由随时可用

`app.hono` 就是 Hono，没有任何边界：

```ts
app.hono.get('/version', (c) => c.json({ version: '1.0.0' }));
app.hono.notFound((c) => c.json({ message: 'not found' }, 404));
app.hono.onError((err, c) => c.json({ message: err.message }, 500));
```

## 挂载后可以自己查

```ts
app.hono.routes            // 全部路由，包括中间件注册出来的条目
app.graph.modules          // 模块图，依赖在前
app.container              // 依赖容器
```
