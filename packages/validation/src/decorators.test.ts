import type { Context } from 'hono';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'bun:test';
import { Controller, Get, Module, Post, createApp } from '@hestjs/core';
import { Body, Query, readSchemas, validateSchema } from './index';

/**
 * 手写一个最小 Standard Schema —— 不依赖 zod / valibot。
 * 这同时证明了这套校验对整个 Standard Schema 生态通用。
 */
function objectSchema(
  shape: Record<string, 'string' | 'number'>,
): StandardSchemaV1<unknown, Record<string, unknown>> {
  return {
    '~standard': {
      version: 1,
      vendor: 'hand-rolled',
      validate(value) {
        const issues: StandardSchemaV1.Issue[] = [];
        const record = (value ?? {}) as Record<string, unknown>;
        for (const [key, type] of Object.entries(shape)) {
          const actual = record[key];
          if (typeof actual !== type) {
            issues.push({ path: [key], message: `${key} 必须是 ${type}` });
          }
        }
        return issues.length > 0 ? { issues } : { value: record };
      },
    },
  };
}

const CreateUser = objectSchema({ name: 'string' });
// query 里一切都是字符串，转换是 schema 自己的事（zod 用 z.coerce.number()）。
// HestJS 不做隐式转换：猜类型正是我们要避免的黑盒行为。
const ListQuery = objectSchema({ limit: 'string' });

@Controller('/users')
class UserController {
  @Post('/')
  @Body(CreateUser)
  create(c: Context): Response {
    const input = c.req.valid('json' as never) as { name: string };
    return c.json({ created: input.name }, 201);
  }

  @Post('/custom-error')
  @Body(CreateUser, {
    onInvalid: (issues, c) => c.json({ failed: issues.length }, 422),
  })
  createCustomError(c: Context): Response {
    return c.json({ ok: true });
  }

  @Get('/')
  @Query(ListQuery)
  list(c: Context): Response {
    const query = c.req.valid('query' as never) as { limit: string };
    return c.json({ limit: query.limit });
  }

  @Get('/plain')
  plain(c: Context): Response {
    return c.text('no validation here');
  }
}

@Module({ controllers: [UserController] })
class AppModule {}

const app = createApp(AppModule);

const post = async (path: string, body: unknown): Promise<Response> =>
  await app.hono.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('@Body', () => {
  it('校验通过后控制器拿到解析结果', async () => {
    const response = await post('/users', { name: 'Ada', ignored: true });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ created: 'Ada' });
  });

  it('校验失败返回 400 与结构化 issues', async () => {
    const response = await post('/users', { name: 42 });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: '请求参数校验失败',
      issues: [{ path: 'name', message: 'name 必须是 string' }],
    });
  });

  it('缺字段也会被拦下', async () => {
    expect((await post('/users', {})).status).toBe(400);
  });

  it('onInvalid 可以换成自己的响应', async () => {
    const response = await post('/users/custom-error', { name: 1 });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ failed: 1 });
  });
});

describe('@Query', () => {
  it('按 schema 转换后的值可用', async () => {
    const response = await app.hono.request('/users?limit=10');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ limit: '10' });
  });

  it('缺必需字段时拦下', async () => {
    expect((await app.hono.request('/users')).status).toBe(400);
  });
});

describe('不受影响的路由', () => {
  it('没有校验装饰器就完全不动', async () => {
    const response = await app.hono.request('/users/plain');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('no validation here');
  });
});

describe('schema 登记', () => {
  it('原型上记录了 source 与 schema，供文档生成读取', () => {
    const entries = readSchemas(UserController.prototype, 'create');
    expect(entries).toHaveLength(1);
    expect(entries[0]!.source).toBe('json');
  });
});

describe('validateSchema', () => {
  it('成功与失败都收敛成判别式联合', async () => {
    expect(await validateSchema(CreateUser, { name: 'x' })).toEqual({
      ok: true,
      value: { name: 'x' },
    });
    const failed = await validateSchema(CreateUser, { name: 1 });
    expect(failed.ok).toBe(false);
  });
});
