# ADR-0002：装饰器驱动的 API 形态

- **状态**：Accepted
- **决策时间**：2025-07-27
- **相关提交**：
  - [`f5639e7`](https://github.com/aqz236/hestjs/commit/f5639e7) 核心框架（DI、路由、应用工厂）
  - [`9350d93`](https://github.com/aqz236/hestjs/commit/9350d93) 实现异常处理、拦截器和中间件系统

## 背景

框架的定位是「类 NestJS 的开发体验」。NestJS 的核心特征是用装饰器声明控制器、服务与模块，由 DI 容器负责装配。

## 决策

采用与 NestJS 一致的装饰器 API：

```typescript
@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }
}
```

元数据统一存于 `Reflect`，键由 `src/utils/constants.ts` 的 `METADATA_KEYS` 集中定义（`hest:controller`、`hest:route`、`hest:param`、`hest:module`、`hest:middleware` 等），均使用 `Symbol.for` 注册到全局符号表。

## 理由

- 与 NestJS 的 API 形态一致，降低使用者的迁移成本
- 装饰器 + `Reflect` 元数据是当时最成熟的方案，能在不改动 TS 编译链的前提下完成声明式装配
- 参数级校验（`@Body(UserDto)`）依赖方法上的参数元数据，这一能力后来成为拦截器不可删除的理由（见 [ADR-0005](./0005-restore-interceptors-and-filters.md)）

## 后果

**正面**

- 一天内即跑通控制器、模块、服务、路由装饰器与参数注入

**负面 / 遗留**

- **装饰器元数据是全局共享的**：所有包通过 `Symbol.for` 访问同一份元数据，因此任何包都能读到别人的元信息。这既带来了跨包协作（`@hestjs/scalar` 据此生成 OpenAPI），也让边界变得模糊
- **参数装饰器自下而上求值**：`MetadataScanner.scanParameters` 返回的数组是倒序的，消费方必须依赖 `index` 字段而非数组位置
- **`@Injectable()` 的 DI 缺陷**：装饰器最初调用 TSyringe 的 `autoInjectable()`，它**不写入** `typeInfo` 注册表，导致任何带构造参数的类都无法被容器解析。该缺陷直到 2026-10-05 建立测试体系时才被发现并修复（[`e7c7015`](https://github.com/aqz236/hestjs/commit/e7c7015)）

## 相关

- [ADR-0001 技术底座](./0001-tech-foundation.md)
- [ADR-0005 恢复拦截器与异常过滤器](./0005-restore-interceptors-and-filters.md)
- [ADR-0008 模块作用域](./0008-module-scoping.md)
