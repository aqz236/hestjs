import type { Context } from 'hono';
import { describe, expect, it } from 'bun:test';
import { Controller, Get, Injectable, Module, Post, createApp } from '@hestjs/core';
import { createTestApp, jsonBody } from './index';

const CLOCK = Symbol('clock');
const DB = Symbol('db');

@Injectable()
class Users {
  static readonly inject = [DB, CLOCK] as const;

  constructor(
    private readonly db: { find(id: string): string | undefined },
    private readonly now: () => string,
  ) {}

  get(id: string): string | undefined {
    return this.db.find(id);
  }

  stamp(): string {
    return this.now();
  }
}

@Controller('/users')
class UsersController {
  static readonly inject = [Users] as const;

  constructor(private readonly users: Users) {}

  @Get('/')
  index(c: Context): Response {
    return c.json({ id: this.users.get('1'), at: this.users.stamp() });
  }

  @Post('/')
  create(c: Context): Response {
    return c.json({ created: true }, 201);
  }
}

@Module({
  providers: [
    { provide: DB, useValue: { find: (id: string) => `real-${id}` } },
    { provide: CLOCK, useFactory: () => () => 'real-time' },
    Users,
  ],
  controllers: [UsersController],
})
class AppModule {}

describe('createTestApp', () => {
  it('已经 start 过，直接能发请求', async () => {
    const app = await createTestApp(AppModule);
    expect(await app.status('/users')).toBe(200);
    await app.close();
  });

  it('json / text / status 便利方法', async () => {
    const app = await createTestApp(AppModule);
    expect(await app.json<{ id: string; at: string }>('/users')).toEqual({
      id: 'real-1',
      at: 'real-time',
    });
    expect(await app.text('/nope')).not.toBe('');
    expect(await app.status('/users', { method: 'POST' })).toBe(201);
    await app.close();
  });

  it('postJson 一步到位', async () => {
    const app = await createTestApp(AppModule);
    expect(await app.postJson<{ created: boolean }>('/users', { name: 'Ada' })).toEqual({
      created: true,
    });
    await app.close();
  });

  it('overrides 换掉真实依赖', async () => {
    const app = await createTestApp(AppModule, {
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
      createTestApp(AppModule, { overrides: [{ provide: Symbol('typo'), useValue: 1 }] }),
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
  it('createTestApp 是 createApp + start + 便利方法，不引入第二套运行时', async () => {
    const raw = createApp(AppModule);
    await raw.start();
    const tested = await createTestApp(AppModule);

    const fromRaw = await raw.hono.request('/users');
    const fromTested = await tested.hono.request('/users');
    const [a, b] = [await fromRaw.json(), await fromTested.json()];
    expect(a).toEqual(b);

    await raw.stop();
    await tested.close();
  });
});
