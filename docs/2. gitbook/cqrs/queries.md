# 🔍 查询处理

CQRS 架构中，查询用于读取数据，不改变系统状态。

## 定义查询

```typescript
export class GetUserQuery {
  constructor(public readonly id: string) {}
}
```

## 查询处理器

```typescript
import { QueryHandler, IQueryHandler } from '@hestjs/cqrs';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  async execute(query: GetUserQuery) {
    // 查询用户逻辑
    return { id: query.id, name: '张三', email: 'zhang@example.com' };
  }
}
```

## 发送查询

```typescript
import { QueryBus } from '@hestjs/cqrs';

constructor(private readonly queryBus: QueryBus) {}

async getUser(id: string) {
  return await this.queryBus.execute(new GetUserQuery(id));
}
```

## 最佳实践

- 查询只负责数据读取，不做变更
- 查询处理器应保持无副作用

> 🔍 查询让你的读操作更高效、更安全。

---

下一步：事件处理。
