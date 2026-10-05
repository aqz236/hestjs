import 'reflect-metadata';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it } from 'vitest';
import type { HestContext } from '../interfaces/application';
import { Container } from '../container/container';
import { Controller } from '../decorators/controller';
import { Injectable } from '../decorators/injectable';
import { Body, Context, Get, Param, Post, Query } from '../decorators/route';
import type { ExceptionFilter, ArgumentsHost } from '../exceptions/exception-filter';
import { BadRequestException, HttpException, NotFoundException } from '../exceptions/http-exception';
import type { CallHandler, ExecutionContext, Interceptor } from '../interceptors/interceptor';
import { compareRouteSpecificity, RouterExplorer } from './router-explorer';

@Injectable()
class ItemsService {
  private readonly items = [
    { id: 1, name: 'alpha' },
    { id: 2, name: 'beta' },
  ];

  findAll() {
    return this.items;
  }

  findOne(id: number) {
    return this.items.find((i) => i.id === id);
  }

  create(input: { name: string }) {
    const item = { id: this.items.length + 1, ...input };
    this.items.push(item);
    return item;
  }
}

@Controller('/api/items')
class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // 声明顺序不再影响匹配：RouterExplorer 注册前会按静态段优先排序。
  // 这里刻意保持 /:id 在 /ctx 之前，用于验证该排序生效。
  @Get('/')
  list() {
    return this.itemsService.findAll();
  }

  @Get('/ctx')
  ctx(@Context() c: HestContext) {
    return { hasReq: Boolean(c.req) };
  }

  @Get('/search/by-name')
  search(@Query('q') q: string, @Query('limit') limit: string) {
    return { q, limit };
  }

  @Post('/')
  create(@Body() body: { name: string }) {
    return this.itemsService.create(body);
  }

  @Get('/:id')
  detail(@Param('id') id: string) {
    const item = this.itemsService.findOne(Number(id));
    if (!item) {
      throw new NotFoundException(`item ${id} not found`);
    }
    return item;
  }
}

function buildApp(configure?: (explorer: RouterExplorer) => void) {
  const hono = new Hono();
  const container = new Container();
  container.register(ItemsService, ItemsService, 'provider');
  container.register(ItemsController, ItemsController, 'controller');

  const explorer = new RouterExplorer(hono, container);
  configure?.(explorer);
  explorer.explore([ItemsController]);

  return { hono, container, explorer };
}

describe('RouterExplorer（集成）', () => {
  let hono: Hono;

  beforeEach(() => {
    hono = buildApp().hono;
  });

  it('注册 GET 路由并用容器解析出的控制器处理请求', async () => {
    const res = await hono.request('/api/items');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([
      { id: 1, name: 'alpha' },
      { id: 2, name: 'beta' },
    ]);
  });

  it('@Param 注入路径参数', async () => {
    const res = await hono.request('/api/items/2');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: 2, name: 'beta' });
  });

  it('@Query 注入查询参数', async () => {
    const res = await hono.request('/api/items/search/by-name?q=alpha&limit=5');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ q: 'alpha', limit: '5' });
  });

  it('@Body 注入 JSON 请求体', async () => {
    const res = await hono.request('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'gamma' }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: 3, name: 'gamma' });
  });

  it('控制器抛出的 HttpException 经默认过滤器转为对应状态码', async () => {
    const res = await hono.request('/api/items/999');

    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ statusCode: 404 });
  });

  it('构造函数注入生效：服务是单例，两次请求共享状态', async () => {
    await hono.request('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'gamma' }),
    });

    const res = await hono.request('/api/items');
    const items = (await res.json()) as unknown[];

    expect(items).toHaveLength(3);
  });

  it('@Context 注入 Hono Context', async () => {
    const res = await hono.request('/api/items/ctx');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ hasReq: true });
  });
});

describe('RouterExplorer：全局拦截器', () => {
  it('按注册顺序执行，并能改写返回值', async () => {
    const order: string[] = [];

    class First implements Interceptor {
      async intercept(_ctx: ExecutionContext, next: CallHandler) {
        order.push('first:before');
        const value = await next.handle();
        order.push('first:after');
        return value;
      }
    }

    class Second implements Interceptor {
      async intercept(_ctx: ExecutionContext, next: CallHandler) {
        order.push('second:before');
        const value = await next.handle();
        order.push('second:after');
        return { wrapped: value };
      }
    }

    const { hono } = buildApp((explorer) => {
      explorer.setGlobalInterceptors([new First(), new Second()]);
    });

    const res = await hono.request('/api/items/1');

    expect(order).toEqual([
      'first:before',
      'second:before',
      'second:after',
      'first:after',
    ]);
    await expect(res.json()).resolves.toEqual({
      wrapped: { id: 1, name: 'alpha' },
    });
  });

  it('未注册拦截器时行为不变', async () => {
    const { hono } = buildApp();
    const res = await hono.request('/api/items/1');

    await expect(res.json()).resolves.toEqual({ id: 1, name: 'alpha' });
  });
});

describe('RouterExplorer：全局异常过滤器', () => {
  it('自定义过滤器优先于默认过滤器', async () => {
    class TeapotFilter implements ExceptionFilter {
      catch(error: unknown, _host: ArgumentsHost) {
        const status = error instanceof HttpException ? error.status : 500;
        return new Response(JSON.stringify({ handledBy: 'custom', status }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const { hono } = buildApp((explorer) => {
      explorer.setGlobalFilters([new TeapotFilter()]);
    });

    const res = await hono.request('/api/items/999');

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ handledBy: 'custom', status: 404 });
  });
});

describe('RouterExplorer：同层级路由优先级', () => {
  @Controller('/prio')
  class PrioController {
    @Get('/:id')
    byId(@Param('id') id: string) {
      return { matched: 'param', id };
    }

    @Get('/static')
    staticRoute() {
      return { matched: 'static' };
    }
  }

  it('即使参数路由先声明，静态路径仍然优先命中', async () => {
    const app = new Hono();
    const container = new Container();
    container.register(PrioController, PrioController, 'controller');
    new RouterExplorer(app, container).explore([PrioController]);

    const res = await app.request('/prio/static');

    await expect(res.json()).resolves.toEqual({ matched: 'static' });
  });

  it('参数路径仍能正常匹配', async () => {
    const app = new Hono();
    const container = new Container();
    container.register(PrioController, PrioController, 'controller');
    new RouterExplorer(app, container).explore([PrioController]);

    const res = await app.request('/prio/42');

    await expect(res.json()).resolves.toEqual({ matched: 'param', id: '42' });
  });
});

describe('compareRouteSpecificity', () => {
  const order = (paths: string[]) =>
    paths.map((path) => ({ path })).sort(compareRouteSpecificity).map((r) => r.path);

  it('同层级静态段排在参数段之前', () => {
    expect(order(['/:id', '/static'])).toEqual(['/static', '/:id']);
  });

  it('多段路径逐段比较', () => {
    expect(order(['/a/:x/:y', '/a/b/:y', '/a/b/c'])).toEqual([
      '/a/b/c',
      '/a/b/:y',
      '/a/:x/:y',
    ]);
  });

  it('相同优先级时保持原有顺序（稳定排序）', () => {
    expect(order(['/:a', '/:b'])).toEqual(['/:a', '/:b']);
  });

  it('不相关路径不影响彼此的相对顺序', () => {
    expect(order(['/x', '/y'])).toEqual(['/x', '/y']);
  });
});

describe('RouterExplorer：结构化异常到达客户端', () => {
  @Controller('/structured')
  class StructuredErrorController {
    @Get('/')
    fail(): never {
      throw new BadRequestException({
        message: '参数校验失败',
        error: 'VALIDATION_FAILED',
        field: 'email',
        reason: 'invalid format',
      });
    }
  }

  it('details 会出现在 HTTP 响应体中', async () => {
    const app = new Hono();
    const container = new Container();
    container.register(StructuredErrorController, StructuredErrorController, 'controller');
    new RouterExplorer(app, container).explore([StructuredErrorController]);

    const res = await app.request('/structured');
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(body).toMatchObject({
      message: '参数校验失败',
      error: 'VALIDATION_FAILED',
      details: { field: 'email', reason: 'invalid format' },
    });
  });
});

describe('RouterExplorer：控制器直接返回 Response', () => {
  @Controller('/raw')
  class RawResponseController {
    @Get('/not-found')
    notFound(@Context() c: HestContext) {
      return c.json({ error: 'not found' }, 404);
    }

    @Get('/teapot')
    teapot() {
      return new Response('teapot', { status: 418 });
    }

    @Get('/plain')
    plain() {
      return { ok: true };
    }
  }

  function build() {
    const app = new Hono();
    const container = new Container();
    container.register(RawResponseController, RawResponseController, 'controller');
    new RouterExplorer(app, container).explore([RawResponseController]);
    return app;
  }

  it('c.json(data, status) 的状态码与响应体被保留', async () => {
    const res = await build().request('/raw/not-found');

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not found' });
  });

  it('new Response(...) 被原样返回', async () => {
    const res = await build().request('/raw/teapot');

    expect(res.status).toBe(418);
    await expect(res.text()).resolves.toBe('teapot');
  });

  it('返回普通对象时仍按 JSON 处理', async () => {
    const res = await build().request('/raw/plain');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
