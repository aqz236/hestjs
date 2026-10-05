# 校验

`@hestjs/validation` 只认 [Standard Schema](https://github.com/standard-schema/standard-schema)。
zod、valibot、arktype、effect 都实现了它，框架不认识其中任何一个——换库只改 import。

## 用法

```ts
import { z } from 'zod';
import { validate } from '@hestjs/validation';

const CreateUser = z.object({ name: z.string().min(1).max(50) });

const app = createApp(AppModule, {
  routes: (hono, resolve) =>
    hono.post(
      '/users',
      validate({
        body: CreateUser,
        jsonSchema: { body: z.toJSONSchema(CreateUser) },   // 可选，只给文档用
      }),
      (c) => resolve(Users).create(c),
    ),
});
```

控制器里还是原生那套：

```ts
create(c: Context): Response {
  const input = c.req.valid('json') as { name: string };
  return c.json({ name: input.name }, 201);
}
```

## 为什么是中间件

`validate()` 返回的是 **Hono 中间件**，不是包装过的 handler。

包装 handler 会让 Hono 的链式类型推导失效——试过三种泛型签名，全都不行：

```
包装后   hc<typeof app>('x').users.$post(...)   ❌ unknown
中间件   hc<typeof app>('x').users.$post(...)   ✅ 类型完整
```

而中间件既能校验、又能把 schema 挂在自己身上——`hono.routes` 会连中间件一起记下来，
所以文档插件照样能读到。两边都不牺牲。

## 四个字段

| 字段 | 校验来源 |
| --- | --- |
| `body` | `json` |
| `query` | `query` |
| `params` | `param` |
| `headers` | `header` |

底层是 Hono 官方的 `@hono/standard-validator`，所以 `c.req.valid('json')`
拿到的就是原生那套结果。

## 校验失败

默认返回 400 加结构化 issues：

```json
{
  "message": "请求参数校验失败",
  "issues": [{ "path": "name", "message": "Too small: expected string to have >=1 characters" }]
}
```

换成自己的响应：

```ts
validate({
  body: CreateUser,
  onInvalid: (issues, c) => c.json({ error: '参数不对', issues }, 422),
})
```

## 不做隐式类型转换

query 里一切都是字符串。要数字就自己写：

```ts
const ListQuery = z.object({ limit: z.coerce.number().int().min(1) });
```

**猜类型正是我们要避免的黑盒行为。** 框架不做转换，schema 说了算。

## 独立于 HTTP 使用

```ts
import { validateSchema } from '@hestjs/validation';

const result = await validateSchema(CreateUser, payload);
if (!result.ok) {
  console.log(result.issues);
}
```

需要在校验之外单独验一个对象时用它。

## 给文档用的 JSON Schema

`jsonSchema` 是可选的，只影响文档生成，不影响校验：

```ts
validate({ body: CreateUser, jsonSchema: { body: z.toJSONSchema(CreateUser) } })
```

各家产法不同（valibot 用 `@valibot/to-json-schema`），所以框架不猜，
你自己算好传进来。
