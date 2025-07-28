# 📢 事件处理

事件用于通知系统内其他模块发生了某些动作，实现解耦与异步处理。

## 定义事件

```typescript
export class UserCreatedEvent {
  constructor(public readonly id: string) {}
}
```

## 事件处理器

```typescript
import { EventsHandler, IEventHandler } from '@hestjs/cqrs';

@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent) {
    // 处理用户创建后的逻辑
    console.log('用户已创建:', event.id);
  }
}
```

## 发布事件

```typescript
import { EventBus } from '@hestjs/cqrs';

constructor(private readonly eventBus: EventBus) {}

async notifyUserCreated(id: string) {
  this.eventBus.publish(new UserCreatedEvent(id));
}
```

## 最佳实践

- 事件用于解耦业务流程，推荐异步处理
- 事件处理器应关注单一职责

> 📢 事件让你的系统更灵活、更可扩展。

---

下一步：Saga 模式。
