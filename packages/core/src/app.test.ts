import type { Context, Env } from 'hono';
import { describe, expect, it } from 'bun:test';
import { createApp } from './app';
import { Inject } from './decorators/inject';
import { Injectable } from './decorators/injectable';
import { Module } from './decorators/module';
import { UnknownOverrideError } from './errors';
import { attachRouteMeta, findRouteMeta, readRouteMeta } from './route-meta';
import type { DocumentationRouteMeta } from './route-meta';

class Greeting {
  hello(name: string): string {
    return `hello ${name}`;
  }
}

class GreetingController {
  constructor(@Inject(Greeting) readonly greeting: Greeting) {}

  say(c: Context<Env, '/greet/:name'>): Response {
    return c.json({ message: this.greeting.hello(c.req.param('name')) });
  }
}

@Module({ providers: [Greeting, GreetingController] })
class AppModule {}

describe('createApp', () => {
  it('routes 里用 resolve 拿控制器，返回链式 Hono', async () => {
    const app = createApp(AppModule, {
      routes: (hono, resolve) => hono.get('/greet/:name', (c) => resolve(GreetingController).say(c)),
    });

    const response = await app.hono.request('/greet/ada');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'hello ada' });
  });

  it('middleware 在路由之前执行，能包住它们', async () => {
    const app = createApp(AppModule, {
      middleware: [
        async (c, next) => {
          await next();
          c.res.headers.set('x-marked', 'yes');
        },
      ],
      routes: (hono, resolve) => hono.get('/greet/:name', (c) => resolve(GreetingController).say(c)),
    });

    expect((await app.hono.request('/greet/ada')).headers.get('x-marked')).toBe('yes');
  });

  it('不写 routes 也能用，app.hono 就是裸 Hono', async () => {
    const app = createApp(AppModule);
    expect(await app.hono.request('/nope')).toBeDefined();
  });

  it('路由元数据能挂上去、读回来，且不改变 handler 类型', async () => {
    const app = createApp(AppModule, {
      routes: (hono, resolve) =>
        hono.get(
          '/greet/:name',
          attachRouteMeta((c: Context<Env, '/greet/:name'>) => resolve(GreetingController).say(c), {
            kind: 'documentation',
            summary: '打个招呼',
          }),
        ),
    });

    const route = app.hono.routes[0]!;
    const doc = findRouteMeta(route.handler, 'documentation') as DocumentationRouteMeta | undefined;
    expect(doc?.summary).toBe('打个招呼');
    expect(readRouteMeta(route.handler)).toHaveLength(1);
    expect((await app.hono.request('/greet/ada')).status).toBe(200);
  });

  it('start 构造全部单例并跑生命周期，stop 逆序', async () => {
    const calls: string[] = [];

    class Probe {
      onStart(): void {
        calls.push('start');
      }
      onStop(): void {
        calls.push('stop');
      }
    }

    @Module({ providers: [Probe] })
    class LifecycleModule {}

    const app = createApp(LifecycleModule);
    await app.start();
    await app.stop();
    expect(calls).toEqual(['start', 'stop']);
  });

  it('overrides 换掉真实依赖', async () => {
    const app = createApp(AppModule, {
      overrides: [{ provide: Greeting, useValue: { hello: (name: string) => `fake ${name}` } }],
      routes: (hono, resolve) => hono.get('/greet/:name', (c) => resolve(GreetingController).say(c)),
    });

    expect(await (await app.hono.request('/greet/ada')).json()).toEqual({ message: 'fake ada' });
  });

  it('overrides 写错 token 立刻报错', () => {
    expect(() => createApp(AppModule, { overrides: [{ provide: Symbol('typo'), useValue: 1 }] })).toThrow(
      UnknownOverrideError,
    );
  });

  it('@Injectable 的 scope 生效', () => {
    @Injectable({ scope: 'transient' })
    class PerCall {}

    @Module({ providers: [PerCall] })
    class ScopeModule {}

    const app = createApp(ScopeModule);
    expect(app.container.resolve(PerCall)).not.toBe(app.container.resolve(PerCall));
  });
});
