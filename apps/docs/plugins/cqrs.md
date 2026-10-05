# CQRS

`@hestjs/cqrs` 是纯 TypeScript 的：包里没有任何 `hono` 引用，可以单独用。

## 三条消息

```ts
import { Command, Query, Event } from '@hestjs/cqrs';

class CreateUser extends Command<string> {
  constructor(readonly name: string) {
    super();   // 基类构造必须调
  }
}

class GetUser extends Query<User> {
  constructor(readonly id: string) {
    super();
  }
}

class UserCreated extends Event {
  constructor(readonly id: string) {
    super();
  }
}
```

泛型参数只用于类型推导，不产生运行时代码。继承它们是为了让
`ResultOf<CreateUser>` 能推出 `string`。

## Handler

```ts
@CommandHandler(CreateUser)
class CreateUserHandler {
  constructor(@Inject(Users) private readonly users: Users) {}

  execute(command: CreateUser): string {
    return this.users.add(command.name);
  }
}
```

| 装饰器 | 方法 | 数量 |
| --- | --- | --- |
| `@CommandHandler(Cmd)` | `execute` | 每条命令一个 |
| `@QueryHandler(Q)` | `execute` | 每条查询一个 |
| `@EventHandler(E)` | `handle` | 每条事件可以多个 |

## 一次性注册

```ts
@Module({
  imports: [DataModule],
  providers: [
    UserController,
    ...cqrs({
      commands: [CreateUserHandler],
      queries: [GetUserHandler],
      events: [NotifyOnUserCreated, AuditOnUserCreated],
    }),
  ],
})
class UserModule {}
```

`cqrs()` 同时注册 handler 和三条总线，返回的是普通 provider 数组。

**handler 必须显式列出来。** 不扫目录、不建全局注册表——
和框架整体的取舍一致：看得见的东西才可信。

## 派发

```ts
class UserController {
  constructor(
    @Inject(CommandBus) private readonly commands: CommandBus,
    @Inject(QueryBus) private readonly queries: QueryBus,
    @Inject(EventBus) private readonly events: EventBus,
  ) {}

  async create(c: Context): Promise<Response> {
    const id = await this.commands.execute(new CreateUser('Ada'));
    await this.events.publish(new UserCreated(id));
    return c.json({ id }, 201);
  }

  async detail(c: Context<Env, '/users/:id'>): Promise<Response> {
    return c.json(await this.queries.execute(new GetUser(c.req.param('id'))));
  }
}
```

`execute()` 的返回类型从消息类推出来，不需要手写泛型。

## 事件的顺序

事件按 `cqrs({ events: [...] })` 里的声明顺序**串行**执行，
所以 handler 之间的先后是确定的。需要并行自己包 `Promise.all`。

没有订阅者的事件静默通过——事件是广播，没人听不是错误。

## 装配错误

| 情况 | 错误 |
| --- | --- |
| handler 没装饰器就写进列表 | `MissingHandlerDecoratorError` |
| 装饰器说它是 query，却放进 commands | `WrongHandlerKindError` |
| 一条命令注册两个 handler | `HandlerAlreadyRegisteredError` |
| 派发时找不到 handler | `HandlerNotFoundError` |

前三条在建图时就会炸，不会等到请求进来。
