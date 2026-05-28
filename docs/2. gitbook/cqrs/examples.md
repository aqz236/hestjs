# 🧑‍💻 CQRS 完整示例

以下为 HestJS CQRS 架构的完整示例，涵盖命令、查询、事件与 Saga。

## 用户创建流程

1. 发送命令
2. 命令处理器创建用户
3. 发布用户创建事件
4. 事件处理器响应
5. Saga 编排后续流程

## 示例代码

```typescript
// 命令
export class CreateUserCommand {
  constructor(public readonly name: string, public readonly email: string) {}
}

// 命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand) {
    // 创建用户
    const user = { id: 'new-id', ...command };
    // 发布事件
    this.eventBus.publish(new UserCreatedEvent(user.id));
    return user;
  }
}

// 查询
export class GetUserQuery {
  constructor(public readonly id: string) {}
}

// 查询处理器
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  async execute(query: GetUserQuery) {
    // 查询用户
    return { id: query.id, name: '张三', email: 'zhang@example.com' };
  }
}

// 事件
export class UserCreatedEvent {
  constructor(public readonly id: string) {}
}

// 事件处理器
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent) {
    // 处理后续逻辑
    console.log('用户已创建:', event.id);
  }
}

// Saga
export class UserSaga {
  @Saga()
  userCreated(events$: Observable<UserCreatedEvent>): Observable<ICommand> {
    return events$.pipe(
      // 监听事件并触发命令
    );
  }
}
```

> 🧑‍💻 CQRS 架构让你的业务流程更清晰、更可维护。

---

下一步：如需更多实用指南，请参考 recipes 章节。
