import type { Context } from 'hono';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'bun:test';
import { Controller, Get, Module, Post, createApp, resolveModuleGraph } from '@hestjs/core';
import { Body, Param } from '@hestjs/validation';
import { Describe } from './describe';
import { buildOpenApiDocument } from './document';
import { openApiRoutes } from './ui';

/** 一个最小的 JSON Schema 载体，模拟 zod 的 z.toJSONSchema() 产物。 */
const CreateUserJson = {
  type: 'object',
  properties: { name: { type: 'string' }, age: { type: 'integer' } },
  required: ['name'],
};

const IdJson = {
  type: 'object',
  properties: { id: { type: 'string' } },
  required: ['id'],
};

const passthrough = <T,>(): StandardSchemaV1<unknown, T> => ({
  '~standard': { version: 1, vendor: 'test', validate: (value) => ({ value: value as T }) },
});

const CreateUser = passthrough<{ name: string }>();
const IdParam = passthrough<{ id: string }>();

@Controller('/users')
class UserController {
  @Get('/')
  @Describe({
    summary: '列出用户',
    tags: ['users'],
    responses: { '200': { description: '用户列表', jsonSchema: { type: 'array' } } },
  })
  list(c: Context): Response {
    return c.json([]);
  }

  @Get('/:id')
  @Param(IdParam, { jsonSchema: IdJson })
  @Describe({ summary: '查单个用户', tags: ['users'] })
  detail(c: Context): Response {
    return c.json({});
  }

  @Post('/')
  @Body(CreateUser, { jsonSchema: CreateUserJson })
  @Describe({ summary: '创建用户', tags: ['users'], deprecated: true })
  create(c: Context): Response {
    return c.json({}, 201);
  }
}

@Module({ controllers: [UserController] })
class AppModule {}

describe('buildOpenApiDocument', () => {
  const graph = resolveModuleGraph(AppModule);
  const document = buildOpenApiDocument(graph, { info: { title: 'HestJS API', version: '1.0.0' } });

  it('是 OpenAPI 3.1', () => {
    expect(document.openapi).toBe('3.1.0');
    expect(document.info.title).toBe('HestJS API');
  });

  it('路由被翻译成 OpenAPI 路径', () => {
    expect(Object.keys(document.paths).sort()).toEqual(['/users', '/users/{id}']);
    expect(Object.keys(document.paths['/users']!)).toEqual(['get', 'post']);
  });

  it('summary 与 tags 来自 @Describe', () => {
    const operation = document.paths['/users']!.get as Record<string, unknown>;
    expect(operation.summary).toBe('列出用户');
    expect(operation.tags).toEqual(['users']);
  });

  it('响应结构来自 @Describe', () => {
    const operation = document.paths['/users']!.get as Record<string, unknown>;
    expect(operation.responses).toEqual({
      '200': { description: '用户列表', content: { 'application/json': { schema: { type: 'array' } } } },
    });
  });

  it('JSON 请求体来自校验装饰器的 jsonSchema', () => {
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

  it('没有 @Describe 的路由不编造 summary', () => {
    @Controller('/plain')
    class PlainController {
      @Get('/')
      ping(c: Context): Response {
        return c.text('pong');
      }
    }
    @Module({ controllers: [PlainController] })
    class PlainModule {}

    const plain = buildOpenApiDocument(resolveModuleGraph(PlainModule), {
      info: { title: 't', version: '1' },
    });
    const operation = plain.paths['/plain']!.get as Record<string, unknown>;
    expect(operation.summary).toBeUndefined();
    expect(operation.responses).toEqual({ '200': { description: 'OK' } });
  });
});

describe('openApiRoutes', () => {
  const app = createApp(AppModule);
  app.hono.route('/', openApiRoutes({ graph: app.graph, info: { title: 'HestJS API', version: '1.0.0' } }));

  it('暴露 JSON 文档', async () => {
    const response = await app.hono.request('/openapi.json');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { openapi: string };
    expect(body.openapi).toBe('3.1.0');
  });

  it('暴露 Scalar UI 页面', async () => {
    const response = await app.hono.request('/docs');
    expect(await response.text()).toContain('@scalar/api-reference');
  });

  it('文档路由不干扰原有控制器', async () => {
    expect((await app.hono.request('/users')).status).toBe(200);
  });
});
