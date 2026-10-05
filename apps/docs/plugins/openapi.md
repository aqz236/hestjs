# OpenAPI 文档

```ts
import { documented, openApiRoutes } from '@hestjs/openapi';

const app = createApp(AppModule, {
  routes: (hono, resolve) =>
    hono.get(
      '/users/:id',
      documented({ summary: '查单个用户', tags: ['users'] }),
      (c) => resolve(Users).detail(c),
    ),
});

app.hono.route('/', openApiRoutes({
  hono: app.hono,
  info: { title: 'HestJS API', version: '1.0.0' },
}));
```

挂上之后：

| 路径 | 内容 |
| --- | --- |
| `/openapi.json` | OpenAPI 3.1 文档 |
| `/docs` | Scalar API 参考界面 |

## documented 也是一段中间件

它什么都不做，只把说明挂在自己身上。因为 `hono.routes` 会连中间件一起记下来，
`buildOpenApiDocument` 就能按 `(method, path)` 把同一路由上的元数据聚合起来。

和 `validate()` 一样，做成中间件是为了不碰 handler、不影响 RPC 类型。

## 它知道什么，不知道什么

**自动读到的：**

- 路由表（直接来自 `hono.routes`，不用传模块图）
- 路径参数（`:id` → `{id}`，`required: true`）
- `validate({ jsonSchema })` 登记的请求体与查询参数

**读不到、也不会编造的：**

- 中间件注册出来的通配条目（`ALL /*` 之类）会被跳过
- 响应结构（除非写 `documented({ responses })`）
- 没有任何 schema 的请求体（文档里就没有 requestBody）

**猜不出来就不写。** 一份撒谎的文档比没有文档更糟。

## 完整例子

```ts
hono
  .get(
    '/users',
    documented({
      summary: '列出全部用户',
      tags: ['users'],
      responses: { '200': { description: '用户列表', jsonSchema: { type: 'array' } } },
    }),
    (c) => users.list(c),
  )
  .post(
    '/users',
    validate({ body: CreateUser, jsonSchema: { body: z.toJSONSchema(CreateUser) } }),
    documented({
      summary: '创建用户',
      tags: ['users'],
      responses: { '201': { description: '创建成功' } },
    }),
    (c) => users.create(c),
  );
```

## 配置项

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `hono` | —— | 通常是 `app.hono`，必填 |
| `info` | —— | OpenAPI 必填字段 |
| `servers` | 无 | 服务地址列表 |
| `jsonPath` | `/openapi.json` | 文档 JSON 路径 |
| `docsPath` | `/docs` | UI 路径 |
| `ui` | `true` | 关掉就只出 JSON |

## 只要文档对象

```ts
import { buildOpenApiDocument } from '@hestjs/openapi';

const document = buildOpenApiDocument(app.hono, {
  info: { title: 'HestJS API', version: '1.0.0' },
});

await Bun.write('./openapi.json', JSON.stringify(document, null, 2));
```

适合在 CI 里导出契约、或者喂给别的工具。

## 与 validation 的关系

**没有关系。** `openapi` 只依赖 `core`，读的是 core 里定义的
`ValidationRouteMeta` 形状，不是 `validation` 包的导出。

这样没写校验的路由也能出文档，两个插件可以各装各的。
