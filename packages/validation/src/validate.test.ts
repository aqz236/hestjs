import type { Context } from 'hono';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'bun:test';
import { Module, createApp, readRouteMeta } from '@hestjs/core';
import type { ValidationRouteMeta } from '@hestjs/core';
import { validate, validateSchema, type ValidateSpec } from './index';

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
          if (typeof record[key] !== type) {
            issues.push({ path: [key], message: `${key} 必须是 ${type}` });
          }
        }
        return issues.length > 0 ? { issues } : { value: record };
      },
    },
  };
}

const CreateUser = objectSchema({ name: 'string' });
const ListQuery = objectSchema({ limit: 'string' });

class Users {
  create(c: Context): Response {
    const input = c.req.valid('json' as never) as { name: string };
    return c.json({ created: input.name }, 201);
  }

  list(c: Context): Response {
    const query = c.req.valid('query' as never) as { limit: string };
    return c.json({ limit: query.limit });
  }

  ping(c: Context): Response {
    return c.text('pong');
  }
}

@Module({ providers: [Users] })
class AppModule {}

interface Specs {
  readonly create?: ValidateSpec;
  readonly list?: ValidateSpec;
}

const build = (specs: Specs = {}) =>
  createApp(AppModule, {
    routes: (hono, resolve) =>
      hono
        .post('/users', validate(specs.create ?? {}), (c) => resolve(Users).create(c))
        .get('/users', validate(specs.list ?? {}), (c) => resolve(Users).list(c))
        .get('/ping', (c) => resolve(Users).ping(c)),
  });

describe('validate', () => {
  const app = build({ create: { body: CreateUser }, list: { query: ListQuery } });

  it('校验通过后控制器拿到解析结果', async () => {
    const response = await app.hono.request('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ada', ignored: true }),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ created: 'Ada' });
  });

  it('校验失败返回 400 与结构化 issues', async () => {
    const response = await app.hono.request('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 42 }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: '请求参数校验失败',
      issues: [{ path: 'name', message: 'name 必须是 string' }],
    });
  });

  it('多个 source 各自生效', async () => {
    expect(await (await app.hono.request('/users?limit=10')).json()).toEqual({ limit: '10' });
    expect((await app.hono.request('/users')).status).toBe(400);
  });

  it('onInvalid 可以换成自己的响应', async () => {
    const custom = build({
      create: {
        body: CreateUser,
        onInvalid: (issues, c) => c.json({ failed: issues.length }, 422),
      },
    });
    const response = await custom.hono.request('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 1 }),
    });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ failed: 1 });
  });

  it('没声明 schema 时是一段纯透传中间件', async () => {
    const app = build({});
    expect((await app.hono.request('/ping')).status).toBe(200);
    expect((await app.hono.request('/ping')).headers.get('x-powered-by')).toBeNull();
  });
});

describe('schema 挂到路由上', () => {
  it('openapi 能从 handler 元数据读回校验信息', () => {
    const app = build({
      create: {
        body: CreateUser,
        jsonSchema: { body: { type: 'object', properties: { name: { type: 'string' } } } },
      },
    });

    // 同一条路由会有中间件 + handler 两条 entry，元数据挂在中间件那条上
    const entries = app.hono.routes
      .filter((route) => route.method === 'POST')
      .flatMap((route) => readRouteMeta(route.handler))
      .filter((entry): entry is ValidationRouteMeta => entry.kind === 'validation');

    expect(entries).toHaveLength(1);
    expect(entries[0]!.source).toBe('json');
    expect(entries[0]!.jsonSchema).toEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
    });
  });
});

describe('validateSchema', () => {
  it('成功与失败都收敛成判别式联合', async () => {
    expect(await validateSchema(CreateUser, { name: 'x' })).toEqual({ ok: true, value: { name: 'x' } });
    expect((await validateSchema(CreateUser, { name: 1 })).ok).toBe(false);
  });
});
