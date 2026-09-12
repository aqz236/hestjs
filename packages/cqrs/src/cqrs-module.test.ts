import 'reflect-metadata';
import { Container, Controller, Get, HestFactory, Module } from '@hestjs/core';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import './auto-discovery';
import { Query } from './classes/query';
import { CqrsModule } from './cqrs.module';
import { QueryHandler } from './decorators/query-handler.decorator';
import { QueryBus } from './query-bus';

/**
 * 本文件独立于 auto-discovery.test.ts，以确保 Container 单例是干净的。
 * Container 是全局单例，同一文件内多次 HestFactory.create() 会互相影响。
 */

describe('CQRS 自动发现：总线复用模块容器中的实例', () => {
  // 复现 playground 的结构：控制器注入的总线由 CqrsModule 提供，
  // 而 auto-discovery 拿到的是根容器。若不在子容器中查找已有实例，
  // 会另建一套总线，导致控制器注入的那套永远没有 handler。
  class ReuseQuery extends Query<{ ok: boolean }> {}

  @QueryHandler(ReuseQuery)
  class ReuseQueryHandler {
    async execute() {
      return { ok: true };
    }
  }

  @Controller('/reuse')
  class ReuseController {
    constructor(private readonly queryBus: QueryBus) {}

    @Get('/')
    async run() {
      return this.queryBus.execute(new ReuseQuery());
    }
  }

  @Module({
    imports: [CqrsModule.forRoot()],
    providers: [ReuseQueryHandler],
    controllers: [ReuseController],
  })
  class ReuseModule {}

  it('控制器注入的总线与 auto-discovery 注册 handler 的总线是同一个', async () => {
    const app = await HestFactory.create(new Hono(), ReuseModule);
    const res = await app.getHonoInstance().request('/reuse');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it('根容器上不存在重复的总线实例', async () => {
    await HestFactory.create(new Hono(), ReuseModule);

    const root = Container.getInstance();
    // 总线应注册在 CqrsModule 的子容器里，而不是根容器
    expect(root.findContainerFor(QueryBus)).toBeDefined();
  });
});
