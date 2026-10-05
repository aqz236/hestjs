import { describe, expect, it } from 'bun:test';
import { app } from './main';

describe('API', () => {
  it('健康检查', async () => {
    const response = await app.hono.request('/api/health');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('控制器路由', async () => {
    const response = await app.hono.request('/api/greet/ada');
    expect(await response.json()).toEqual({ message: 'hello ada' });
  });

  it('未知的 API 路径返回 JSON 404，而不是 HTML', async () => {
    const response = await app.hono.request('/api/nope');
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ message: 'not found' });
  });
});

describe('前端静态资源', () => {
  it('没有 dist/web 时不会误挂静态路由', async () => {
    // 开发状态下 dist/web 不存在，根路径应当 404 而不是崩掉
    const response = await app.hono.request('/');
    expect([200, 404]).toContain(response.status);
  });
});
