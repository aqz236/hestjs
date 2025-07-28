# 🔄 Saga 模式

Saga 用于处理分布式事务和长流程业务，确保数据一致性和可靠性。

## 定义 Saga

```typescript
import { Saga, ICommand } from '@hestjs/cqrs';
import { Observable } from 'rxjs';

export class UserSaga {
  @Saga()
  userCreated(events$: Observable<UserCreatedEvent>): Observable<ICommand> {
    return events$.pipe(
      // 监听事件并触发命令
    );
  }
}
```

## 应用场景

- 分布式事务
- 长流程业务编排
- 事件驱动架构

## 最佳实践

- Saga 逻辑应简明，关注流程编排
- 推荐结合事件总线与命令总线使用

> 🔄 Saga 让你的分布式业务更可靠、更可控。

---

下一步：CQRS 完整示例。
