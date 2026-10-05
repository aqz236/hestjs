import 'reflect-metadata';
import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { describe, expect, it } from 'vitest';
import { Container } from '../container/container';
import { Controller } from '../decorators/controller';
import { UseMiddleware } from '../decorators/middleware';
import { Get, Post } from '../decorators/route';
import type { CallHandler, ExecutionContext, Interceptor } from '../interceptors/interceptor';
import { MetadataScanner } from '../metadata/metadata-scanner';
import { RouterExplorer } from './router-explorer';

/** 记录执行轨迹的中间件工厂 */
function tracer(name: string, trace: string[]) {
  return async (c: Context, next: Next) => {
    trace.push(`${name}:before`);
    await next();
    trace.push(`${name}:after`);
  };
}

function buildApp(controller: any) {
  const app = new Hono();
  const container = new Container();
  container.register(controller, controller, 'controller');
  new RouterExplorer(app, container).explore([controller]);
  return app;
}

describe('@UseMiddleware：元数据', () => {
  it('类级中间件记录在类上', () => {
    const mw = (async () => {}) as never;

    @UseMiddleware(mw)
    class Ctrl {}

    expect(MetadataScanner.scanClassMiddlewares(Ctrl)).toEqual([mw]);
  });

  it('方法级中间件记录在对应方法名下', () => {
    const mw = (async () => {}) as never;

    class Ctrl {
      @UseMiddleware(mw)
      handler() {}
    }

    expect(MetadataScanner.scanMethodMiddlewares(Ctrl, 'handler')).toEqual([mw]);
    expect(MetadataScanner.scanMethodMiddlewares(Ctrl, 'other')).toEqual([]);
  });

  it('scanMiddlewares 把类级排在方法级之前', () => {
    const classMw = (async () => {}) as never;
    const methodMw = (async () => {}) as never;

    @UseMiddleware(classMw)
    class Ctrl {
      @UseMiddleware(methodMw)
      handler() {}
    }

    expect(MetadataScanner.scanMiddlewares(Ctrl, 'handler')).toEqual([classMw, methodMw]);
  });

  it('同一处多次使用按声明顺序累积', () => {
    const a = (async () => {}) as never;
    const b = (async () => {}) as never;

    @UseMiddleware(a)
    @UseMiddleware(b)
    class Ctrl {}

    expect(MetadataScanner.scanClassMiddlewares(Ctrl)).toEqual([b, a]);
  });
});

describe('@UseMiddleware：执行', () => {
  it('类级中间件对所有路由生效', async () => {
    const trace: string[] = [];

    @Controller('/a')
    @UseMiddleware(tracer('class', trace))
    class Ctrl {
      @Get('/one')
      one() {
        trace.push('handler:one');
        return { ok: 1 };
      }

      @Get('/two')
      two() {
        trace.push('handler:two');
        return { ok: 2 };
      }
    }

    const app = buildApp(Ctrl);

    await app.request('/a/one');
    expect(trace).toEqual(['class:before', 'handler:one', 'class:after']);

    trace.length = 0;
    await app.request('/a/two');
    expect(trace).toEqual(['class:before', 'handler:two', 'class:after']);
  });

  it('方法级中间件只对声明的方法生效', async () => {
    const trace: string[] = [];

    @Controller('/b')
    class Ctrl {
      @Get('/with')
      @UseMiddleware(tracer('method', trace))
      with() {
        return { ok: true };
      }

      @Get('/without')
      without() {
        return { ok: true };
      }
    }

    const app = buildApp(Ctrl);

    await app.request('/b/without');
    expect(trace).toEqual([]);

    await app.request('/b/with');
    expect(trace).toEqual(['method:before', 'method:after']);
  });

  it('顺序为 类级 → 方法级，均为洋葱模型', async () => {
    const trace: string[] = [];

    @Controller('/c')
    @UseMiddleware(tracer('class', trace))
    class Ctrl {
      @Get('/')
      @UseMiddleware(tracer('method', trace))
      handler() {
        trace.push('handler');
        return { ok: true };
      }
    }

    await buildApp(Ctrl).request('/c');

    expect(trace).toEqual([
      'class:before',
      'method:before',
      'handler',
      'method:after',
      'class:after',
    ]);
  });

  it('中间件可短路，不进入控制器', async () => {
    const trace: string[] = [];

    @Controller('/d')
    class Ctrl {
      @Post('/')
      @UseMiddleware(async (c) => {
        c.status(401);
        return c.json({ blocked: true });
      })
      create() {
        trace.push('should-not-run');
        return { ok: true };
      }
    }

    const res = await buildApp(Ctrl).request('/d', { method: 'POST' });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ blocked: true });
    expect(trace).toEqual([]);
  });

  it('中间件可修改响应头', async () => {
    @Controller('/e')
    class Ctrl {
      @Get('/')
      @UseMiddleware(async (c, next) => {
        await next();
        c.header('X-Trace-Id', 'trace-1');
      })
      handler() {
        return { ok: true };
      }
    }

    const res = await buildApp(Ctrl).request('/e');

    expect(res.headers.get('X-Trace-Id')).toBe('trace-1');
  });

  it('中间件抛出的异常由异常过滤器接管', async () => {
    @Controller('/f')
    class Ctrl {
      @Get('/')
      @UseMiddleware(async () => {
        throw new Error('middleware failed');
      })
      handler() {
        return { ok: true };
      }
    }

    const res = await buildApp(Ctrl).request('/f');

    expect(res.status).toBe(500);
  });

  it('无中间件时行为与未使用该装饰器一致', async () => {
    @Controller('/g')
    class Ctrl {
      @Get('/')
      handler() {
        return { ok: true };
      }
    }

    const res = await buildApp(Ctrl).request('/g');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});

describe('@UseMiddleware：与拦截器的相对顺序', () => {
  it('中间件在最外层，拦截器在其内', async () => {
    const trace: string[] = [];

    class Outer implements Interceptor {
      async intercept(_ctx: ExecutionContext, next: CallHandler) {
        trace.push('interceptor:before');
        const value = await next.handle();
        trace.push('interceptor:after');
        return value;
      }
    }

    @Controller('/h')
    @UseMiddleware(async (_c, next) => {
      trace.push('middleware:before');
      await next();
      trace.push('middleware:after');
    })
    class Ctrl {
      @Get('/')
      handler() {
        trace.push('handler');
        return { ok: true };
      }
    }

    const app = new Hono();
    const container = new Container();
    container.register(Ctrl, Ctrl, 'controller');
    const explorer = new RouterExplorer(app, container);
    explorer.setGlobalInterceptors([new Outer()]);
    explorer.explore([Ctrl]);

    await app.request('/h');

    expect(trace).toEqual([
      'middleware:before',
      'interceptor:before',
      'handler',
      'interceptor:after',
      'middleware:after',
    ]);
  });
});
