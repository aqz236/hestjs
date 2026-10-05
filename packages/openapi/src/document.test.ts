import type { Context } from 'hono';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'bun:test';
import { Module, createApp } from '@hestjs/core';
import { validate } from '@hestjs/validation';
import { documented } from './documented';
import { buildOpenApiDocument } from './document';
import { openApiRoutes } from './ui';

const CreateUserJson = {
  type: 'object',
  properties: { name: { type: 'string' }, age: { type: 'integer' } },
  required: ['name'],
};
const IdJson = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };

const passthrough = <T,>(): StandardSchemaV1<unknown, T> => ({
  '~standard': { version: 1, vendor: 'test', validate: (value) => ({ value: value as T }) },
});
const CreateUser = passthrough<{ name: string }>();
const IdParam = passthrough<{ id: string }>();

class Users {
  list(c: Context): Response {
    return c.json([]);
  }
  detail(c: Context): Response {
    return c.json({});
  }
  create(c: Context): Response {
    return c.json({}, 201);
  }
}

@Module({ providers: [Users] })
class AppModule {}

const app = createApp(AppModule, {
  routes: (hono, resolve) =>
    hono
      .get(
        '/users',
        documented({
          summary: '列出用户',
          tags: ['users'],
          responses: { '200': { description: '用户列表', jsonSchema: { type: 'array' } } },
        }),
        (c) => resolve(Users).list(c),
      )
      .get(
        '/users/:id',
        validate({ params: IdParam, jsonSchema: { params: IdJson } }),
        documented({ summary: '查单个用户', tags: ['users'] }),
        (c) => resolve(Users).detail(c),
      )
      .post(
        '/users',
        validate({ body: CreateUser, jsonSchema: { body: CreateUserJson } }),
        documented({ summary: '创建用户', tags: ['users'], deprecated: true }),
        (c) => resolve(Users).create(c),
      ),
});

describe('buildOpenApiDocument', () => {
  const document = buildOpenApiDocument(app.hono, {
    info: { title: 'HestJS API', version: '1.0.0' },
  });

  it('是 OpenAPI 3.1', () => {
    expect(document.openapi).toBe('3.1.0');
    expect(document.info.title).toBe('HestJS API');
  });

  it('路由表直接来自 hono.routes，不用传模块图', () => {
    expect(Object.keys(document.paths).sort()).toEqual(['/users', '/users/{id}']);
    expect(Object.keys(document.paths['/users']!)).toEqual(['get', 'post']);
  });

  it('summary 与 tags 来自 documented()', () => {
    const operation = document.paths['/users']!.get as Record<string, unknown>;
    expect(operation.summary).toBe('列出用户');
    expect(operation.tags).toEqual(['users']);
  });

  it('响应结构来自 documented()', () => {
    const operation = document.paths['/users']!.get as Record<string, unknown>;
    expect(operation.responses).toEqual({
      '200': {
        description: '用户列表',
        content: { 'application/json': { schema: { type: 'array' } } },
      },
    });
  });

  it('请求体 schema 来自 validate() 挂上的元数据', () => {
    const operation = document.paths['/users']!.post as Record<string, unknown>;
    expect(operation.requestBody).toEqual({
      required: true,
      content: { 'application/json': { schema: CreateUserJson } },
    });
  });

  it('路径参数被展开，required 为 true', () => {
    const operation = document.paths['/users/{id}']!.get as Record<string, unknown>;
    expect(operation.parameters).toEqual([
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    ]);
  });

  it('deprecated 透传', () => {
    expect((document.paths['/users']!.post as Record<string, unknown>).deprecated).toBe(true);
  });

  it('中间件注册出来的通配条目不会混进文档', () => {
    const withMiddleware = createApp(AppModule, {
      middleware: [async (_c, next) => next()],
      routes: (hono, resolve) => hono.get('/ping', (c) => resolve(Users).list(c)),
    });
    const doc = buildOpenApiDocument(withMiddleware.hono, { info: { title: 't', version: '1' } });
    expect(Object.keys(doc.paths)).toEqual(['/ping']);
  });

  it('没有 documented() 就不编造 summary', () => {
    const bare = createApp(AppModule, {
      routes: (hono, resolve) => hono.get('/ping', (c) => resolve(Users).list(c)),
    });
    const doc = buildOpenApiDocument(bare.hono, { info: { title: 't', version: '1' } });
    const operation = doc.paths['/ping']!.get as Record<string, unknown>;
    expect(operation.summary).toBeUndefined();
    expect(operation.responses).toEqual({ '200': { description: 'OK' } });
  });
});

describe('openApiRoutes', () => {
  const withDocs = createApp(AppModule, {
    routes: (hono, resolve) => hono.get('/users', (c) => resolve(Users).list(c)),
  });
  withDocs.hono.route(
    '/',
    openApiRoutes({ hono: withDocs.hono, info: { title: 'HestJS API', version: '1.0.0' } }),
  );

  it('暴露 JSON 文档', async () => {
    const response = await withDocs.hono.request('/openapi.json');
    const body = (await response.json()) as { openapi: string };
    expect(body.openapi).toBe('3.1.0');
  });

  it('暴露 Scalar UI 页面', async () => {
    expect(await (await withDocs.hono.request('/docs')).text()).toContain('@scalar/api-reference');
  });

  it('文档路由不干扰原有路由', async () => {
    expect((await withDocs.hono.request('/users')).status).toBe(200);
  });
});
