# 写测试

HestJS 不要求你装 jest 或 vitest。`bun test` 就是全部工具链。

```ts
import { describe, expect, it } from 'bun:test';
import { createTestApp } from '@hestjs/testing';
import { AppModule } from './app.module';

const app = await createTestApp(AppModule, {
  routes: (hono, resolve) => hono.get('/users', (c) => resolve(Users).list(c)),
});

describe('用户接口', () => {
  it('健康检查', async () => {
    expect(await app.status('/health')).toBe(200);
  });

  it('创建用户', async () => {
    const created = await app.postJson<{ id: string }>('/users', { name: 'Ada' });
    expect(created.id).toBeDefined();
  });
});
```

## `createTestApp` 是什么

就是 `createApp()` 加一次 `start()`，再配一组请求便利方法：

| 方法 | 作用 |
| --- | --- |
| `request(path, init?)` | 原样发请求，返回 `Response` |
| `json<T>(path, init?)` | 解析 JSON |
| `text(path, init?)` | 取文本 |
| `status(path, init?)` | 只取状态码 |
| `postJson<T>(path, body, init?)` | POST 一个 JSON body 并解析响应 |
| `close()` | 逆序执行所有 `OnStop` |

它**不引入第二套运行时**：`app.app` 是原来那个 `App`，`app.hono` 是原来那个
Hono 实例。所有便利方法最后都落到 `hono.request()`。

## 替换依赖

```ts
const app = await createTestApp(AppModule, {
  overrides: [
    { provide: Database, useValue: new FakeDatabase() },
    { provide: CLOCK, useValue: () => '2026-01-01T00:00:00Z' },
  ],
});
```

**只能替换本来就注册过的 token。** 名字写错会立刻抛 `UnknownOverrideError`：

```
测试替身 'typo' 没有对应的真实 provider。
overrides 只能替换「本来就注册过」的 token，不能凭空新增 ——
否则测试会通过，线上却少一个依赖。
```

这个约束是刻意的。框架不提供「运行时偷偷换实现」的后门，唯一入口是
`createApp` 的 `overrides`，而且它会校验。

## 不监听端口

`app.hono.request()` 在内存里跑完整的中间件与路由链路，
不起服务器、不占端口。测试之间不会互相干扰，也不会因为端口冲突随机挂掉。

需要真实 HTTP（比如测 `Bun.serve` 的适配层）时才自己起服务：

```ts
const server = Bun.serve({ port: 0, fetch: app.hono.fetch });
```

## 别忘了 close

```ts
import { afterAll } from 'bun:test';

afterAll(() => app.close());
```

`close()` 会逆序执行所有 `OnStop`。持有连接池、定时器、worker 的 provider
靠它释放——不调的话 `bun test` 可能因为句柄没关而不退出。

## 测什么

框架自己的测试可以看 `packages/*/src/*.test.ts`，它们是这么组织的：

| 层 | 测法 |
| --- | --- |
| 容器与模块图 | 直接 `resolveModuleGraph()` 断言结构，不起 HTTP |
| 路由与中间件顺序 | `createTestApp` + `status()` |
| 插件行为 | 上两者混合，必要时读原型上的元数据表 |

`@hestjs/openapi` 的测试里还验证了「没有 `@Describe` 就不编造 summary」这类
**不做事**的保证——那些同样需要被测到。
