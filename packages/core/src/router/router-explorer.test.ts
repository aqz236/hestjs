import 'reflect-metadata';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it } from 'vitest';
import type { HestContext } from '../interfaces/application';
import { Container } from '../container/container';
import { Controller } from '../decorators/controller';
import { Injectable } from '../decorators/injectable';
import { Body, Context, Get, Param, Post, Query } from '../decorators/route';
import type { ExceptionFilter, ArgumentsHost } from '../exceptions/exception-filter';
import { HttpException, NotFoundException } from '../exceptions/http-exception';
import type { CallHandler, ExecutionContext, Interceptor } from '../interceptors/interceptor';
import { RouterExplorer } from './router-explorer';

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

  // 注意：静态路径必须声明在同层级的参数路径之前。
  // RouterExplorer 按声明顺序注册路由，先注册的 /:id 会遮蔽后注册的 /ctx。
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

  it('先声明的参数路由会遮蔽后声明的静态路径', async () => {
    const app = new Hono();
    const container = new Container();
    container.register(PrioController, PrioController, 'controller');
    new RouterExplorer(app, container).explore([PrioController]);

    const res = await app.request('/prio/static');

    await expect(res.json()).resolves.toEqual({ matched: 'param', id: 'static' });
  });
});
