import type { Context, Env } from 'hono';
import { describe, expect, it } from 'bun:test';
import { createApp } from './app';
import { Controller } from './decorators/controller';
import { Injectable } from './decorators/injectable';
import { Module } from './decorators/module';
import { Get, Post } from './decorators/route';
import { DuplicateRouteError, NoRoutesRegisteredError } from './errors';

@Injectable()
class Greeting {
  hello(name: string): string {
    return `hello ${name}`;
  }
}

@Controller('/greet')
class GreetingController {
  static readonly inject = [Greeting] as const;

  constructor(private readonly greeting: Greeting) {}

  @Get('/:name')
  say(c: Context<Env, '/greet/:name'>): Response {
    return c.json({ message: this.greeting.hello(c.req.param('name')) });
  }

  @Post('/')
  create(c: Context): Response {
    return c.json({ ok: true }, 201);
  }
}

@Module({ providers: [Greeting], controllers: [GreetingController] })
class AppModule {}

describe('createApp', () => {
  it('把控制器挂到 Hono 上，并注入依赖', async () => {
    const app = createApp(AppModule);
    const response = await app.hono.request('/greet/ada');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'hello ada' });
  });

  it('POST 路由也在', async () => {
    const app = createApp(AppModule);
    const response = await app.hono.request('/greet', { method: 'POST' });
    expect(response.status).toBe(201);
  });

  it('configure 先于控制器执行，可以包住它们', async () => {
    const app = createApp(AppModule, {
      configure(hono) {
        hono.use('*', async (c, next) => {
          await next();
          c.res.headers.set('x-marked', 'yes');
        });
      },
    });
    const response = await app.hono.request('/greet/ada');
    expect(response.headers.get('x-marked')).toBe('yes');
  });

  it('prefix 会加在所有控制器前面', async () => {
    const app = createApp(AppModule, { prefix: '/api' });
    expect((await app.hono.request('/api/greet/ada')).status).toBe(200);
  });

  it('start 会构造全部单例并跑生命周期', async () => {
    const calls: string[] = [];
    @Injectable()
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

  it('重复路由直接报错', () => {
    @Controller('/dup')
    class DupController {
      @Get('/')
      a(): Response {
        return new Response('a');
      }
    }
    @Controller('/dup')
    class DupController2 {
      @Get('/')
      b(): Response {
        return new Response('b');
      }
    }
    @Module({ controllers: [DupController, DupController2] })
    class DupModule {}

    expect(() => createApp(DupModule)).toThrow(DuplicateRouteError);
  });

  it('有控制器却零路由时给出明确的修复提示', () => {
    @Controller('/silent')
    class SilentController {}

    @Module({ controllers: [SilentController] })
    class SilentModule {}

    expect(() => createApp(SilentModule)).toThrow(NoRoutesRegisteredError);
  });
});
