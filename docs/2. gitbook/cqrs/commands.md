# 📝 命令处理

HestJS CQRS 中，命令用于变更系统状态，所有写操作均通过命令实现。

## 定义命令

```typescript
export class CreateUserCommand {
  constructor(public readonly name: string, public readonly email: string) {}
}
```

## 命令处理器

```typescript
import { CommandHandler, ICommandHandler } from '@hestjs/cqrs';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand) {
    // 处理用户创建逻辑
    return { id: 'new-id', ...command };
  }
}
```

## 发送命令

```typescript
import { CommandBus } from '@hestjs/cqrs';

constructor(private readonly commandBus: CommandBus) {}

async createUser() {
  await this.commandBus.execute(new CreateUserCommand('张三', 'zhang@example.com'));
}
```

## 最佳实践

- 命令只负责数据变更，不返回数据
- 业务逻辑建议全部通过命令处理器实现

> 📝 命令让你的写操作更规范、更可扩展。

---

下一步：查询处理。
