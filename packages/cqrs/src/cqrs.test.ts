import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from './classes/command';
import { Event } from './classes/event';
import { Query } from './classes/query';
import { CommandBus } from './command-bus';
import { COMMAND_HANDLER_METADATA, EVENT_HANDLER_METADATA, QUERY_HANDLER_METADATA, SAGA_METADATA } from './constants';
import { CommandHandler } from './decorators/command-handler.decorator';
import { EventsHandler } from './decorators/events-handler.decorator';
import { QueryHandler } from './decorators/query-handler.decorator';
import { Saga } from './decorators/saga.decorator';
import { EventBus } from './event-bus';
import {
  CommandHandlerNotFoundException,
  InvalidCommandHandlerException,
} from './exceptions';
import { InvalidQueryHandlerException, QueryHandlerNotFoundException } from './exceptions/query.exceptions';
import { QueryBus } from './query-bus';

class CreateUser extends Command<{ id: number }> {
  constructor(public readonly name: string) {
    super();
  }
}

class GetUser extends Query<{ id: number; name: string }> {
  constructor(public readonly id: number) {
    super();
  }
}

class UserCreated extends Event {
  constructor(public readonly id: number) {
    super();
  }
}

describe('装饰器元数据', () => {
  it('@CommandHandler 记录被处理的命令类型', () => {
    @CommandHandler(CreateUser)
    class Handler {
      execute(_cmd: CreateUser) {}
    }

    expect(Reflect.getMetadata(COMMAND_HANDLER_METADATA, Handler)).toBe(CreateUser);
  });

  it('@QueryHandler 记录被处理的查询类型', () => {
    @QueryHandler(GetUser)
    class Handler {
      execute(_q: GetUser) {}
    }

    expect(Reflect.getMetadata(QUERY_HANDLER_METADATA, Handler)).toBe(GetUser);
  });

  it('@EventsHandler 以数组形式记录事件类型（支持一个处理器订阅多个事件）', () => {
    @EventsHandler(UserCreated)
    class Handler {
      handle(_e: UserCreated) {}
    }

    expect(Reflect.getMetadata(EVENT_HANDLER_METADATA, Handler)).toEqual([UserCreated]);
  });

  it('@EventsHandler 可一次订阅多个事件', () => {
    class OtherEvent extends Event {}

    @EventsHandler(UserCreated, OtherEvent)
    class Handler {
      handle(_e: Event) {}
    }

    expect(Reflect.getMetadata(EVENT_HANDLER_METADATA, Handler)).toEqual([
      UserCreated,
      OtherEvent,
    ]);
  });

  it('@Saga 标记处理器为 saga', () => {
    @Saga()
    class MySaga {}

    expect(Reflect.getMetadata(SAGA_METADATA, MySaga)).toBeDefined();
  });
});

describe('CommandBus', () => {
  let bus: CommandBus;

  beforeEach(() => {
    bus = new CommandBus();
  });

  it('注册并执行命令处理器', async () => {
    @CommandHandler(CreateUser)
    class CreateUserHandler {
      async execute(command: CreateUser) {
        return { id: command.name.length };
      }
    }

    bus.register([CreateUserHandler]);

    await expect(bus.execute(new CreateUser('Alice'))).resolves.toEqual({ id: 5 });
  });

  it('未注册的处理器抛 CommandHandlerNotFoundException', async () => {
    await expect(bus.execute(new CreateUser('Alice'))).rejects.toBeInstanceOf(
      CommandHandlerNotFoundException,
    );
  });

  it('缺少 @CommandHandler 装饰器时抛 InvalidCommandHandlerException', () => {
    class Undecorated {
      async execute() {}
    }

    expect(() => bus.register([Undecorated as never])).toThrow(InvalidCommandHandlerException);
  });

  it('处理器抛错时向上传播', async () => {
    @CommandHandler(CreateUser)
    class FailingHandler {
      async execute() {
        throw new Error('handler failed');
      }
    }

    bus.register([FailingHandler]);

    await expect(bus.execute(new CreateUser('x'))).rejects.toThrow('handler failed');
  });

  it('重复注册同一命令会覆盖并告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @CommandHandler(CreateUser)
    class First {
      async execute() {
        return 1;
      }
    }

    @CommandHandler(CreateUser)
    class Second {
      async execute() {
        return 2;
      }
    }

    bus.register([First]);
    bus.register([Second]);

    warn.mockRestore();

    // 覆盖后应执行后注册的那个
    return expect(bus.execute(new CreateUser('x'))).resolves.toBe(2);
  });

  it('执行命令会推送到 observable$ 流', async () => {
    @CommandHandler(CreateUser)
    class Handler {
      async execute() {
        return 'ok';
      }
    }

    bus.register([Handler]);
    const pushed: unknown[] = [];
    bus.observable$.subscribe((cmd) => pushed.push(cmd));

    await bus.execute(new CreateUser('Alice'));

    expect(pushed).toHaveLength(1);
    expect(pushed[0]).toBeInstanceOf(CreateUser);
  });

  // 记录当前行为：publisher 有 getter/setter 与默认实现，但 execute 路径
  // 走的是 ObservableBus 的 publishToSubject，从未调用过 publisher。
  // 即该 API 目前是「可设置但无效」的。
  it('publisher 目前不会被 execute 调用（已知未接线）', async () => {
    @CommandHandler(CreateUser)
    class Handler {
      async execute() {
        return 'ok';
      }
    }

    bus.register([Handler]);
    const publish = vi.fn();
    bus.publisher = { publish } as never;

    await bus.execute(new CreateUser('Alice'));

    expect(publish).not.toHaveBeenCalled();
  });
});

describe('QueryBus', () => {
  let bus: QueryBus;

  beforeEach(() => {
    bus = new QueryBus();
  });

  it('注册并执行查询处理器', async () => {
    @QueryHandler(GetUser)
    class GetUserHandler {
      async execute(query: GetUser) {
        return { id: query.id, name: 'Alice' };
      }
    }

    bus.register([GetUserHandler]);

    await expect(bus.execute(new GetUser(1))).resolves.toEqual({ id: 1, name: 'Alice' });
  });

  it('未注册的处理器抛 QueryHandlerNotFoundException', async () => {
    await expect(bus.execute(new GetUser(1))).rejects.toBeInstanceOf(
      QueryHandlerNotFoundException,
    );
  });

  it('缺少 @QueryHandler 装饰器时抛 InvalidQueryHandlerException', () => {
    class Undecorated {
      async execute() {}
    }

    expect(() => bus.register([Undecorated as never])).toThrow(InvalidQueryHandlerException);
  });
});

describe('EventBus', () => {
  it('注册并分发事件到处理器', async () => {
    const received: number[] = [];

    @EventsHandler(UserCreated)
    class UserCreatedHandler {
      handle(event: UserCreated) {
        received.push(event.id);
      }
    }

    const bus = new EventBus();
    bus.register([UserCreatedHandler]);
    await bus.publish(new UserCreated(42));

    expect(received).toEqual([42]);
  });

  it('publishAll 按顺序分发多个事件', async () => {
    const received: number[] = [];

    @EventsHandler(UserCreated)
    class Handler {
      handle(event: UserCreated) {
        received.push(event.id);
      }
    }

    const bus = new EventBus();
    bus.register([Handler]);
    await bus.publishAll([new UserCreated(1), new UserCreated(2)]);

    expect(received).toEqual([1, 2]);
  });
});
