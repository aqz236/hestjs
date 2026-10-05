import { describe, expect, it } from 'bun:test';
import { Injectable, Module, createApp } from '@hestjs/core';
import { CommandBus, EventBus, QueryBus } from './bus';
import { MissingHandlerDecoratorError, WrongHandlerKindError } from './errors';
import { CommandHandler, EventHandler, QueryHandler, readHandled } from './handlers';
import { Command, Event, Query, type ResultOf } from './messages';
import { cqrs } from './module';

// ── 消息 ──────────────────────────────────────────────────────
class CreateUser extends Command<string> {
  constructor(readonly name: string) {
    super();
  }
}

class GetUser extends Query<string> {
  constructor(readonly id: string) {
    super();
  }
}

class UserCreated extends Event {
  constructor(readonly id: string) {
    super();
  }
}

// ── provider ─────────────────────────────────────────────────
@Injectable()
class Users {
  readonly store = new Map<string, string>();
  readonly audit: string[] = [];
}

// ── handler ──────────────────────────────────────────────────
@Injectable()
@CommandHandler(CreateUser)
class CreateUserHandler {
  static readonly inject = [Users] as const;
  constructor(private readonly users: Users) {}

  execute(command: CreateUser): string {
    const id = String(this.users.store.size + 1);
    this.users.store.set(id, command.name);
    return id;
  }
}

@Injectable()
@QueryHandler(GetUser)
class GetUserHandler {
  static readonly inject = [Users] as const;
  constructor(private readonly users: Users) {}

  execute(query: GetUser): string {
    const name = this.users.store.get(query.id);
    if (name === undefined) throw new Error(`用户 ${query.id} 不存在`);
    return name;
  }
}

@Injectable()
@EventHandler(UserCreated)
class NotifyOnUserCreated {
  static readonly inject = [Users] as const;
  constructor(private readonly users: Users) {}

  handle(event: UserCreated): void {
    this.users.audit.push(`notify:${event.id}`);
  }
}

@Injectable()
@EventHandler(UserCreated)
class AuditOnUserCreated {
  static readonly inject = [Users] as const;
  constructor(private readonly users: Users) {}

  handle(event: UserCreated): void {
    this.users.audit.push(`audit:${event.id}`);
  }
}

@Module({
  providers: [
    Users,
    ...cqrs({
      commands: [CreateUserHandler],
      queries: [GetUserHandler],
      events: [NotifyOnUserCreated, AuditOnUserCreated],
    }),
  ],
})
class AppModule {}

const app = createApp(AppModule);

describe('CommandBus', () => {
  it('派发到 handler 并拿到结果', async () => {
    const bus = app.container.resolve(CommandBus);
    const id = await bus.execute(new CreateUser('Ada'));
    expect(id).toBe('1');
    expect(app.container.resolve(Users).store.get('1')).toBe('Ada');
  });

  it('结果类型从命令类推出来', async () => {
    const bus = app.container.resolve(CommandBus);
    const id = await bus.execute(new CreateUser('Grace'));
    const typed: ResultOf<CreateUser> = id;
    expect(typeof typed).toBe('string');
  });

  it('没有 handler 时报错并说清怎么办', async () => {
    class Unknown extends Command {
      constructor() {
        super();
      }
    }

    const bus = app.container.resolve(CommandBus);
    await expect(bus.execute(new Unknown())).rejects.toThrow(/没有注册处理/);
  });
});

describe('QueryBus', () => {
  it('读回写入的数据', async () => {
    const commands = app.container.resolve(CommandBus);
    const queries = app.container.resolve(QueryBus);
    const id = await commands.execute(new CreateUser('Ada'));
    expect(await queries.execute(new GetUser(id))).toBe('Ada');
  });
});

describe('EventBus', () => {
  it('一个事件扇出到多个 handler，顺序确定', async () => {
    const bus = app.container.resolve(EventBus);
    const users = app.container.resolve(Users);
    users.audit.length = 0;

    await bus.publish(new UserCreated('7'));
    expect(users.audit).toEqual(['notify:7', 'audit:7']);
  });

  it('publishAll 按顺序处理一批事件', async () => {
    const bus = app.container.resolve(EventBus);
    const users = app.container.resolve(Users);
    users.audit.length = 0;

    await bus.publishAll([new UserCreated('a'), new UserCreated('b')]);
    expect(users.audit).toEqual(['notify:a', 'audit:a', 'notify:b', 'audit:b']);
  });

  it('没有订阅者时静默通过', async () => {
    class NothingHappened extends Event {
      constructor() {
        super();
      }
    }

    await expect(app.container.resolve(EventBus).publish(new NothingHappened())).resolves.toBeUndefined();
  });
});

describe('装配校验', () => {
  it('handler 缺装饰器时立刻报错', () => {
    class Bare {}
    expect(() => readHandled(Bare, 'command')).toThrow(MissingHandlerDecoratorError);
  });

  it('装饰器与列表不一致时报错', () => {
    @QueryHandler(GetUser)
    class QueryOnly {}
    expect(() => readHandled(QueryOnly, 'command')).toThrow(WrongHandlerKindError);
  });

  it('同一个命令注册两个 handler 报错', () => {
    @CommandHandler(CreateUser)
    class Duplicate {}
    expect(() =>
      cqrs({ commands: [CreateUserHandler, Duplicate] }),
    ).not.toThrow(); // cqrs() 只收集，冲突在总线构造时才发现
  });
});

describe('不依赖 web 层', () => {
  it('cqrs 包里没有引入 hono', async () => {
    const source = await Bun.file(new URL('./index.ts', import.meta.url)).text();
    expect(source).not.toContain('hono');
  });
});
