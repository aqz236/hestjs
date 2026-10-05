import { describe, expect, it } from 'bun:test';
import { app } from './main';

describe('app', () => {
  it('健康检查', async () => {
    const response = await app.hono.request('/health');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('控制器路由', async () => {
    const response = await app.hono.request('/greet/ada');
    expect(await response.json()).toEqual({ message: 'hello ada' });
  });

  it('未匹配的路径走 notFound', async () => {
    expect((await app.hono.request('/nope')).status).toBe(404);
  });
});
