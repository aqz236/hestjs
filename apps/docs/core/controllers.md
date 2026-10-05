# 控制器与路由

```ts
@Controller('/users')
class UserController {
  static readonly inject = [UserService] as const;

  constructor(private readonly users: UserService) {}

  @Get('/')
  list(c: Context): Response {
    return c.json(this.users.list());
  }

  @Get('/:id')
  detail(c: Context<Env, '/users/:id'>): Response {
    return c.json(this.users.get(c.req.param('id')));
  }

  @Post('/')
  create(c: Context): Response {
    return c.json(this.users.create(c.req.valid('json')), 201);
  }
}
```

控制器是单例，在挂载时构造一次。方法第一个参数永远是 Hono 的 `Context`。

## 路径怎么拼

```
prefix（createApp 的选项）
  + @Controller 上的路径
    + 方法装饰器上的路径
```

`@Controller('/users')` + `@Get('/:id')` → `/users/:id`。
多余斜杠会被归一，`@Get('/')` 等价于 `@Get('')`。

## 找回路径参数的类型

动态注册拿不到 Hono 的路径推导，把完整路径写成类型参数就能找回来：

```ts
@Get('/:id')
detail(c: RouteContext<'/users/:id'>): Response {
  const id = c.req.param('id');   // string，不是 string | undefined
}
```

配合校验插件还能一并带上请求体类型：

```ts
create(c: RouteContext<'/users', ValidatedBody<CreateUserInput>>): Response {
  const input = c.req.valid('json');   // CreateUserInput
}
```

## configure 的顺序

`configure` 在**控制器挂载之前**执行。这是故意的：

```ts
createApp(AppModule, {
  configure(hono) {
    hono.use(logger());        // ✅ 会包住所有控制器
  },
});
```

写在 `createApp()` 之后再加的中间件，就包不住已经挂上的控制器路由了。

## 裸 Hono 路由随时可用

没有任何边界：

```ts
const app = createApp(AppModule, {
  configure(hono) {
    hono.get('/health', (c) => c.text('ok'));
  },
});

app.hono.get('/version', (c) => c.json({ version: '1.0.0' }));
app.hono.notFound((c) => c.json({ message: 'not found' }, 404));
```

这些路由和控制器路由地位完全相同，顺序就是注册顺序。

## 相关选项

| 选项 | 作用 |
| --- | --- |
| `hono` | 复用已有的 Hono 实例 |
| `configure(hono, container)` | 控制器挂载前调用 |
| `prefix` | 给所有控制器加一层前缀，例如 `/api/v1` |
| `mountControllers: false` | 不自动挂载，自己决定什么时候挂 |

## 挂载后可以自己查

```ts
app.hono.routes            // 全部路由，控制器和裸路由都在
app.graph.controllers      // 控制器绑定关系
app.graph.modules          // 模块图，依赖在前
```
