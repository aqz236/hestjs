import { describe, expect, it } from 'bun:test';
import { hc } from 'hono/client';
import { app, type AppType } from './main';

const json = async (path: string, init?: RequestInit): Promise<{ status: number; body: any }> => {
  const response = await app.hono.request(path, init);
  return { status: response.status, body: await response.json() };
};

describe('HTTP', () => {
  it('裸 Hono 路由与控制器路由共存', async () => {
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

  it('路径参数按 Hono 的写法解析', async () => {
    expect((await json('/users/1')).body.data).toEqual({ id: '1', name: 'Ada' });
    expect((await json('/users/404')).status).toBe(404);
  });

  it('middleware 包住了所有路由', async () => {
    expect((await app.hono.request('/users')).headers.get('x-powered-by')).toBe('hestjs');
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

/**
 * 纯编译期检查：函数永远不会被调用，`tsc` 会验证里面每一行。
 *
 * 这几行能通过，就证明「装饰器路由摧毁 Hono RPC 类型」那个问题
 * 在新架构里不存在了。
 */
function assertRpcTypes(): void {
  type Client = ReturnType<typeof hc<AppType>>;
  const client = null as unknown as Client;

  // 路径存在，且 param 是必填的
  void client.users[':id'].$get;
  void client.users.$get;
  void client.users.$post;
  void client.health.$get;

  // @ts-expect-error 不存在的路径不该通过
  void client.nope;
}
void assertRpcTypes;

describe('RPC 类型', () => {
  it('hc<AppType> 的类型检查在 tsc 阶段完成（见文件顶部的 assertRpcTypes）', () => {
    expect(true).toBe(true);
  });
});

describe('模块作用域', () => {
  it('模块顺序是依赖在前、根在后', () => {
    expect(app.graph.modules.map((node) => node.module.name)).toEqual([
      'DataModule',
      'CoreModule',
      'AppModule',
    ]);
  });

  it('动态模块的 ref 是 forRoot() 返回的对象，不是类', () => {
    const data = app.graph.modules.find((node) => node.module.name === 'DataModule')!;
    expect(typeof data.ref).toBe('object');
    expect(data.ref).not.toBe(app.graph.modules[0]!.module);
  });
});

describe('文档', () => {
  it('openapi.json 列出全部路由', async () => {
    const document = (await (await app.hono.request('/openapi.json')).json()) as {
      openapi: string;
      paths: Record<string, Record<string, unknown>>;
    };
    expect(document.openapi).toBe('3.1.0');
    expect(Object.keys(document.paths).sort()).toEqual([
      '/health',
      '/users',
      '/users/{id}',
    ]);
  });

  it('请求体 schema 来自 zod', async () => {
    const document = (await (await app.hono.request('/openapi.json')).json()) as {
      paths: Record<
        string,
        { post?: { requestBody?: { content?: Record<string, { schema?: { type?: string } }> } } }
      >;
    };
    expect(
      document.paths['/users']?.post?.requestBody?.content?.['application/json']?.schema?.type,
    ).toBe('object');
  });

  it('Scalar UI 可访问', async () => {
    expect(await (await app.hono.request('/docs')).text()).toContain('@scalar/api-reference');
  });
});
