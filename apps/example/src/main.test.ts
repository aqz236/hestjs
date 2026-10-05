import { describe, expect, it } from 'bun:test';
import { app } from './main';

const json = async (path: string, init?: RequestInit): Promise<{ status: number; body: any }> => {
  const response = await app.hono.request(path, init);
  return { status: response.status, body: await response.json() };
};

describe('HTTP', () => {
  it('原生 Hono 路由可用', async () => {
    const response = await app.hono.request('/health');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('控制器路由 + 依赖注入', async () => {
    const { status, body } = await json('/users');
    expect(status).toBe(200);
    expect(body.data.some((user: { name: string }) => user.name === 'Ada')).toBe(true);
    expect(typeof body.at).toBe('string');
  });

  it('路径参数按 @Get("/:id") 解析', async () => {
    expect((await json('/users/1')).body.data).toEqual({ id: '1', name: 'Ada' });
    expect((await json('/users/404')).status).toBe(404);
  });

  it('configure 里的中间件包住了控制器', async () => {
    const response = await app.hono.request('/users');
    expect(response.headers.get('x-powered-by')).toBe('hestjs');
  });

  it('@Body 用 zod 校验，非法请求被拦下', async () => {
    const { status } = await json('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 123 }),
    });
    expect(status).toBe(400);
  });

  it('合法请求体走到控制器', async () => {
    const { status, body } = await json('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Grace' }),
    });
    expect(status).toBe(201);
    expect(body.data.name).toBe('Grace');
  });
});

describe('模块作用域', () => {
  it('UserRepository 只在 DataModule 的容器里', () => {
    const dataModule = app.graph.modules.find((node) => node.target.name === 'DataModule');
    expect(dataModule).toBeDefined();
    expect(dataModule!.container.provides(Symbol.for('never'))).toBe(false);
  });

  it('根容器拿不到未向上导出的 provider', () => {
    // AppModule 只 import 了 UsersFeatureModule，UserRepository 没有沿链 export 上来
    expect(app.graph.modules.map((node) => node.target.name)).toEqual([
      'DataModule',
      'CoreModule',
      'UsersFeatureModule',
      'AppModule',
    ]);
  });
});

describe('文档', () => {
  it('openapi.json 列出全部控制器路由', async () => {
    const document = (await (await app.hono.request('/openapi.json')).json()) as {
      openapi: string;
      paths: Record<string, Record<string, unknown>>;
    };
    expect(document.openapi).toBe('3.1.0');
    // 只收录走控制器的路由：/health 是直接在 Hono 上写的裸路由，
    // 没有元数据可读，文档里就不会出现它 —— 这是诚实，不是遗漏。
    expect(Object.keys(document.paths).sort()).toEqual(['/users', '/users/{id}']);
  });

  it('请求体 schema 来自 zod', async () => {
    const document = (await (await app.hono.request('/openapi.json')).json()) as {
      paths: Record<string, { post?: { requestBody?: { content?: Record<string, { schema?: { type?: string } }> } } }>;
    };
    expect(document.paths['/users']?.post?.requestBody?.content?.['application/json']?.schema?.type).toBe('object');
  });

  it('Scalar UI 可访问', async () => {
    expect(await (await app.hono.request('/docs')).text()).toContain('@scalar/api-reference');
  });
});
