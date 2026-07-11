import 'reflect-metadata';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { describe, expect, it } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  DefaultArgumentsHost,
  DefaultExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpExceptionFilter,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '../exceptions';
import type { HttpStatus } from '../exceptions/base-exception';

/** 用真实的 Hono Context 构造 ArgumentsHost，避免手写 mock 失真 */
async function captureContext(path = '/test'): Promise<Context> {
  const app = new Hono();
  let captured!: Context;
  app.get('*', (c) => {
    captured = c;
    return c.text('ok');
  });
  await app.request(path);
  return captured;
}

describe('HttpException 及子类', () => {
  it('基类保存 status 与 message', () => {
    // 注意签名是 (response, status, options)，不是 (status, message)
    const err = new HttpException('I am a teapot', 418);

    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(418);
    expect(err.message).toBe('I am a teapot');
  });

  it('子类映射到正确的状态码', () => {
    const cases: Array<[HttpException, HttpStatus]> = [
      [new BadRequestException(), 400],
      [new UnauthorizedException(), 401],
      [new ForbiddenException(), 403],
      [new NotFoundException(), 404],
      [new ConflictException(), 409],
      [new UnprocessableEntityException(), 422],
      [new InternalServerErrorException(), 500],
    ];

    for (const [err, status] of cases) {
      expect(err.status, err.constructor.name).toBe(status);
    }
  });

  // 记录当前缺陷：传入结构化对象时只读取其中的 message 字段，
  // 其余字段被丢弃，且不会出现在 getResponse() 里。
  // 见 issue「HttpException 丢弃结构化响应体」。
  it('结构化 response 对象的额外字段目前会被丢弃', () => {
    const err = new BadRequestException({ field: 'email', reason: 'invalid' });

    expect(err.status).toBe(400);
    expect(err.message).toBe('Http Exception');
    expect(JSON.stringify(err.getResponse())).not.toContain('email');
  });

  it('允许自定义描述覆盖默认文案', () => {
    const err = new NotFoundException('用户不存在', 'USER_NOT_FOUND');

    expect(err.message).toBe('用户不存在');
  });
});

describe('DefaultArgumentsHost', () => {
  it('暴露底层 Context / request / response', async () => {
    const c = await captureContext('/hello?a=1');
    const host = new DefaultArgumentsHost(c);

    expect(host.getContext()).toBe(c);
    expect(host.getRequest()).toBe(c.req);
    expect(host.getResponse()).toBe(c);
  });
});

describe('DefaultExceptionFilter', () => {
  it('HttpException 按其状态码返回 JSON', async () => {
    const c = await captureContext();
    const res = new DefaultExceptionFilter().catch(
      new NotFoundException('未找到'),
      new DefaultArgumentsHost(c),
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ statusCode: 404 });
  });

  it('普通 Error 归为 500', async () => {
    const c = await captureContext();
    const res = new DefaultExceptionFilter().catch(
      new Error('boom'),
      new DefaultArgumentsHost(c),
    );

    expect(res.status).toBe(500);
  });

  it('非 Error 抛出物也能兜底', async () => {
    const c = await captureContext();
    const res = new DefaultExceptionFilter().catch(
      'plain string',
      new DefaultArgumentsHost(c),
    );

    expect(res.status).toBe(500);
  });
});

describe('HttpExceptionFilter', () => {
  it('只处理传给它的异常并返回 JSON', async () => {
    const c = await captureContext();
    const res = new HttpExceptionFilter().catch(
      new BadRequestException('参数错误'),
      new DefaultArgumentsHost(c),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ statusCode: 400 });
  });
});
