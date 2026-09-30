# @hestjs/cqrs

HestJS CQRS - Command Query Responsibility Segregation module for HestJS

## 安装

```bash
npm install @hestjs/cqrs
```

## 基本用法

### 1. 初始化CQRS模块

```typescript
import { CqrsModule } from "@hestjs/cqrs";

// 基本初始化
CqrsModule.forRoot();

// 或者使用选项
CqrsModule.forRoot({
  // 自定义配置
});
```

### 2. 创建Command

```typescript
import { Command } from "@hestjs/cqrs";

export class CreateUserCommand extends Command<string> {
  constructor(
    public readonly name: string,
    public readonly email: string
  ) {
    super();
  }
}
```

### 3. 创建Command Handler

```typescript
import { CommandHandler, ICommandHandler } from "@hestjs/cqrs";
import { CreateUserCommand } from "./create-user.command";

@CommandHandler(CreateUserCommand)
export class CreateUserHandler
  implements ICommandHandler<CreateUserCommand, string>
{
  async execute(command: CreateUserCommand): Promise<string> {
    // 处理命令逻辑
    console.log(`Creating user: ${command.name} (${command.email})`);
    return "user-id-123";
  }
}
```

### 4. 创建Query

```typescript
import { Query, IQueryResult } from "@hestjs/cqrs";

export class GetUserQuery extends Query<GetUserResult> {
  constructor(public readonly userId: string) {
    super();
  }
}

export class GetUserResult implements IQueryResult {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string
  ) {}
}
```

### 5. 创建Query Handler

```typescript
import { QueryHandler, IQueryHandler } from "@hestjs/cqrs";
import { GetUserQuery, GetUserResult } from "./get-user.query";

@QueryHandler(GetUserQuery)
export class GetUserHandler
  implements IQueryHandler<GetUserQuery, GetUserResult>
{
  async execute(query: GetUserQuery): Promise<GetUserResult> {
    // 查询逻辑
    return new GetUserResult(query.userId, "John Doe", "john@example.com");
  }
}
```

### 6. 创建Event

```typescript
import { Event } from "@hestjs/cqrs";

export class UserCreatedEvent extends Event {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly email: string
  ) {
    super(userId);
  }
}
```

### 7. 创建Event Handler

```typescript
import { EventsHandler, IEventHandler } from "@hestjs/cqrs";
import { UserCreatedEvent } from "./user-created.event";

@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // 处理事件逻辑
    console.log(`User created: ${event.name} (${event.email})`);
  }
}
```

### 8. 在控制器中使用

```typescript
import { Controller, Post } from "@hestjs/core";
import { CommandBus, QueryBus, EventBus } from "@hestjs/cqrs";
import { CreateUserCommand } from "./commands/create-user.command";
import { GetUserQuery } from "./queries/get-user.query";
import { UserCreatedEvent } from "./events/user-created.event";

@Controller("/users")
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus
  ) {}

  @Post()
  async createUser(data: { name: string; email: string }) {
    const command = new CreateUserCommand(data.name, data.email);
    const userId = await this.commandBus.execute(command);

    // 发布事件
    const event = new UserCreatedEvent(userId, data.name, data.email);
    await this.eventBus.publish(event);

    return { userId };
  }

  @Get("/:id")
  async getUser(id: string) {
    const query = new GetUserQuery(id);
    return await this.queryBus.execute(query);
  }
}
```

### 9. 注册处理器

```typescript
import { CqrsModule } from "@hestjs/cqrs";
import { CreateUserHandler } from "./handlers/create-user.handler";
import { GetUserHandler } from "./handlers/get-user.handler";
import { UserCreatedHandler } from "./handlers/user-created.handler";

// 初始化CQRS模块
CqrsModule.forRoot();

// 获取CQRS模块实例
const cqrsModule = CqrsModule.getInstance();

// 注册处理器
cqrsModule.registerHandler(CreateUserHandler);
cqrsModule.registerHandler(GetUserHandler);
cqrsModule.registerHandler(UserCreatedHandler);

// 启动应用时调用
await cqrsModule.onApplicationBootstrap();
```

### 10. Saga (长期运行的流程)

```typescript
import { Saga, ICommand } from "@hestjs/cqrs";
import { UserCreatedEvent } from "./events/user-created.event";
import { SendWelcomeEmailCommand } from "./commands/send-welcome-email.command";

@Saga()
export class UserSaga {
  // 当用户创建事件发生时，发送欢迎邮件
  async onUserCreatedEvent(event: UserCreatedEvent): Promise<ICommand[]> {
    return [new SendWelcomeEmailCommand(event.userId, event.email)];
  }
}
```

## API 参考

### 装饰器

- `@CommandHandler(command)` - 标记命令处理器
- `@QueryHandler(query)` - 标记查询处理器
- `@EventsHandler(...events)` - 标记事件处理器
- `@Saga()` - 标记Saga

### 基类

- `Command<T>` - 命令基类，T为返回类型
- `Query<T>` - 查询基类，T为结果类型
- `Event` - 事件基类

### 总线

- `CommandBus` - 命令总线
- `QueryBus` - 查询总线
- `EventBus` - 事件总线

### 接口

- `ICommandHandler<TCommand, TResult>` - 命令处理器接口
- `IQueryHandler<TQuery, TResult>` - 查询处理器接口
- `IEventHandler<TEvent>` - 事件处理器接口
- `ISaga<TEvent>` - Saga接口

## 许可证

MIT
