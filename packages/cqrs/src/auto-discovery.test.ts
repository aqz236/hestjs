import 'reflect-metadata';
import { Container, Controller, Get, Injectable, Module } from '@hestjs/core';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it } from 'vitest';
import { Command } from './classes/command';
import { Event } from './classes/event';
import { Query } from './classes/query';
// 触发自动发现钩子的注册（真实使用中由 @hestjs/cqrs 的 index 完成）
import './auto-discovery';
import { CommandBus } from './command-bus';
import { CommandHandler } from './decorators/command-handler.decorator';
import { EventsHandler } from './decorators/events-handler.decorator';
import { QueryHandler } from './decorators/query-handler.decorator';
import { EventBus } from './event-bus';
import { QueryBus } from './query-bus';
import { HestFactory } from '@hestjs/core';

/** #19：handler 必须通过 HestJS 容器解析，而不是 tsyringe 全局容器 */

@Injectable()
class Repository {
  /** 实例身份，用于证明 handler 拿到的是模块容器里那个单例 */
  readonly token = `repo-${Math.random()}`;

  findAll() {
    return [{ id: 1, token: this.token }];
  }
}

class ListItems extends Query<{ id: number; token: string }[]> {}

class CreateItem extends Command<{ ok: boolean }> {}

class ItemCreated extends Event {
  constructor(public readonly id: number) {
    super();
  }
}

@QueryHandler(ListItems)
class ListItemsHandler {
  constructor(private readonly repo: Repository) {}

  async execute() {
    return this.repo.findAll();
  }
}

@CommandHandler(CreateItem)
class CreateItemHandler {
  constructor(private readonly repo: Repository) {}

  async execute() {
    return { ok: this.repo.token.length > 0 };
  }
}

const received: number[] = [];

@EventsHandler(ItemCreated)
class ItemCreatedHandler {
  handle(event: ItemCreated) {
    received.push(event.id);
  }
}

@Module({
  providers: [Repository, ListItemsHandler, CreateItemHandler, ItemCreatedHandler],
  exports: [Repository],
})
class ItemsModule {}

@Module({ imports: [ItemsModule] })
class RootModule {}

/** 找一个注册了指定 token 的容器（含子容器） */
function findContainerOwning(token: unknown): Container | undefined {
  const root = Container.getInstance();
  const queue: Container[] = [root, ...(root.getChildren() as Container[])];
  while (queue.length) {
    const current = queue.shift()!;
    if (current.isRegistered(token)) {
      return current;
    }
    queue.push(...(current.getChildren() as Container[]));
  }
  return undefined;
}

describe('CQRS 自动发现（issue #19）', () => {
  beforeEach(() => {
    received.length = 0;
  });

  it('应用引导后总线拿到的是 HestJS 容器，而不是 tsyringe 全局容器', async () => {
    await HestFactory.create(new Hono(), RootModule);

    const root = Container.getInstance();
    const commandBus = root.resolve(CommandBus);
    const queryBus = root.resolve(QueryBus);
    const eventBus = root.resolve(EventBus);

    expect(commandBus.container).toBe(root);
    expect(queryBus.container).toBe(root);
    expect(eventBus.container).toBe(root);
  });

  it('查询处理器的依赖来自模块容器（同一实例）', async () => {
    await HestFactory.create(new Hono(), RootModule);

    const root = Container.getInstance();
    const moduleContainer = findContainerOwning(Repository);
    expect(moduleContainer).toBeDefined();

    const moduleScopedRepo = moduleContainer!.resolve<Repository>(Repository);
    const queryBus = root.resolve(QueryBus);

    const result = (await queryBus.execute(new ListItems())) as { token: string }[];

    // handler 内部拿到的 repository 必须与模块容器里的那个是同一实例
    expect(result[0].token).toBe(moduleScopedRepo.token);
  });

  it('命令处理器同样经由模块容器解析依赖', async () => {
    await HestFactory.create(new Hono(), RootModule);

    const commandBus = Container.getInstance().resolve(CommandBus);

    await expect(commandBus.execute(new CreateItem())).resolves.toEqual({ ok: true });
  });

  it('事件处理器能注册成功并收到事件', async () => {
    // 早先 auto-discovery 写的是 eventBus.handlers，
    // 而 EventBus 的实际字段是 eventHandlers，事件处理器从未注册成功
    await HestFactory.create(new Hono(), RootModule);

    const eventBus = Container.getInstance().resolveScoped(EventBus);
    await eventBus.publish(new ItemCreated(7));

    // Container 与 ApplicationHooks 都是单例，同一进程内多次 create 会让
    // 同一个 EventBus 实例累积多份 handler。单应用进程不受影响，
    // 因此这里只断言「确实投递到了」且都是同一个事件。
    expect(received.length).toBeGreaterThan(0);
    expect(received.every((id) => id === 7)).toBe(true);
  });

  it('未注入容器时退回 tsyringe 全局容器（保持不经引导的用法可用）', async () => {
    const bus = new CommandBus();

    expect(bus.container).toBeUndefined();

    @CommandHandler(CreateItem)
    class StandaloneHandler {
      async execute() {
        return { ok: true };
      }
    }

    bus.register([StandaloneHandler]);

    await expect(bus.execute(new CreateItem())).resolves.toEqual({ ok: true });
  });
});

describe('CQRS 自动发现：控制器仍可正常使用', () => {
  @Controller('/items')
  class ItemsController {
    constructor(private readonly queryBusStub: Repository) {}

    @Get('/')
    list() {
      return this.queryBusStub.findAll();
    }
  }

  @Module({ imports: [ItemsModule], controllers: [ItemsController] })
  class AppWithControllerModule {}

  it('控制器经模块容器解析', async () => {
    const app = await HestFactory.create(new Hono(), AppWithControllerModule);
    const res = await app.getHonoInstance().request('/items');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toHaveLength(1);
  });
});
