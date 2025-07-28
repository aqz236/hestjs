# 🧪 依赖注入

HestJS 内置 IoC 容器，支持依赖注入，提升代码解耦和可测试性。

## 基本用法

通过构造函数注入依赖：

```typescript
import { Injectable } from '@hestjs/core';

@Injectable()
export class UsersService {
  // ...业务逻辑
}

import { Controller } from '@hestjs/core';
import { UsersService } from './users.service';

@Controller('/api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  // ...路由方法
}
```

## 生命周期管理

- 所有 `@Injectable()` 服务由容器自动管理
- 支持单例、作用域等多种生命周期

## 最佳实践

- 业务逻辑建议全部抽象为 Service 层
- 控制器只负责请求分发

> 🧪 依赖注入让你的代码更优雅、更易测试。

---

下一步：了解 HestJS 拦截器机制。
