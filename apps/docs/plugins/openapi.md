# OpenAPI 文档

```ts
import { Describe, openApiRoutes } from '@hestjs/openapi';

const app = createApp(AppModule);

app.hono.route('/', openApiRoutes({
  graph: app.graph,
  info: { title: 'HestJS API', version: '1.0.0' },
}));
```

挂上之后：

| 路径 | 内容 |
| --- | --- |
| `/openapi.json` | OpenAPI 3.1 文档 |
| `/docs` | Scalar API 参考界面 |

挂载是显式的，不藏在 `createApp()` 里——你随时能改路径、关掉 UI、
或者拿 `buildOpenApiDocument()` 自己去处理。

## 它知道什么，不知道什么

**自动读到的：**

- 路由表（方法 + 路径，`:id` 会转成 `{id}`）
- 路径参数（`required: true`）
- 校验装饰器登记的 `jsonSchema` → `requestBody` / `parameters`

**读不到、也不会编造的：**

- 裸的 `hono.get()` 路由（没有元数据可看，文档里就不出现）
- 响应结构（除非你写 `@Describe`）
- 没有任何校验的请求体（文档里就没有 requestBody）

```ts
@Get('/:id')
@Param(IdParam, { jsonSchema: IdJson })
@Describe({
  summary: '查单个用户',
  tags: ['users'],
  responses: { '200': { description: '用户详情', jsonSchema: UserJson } },
})
detail(c: RouteContext<'/users/:id'>): Response {
  return c.json(this.users.get(c.req.param('id')));
}
```

**猜不出来就不写。** 一份撒谎的文档比没有文档更糟。

## 配置项

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `graph` | —— | `app.graph`，必填 |
| `info` | —— | OpenAPI 必填字段 |
| `servers` | 无 | 服务地址列表 |
| `jsonPath` | `/openapi.json` | 文档 JSON 路径 |
| `docsPath` | `/docs` | UI 路径 |
| `ui` | `true` | 关掉就只出 JSON |

## 只要文档对象

```ts
import { buildOpenApiDocument } from '@hestjs/openapi';

const document = buildOpenApiDocument(app.graph, {
  info: { title: 'HestJS API', version: '1.0.0' },
});

await Bun.write('./openapi.json', JSON.stringify(document, null, 2));
```

适合在 CI 里导出契约、或者喂给别的工具（代码生成、契约测试）。

## UI 从 CDN 加载

`/docs` 返回的是一张静态 HTML，从 jsDelivr 拉 `@scalar/api-reference`。
没有构建步骤，也不需要额外的依赖。
