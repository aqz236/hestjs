import type { Context } from 'hono';
import { describe, expect, it } from 'bun:test';
import { Inject, Module, createApp } from '@hestjs/core';
import { createTestApp, jsonBody } from './index';

const CLOCK = Symbol('clock');
const DB = Symbol('db');

class Users {
  constructor(
    @Inject(DB) private readonly db: { find(id: string): string | undefined },
    @Inject(CLOCK) private readonly now: () => string,
  ) {}

  get(id: string): string | undefined {
    return this.db.find(id);
  }

  stamp(): string {
    return this.now();
  }
}

@Module({
  providers: [
    { provide: DB, useValue: { find: (id: string) => `real-${id}` } },
    { provide: CLOCK, useFactory: () => () => 'real-time' },
    Users,
  ],
})
class AppModule {}

const routes = (hono: any, resolve: any) =>
  hono
    .get('/users', (c: Context) => c.json({ id: resolve(Users).get('1'), at: resolve(Users).stamp() }))
    .post('/users', (c: Context) => c.json({ created: true }, 201));

describe('createTestApp', () => {
  it('已经 start 过，直接能发请求', async () => {
    const app = await createTestApp(AppModule, { routes });
    expect(await app.status('/users')).toBe(200);
    await app.close();
  });

  it('json / text / status 便利方法', async () => {
    const app = await createTestApp(AppModule, { routes });
    expect(await app.json<{ id: string; at: string }>('/users')).toEqual({
      id: 'real-1',
      at: 'real-time',
    });
    expect(await app.status('/users', { method: 'POST' })).toBe(201);
    await app.close();
  });

  it('postJson 一步到位', async () => {
    const app = await createTestApp(AppModule, { routes });
    expect(await app.postJson<{ created: boolean }>('/users', { name: 'Ada' })).toEqual({
      created: true,
    });
    await app.close();
  });

  it('overrides 换掉真实依赖', async () => {
    const app = await createTestApp(AppModule, {
      routes,
      overrides: [
        { provide: DB, useValue: { find: (id: string) => `fake-${id}` } },
        { provide: CLOCK, useValue: () => 'frozen-time' },
      ],
    });
    expect(await app.json<{ id: string; at: string }>('/users')).toEqual({
      id: 'fake-1',
      at: 'frozen-time',
    });
    await app.close();
  });

  it('overrides 写错 token 立刻报错，而不是假装换掉了', async () => {
    await expect(
      createTestApp(AppModule, { routes, overrides: [{ provide: Symbol('typo'), useValue: 1 }] }),
    ).rejects.toThrow(/没有对应的真实 provider/);
  });
});

describe('jsonBody', () => {
  it('拼出正确的 init', () => {
    expect(jsonBody({ a: 1 })).toEqual({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"a":1}',
    });
  });
});

describe('与 createApp 的关系', () => {
  it('createTestApp 就是 createApp + start + 便利方法，不引入第二套运行时', async () => {
    const raw = createApp(AppModule, { routes });
    await raw.start();
    const tested = await createTestApp(AppModule, { routes });

    const [a, b] = [
      await (await raw.hono.request('/users')).json(),
      await (await tested.hono.request('/users')).json(),
    ];
    expect(a).toEqual(b);

    await raw.stop();
    await tested.close();
  });
});
