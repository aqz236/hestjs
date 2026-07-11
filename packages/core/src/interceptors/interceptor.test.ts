import 'reflect-metadata';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { describe, expect, it } from 'vitest';
import {
  DefaultCallHandler,
  DefaultExecutionContext,
  LoggingInterceptor,
  ResponseInterceptor,
  SimpleObservable,
} from './interceptor';

async function captureContext(path = '/x') {
  const app = new Hono();
  let captured!: Context;
  app.get('*', (c) => {
    captured = c;
    return c.text('ok');
  });
  await app.request(path);
  return captured;
}

const handlerRef = { name: 'getUser' };

describe('DefaultExecutionContext', () => {
  it('暴露 classRef / handler / args', async () => {
    const c = await captureContext();
    const args = [1, 'two'];
    class Provider {}
    const ctx = new DefaultExecutionContext(Provider, handlerRef, args, c);

    expect(ctx.getClass()).toBe(Provider);
    expect(ctx.getHandler()).toBe(handlerRef);
    expect(ctx.getArgs()).toBe(args);
    expect(ctx.getArgByIndex(0)).toBe(1);
    expect(ctx.getArgByIndex(1)).toBe('two');
  });

  it('switchToHttp 返回原始 request / response', async () => {
    const c = await captureContext('/hello');
    const ctx = new DefaultExecutionContext(class Provider {}, handlerRef, [], c);
    const http = ctx.switchToHttp();

    expect(http.getRequest()).toBe(c.req);
    expect(http.getResponse()).toBe(c);
  });
});

describe('DefaultCallHandler', () => {
  it('handle 返回同步处理器的结果', async () => {
    const handler = new DefaultCallHandler(() => 42);

    await expect(handler.handle()).resolves.toBe(42);
  });

  it('handle 返回异步处理器的结果', async () => {
    const handler = new DefaultCallHandler(async () => 'async-value');

    await expect(handler.handle()).resolves.toBe('async-value');
  });

  it('处理器抛错时向上传播', async () => {
    const handler = new DefaultCallHandler(() => {
      throw new Error('inner failure');
    });

    await expect(handler.handle()).rejects.toThrow('inner failure');
  });
});

describe('SimpleObservable', () => {
  it('from() 在 promise 完成后回调订阅者', async () => {
    const seen: number[] = [];

    SimpleObservable.from(Promise.resolve(7)).subscribe((v) => seen.push(v));
    await new Promise((r) => setTimeout(r, 0));

    expect(seen).toEqual([7]);
  });
});

describe('ResponseInterceptor', () => {
  it('把结果包装为统一响应体', async () => {
    const c = await captureContext();
    const ctx = new DefaultExecutionContext(class Provider {}, handlerRef, [], c);
    const interceptor = new ResponseInterceptor();

    const result = (await interceptor.intercept(
      ctx,
      new DefaultCallHandler(() => ({ id: 1 })),
    )) as Record<string, unknown>;

    expect(result).toMatchObject({ success: true, data: { id: 1 } });
    expect(typeof result.duration).toBe('string');
    expect(result.duration).toMatch(/ms$/);
    expect(typeof result.timestamp).toBe('string');
  });
});

describe('LoggingInterceptor', () => {
  it('原样透传成功结果', async () => {
    const c = await captureContext('/logged');
    const ctx = new DefaultExecutionContext(class Provider {}, handlerRef, [], c);
    const interceptor = new LoggingInterceptor();

    await expect(
      interceptor.intercept(ctx, new DefaultCallHandler(() => 'payload')),
    ).resolves.toBe('payload');
  });

  it('异常会继续向外抛出，不被吞掉', async () => {
    const c = await captureContext('/logged');
    const ctx = new DefaultExecutionContext(class Provider {}, handlerRef, [], c);
    const interceptor = new LoggingInterceptor();

    await expect(
      interceptor.intercept(
        ctx,
        new DefaultCallHandler(() => {
          throw new Error('downstream');
        }),
      ),
    ).rejects.toThrow('downstream');
  });
});
