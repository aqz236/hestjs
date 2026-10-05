---
sidebar_position: 1
---

# 校验

`@hestjs/validation` 只认 [Standard Schema](https://github.com/standard-schema/standard-schema)。

zod、valibot、arktype、effect 都实现了它，框架不认识其中任何一个——
换库只改 import。

## 用法

```ts
import { z } from 'zod';
import { Body, type InferInput, type ValidatedBody } from '@hestjs/validation';

const CreateUser = z.object({
  name: z.string().min(1).max(50),
});

type CreateUserInput = InferInput<typeof CreateUser>;

@Controller('/users')
class UserController {
  @Post('/')
  @Body(CreateUser, { jsonSchema: z.toJSONSchema(CreateUser) })
  create(c: RouteContext<'/users', ValidatedBody<CreateUserInput>>): Response {
    const input = c.req.valid('json');
    return c.json({ name: input.name }, 201);
  }
}
```

`c.req.valid('json')` 就是 Hono 原生的那套——校验插件底层用的正是
`hono/validator`，只是把「写在 configure 里」变成了「写在路由旁边」。

## 六个装饰器

| 装饰器 | 来源 |
| --- | --- |
| `@Body(schema)` | `json` |
| `@Query(schema)` | `query` |
| `@Param(schema)` | `param` |
| `@Header(schema)` | `header` |
| `@Form(schema)` | `form` |
| `@Cookie(schema)` | `cookie` |

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
@Body(CreateUser, {
  onInvalid: (issues, c) => c.json({ error: '参数不对', issues }, 422),
})
```

## 不做隐式类型转换

query 里一切都是字符串。要数字就自己写：

```ts
const ListQuery = z.object({ limit: z.coerce.number().int().min(1) });
```

**猜类型正是我们要避免的黑盒行为。** 框架不做转换，schema 说了算。

## 给文档用的 JSON Schema

`jsonSchema` 是可选的，只影响文档生成，不影响校验：

```ts
@Body(CreateUser, { jsonSchema: z.toJSONSchema(CreateUser) })
```

各家产法不同（valibot 用 `@valibot/to-json-schema`），所以框架不猜，
你自己算好传进来。

## 版本兼容

新老 schema 库只要实现 Standard Schema v1 就能用。
自测时手写一个对象也能当 schema，仓库的测试就是这么做的。
