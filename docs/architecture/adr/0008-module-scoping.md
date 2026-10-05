# ADR-0008：模块作用域 —— `imports`/`exports` 成为真实边界

- **状态**：Accepted
- **决策时间**：2026-10-05
- **相关提交**：[`0650014`](https://github.com/aqz236/hestjs/commit/0650014) `feat(core): 实现模块作用域，exports 成为真实边界`
- **社区来源**：[issue #1](https://github.com/aqz236/hestjs/issues/1)（2025-08-05，`@agileago`）

## 背景

`@Module()` 从 2025-07 起就声明了四个字段：

```typescript
export interface ModuleMetadata {
  controllers?: any[];
  providers?: any[];
  imports?: any[];
  exports?: any[];   // 从未被读取
}
```

但 `initializeModule` 只处理了前三个，**`exports` 在全代码库中没有任何读取点**；且所有 provider 都注册进同一个容器。也就是说：

- 模块 A 的 provider 对模块 B 完全可见，无需 import 即可解析
- `imports` 只影响**初始化顺序**，不影响可见性
- `exports` 是死声明

2025-08-05，社区成员 `@agileago` 提出质疑：`@Module` 是 Angular 在 ES module 缺失时期的产物，如果不提供 DI 边界，就只是对 ES module 的重复。当时的实现恰好印证了这一点。

## 决策

**实现真正的模块作用域**，而不是承认「模块只是组织形式」。

## 理由

1. HestJS 的定位是「类 NestJS 的开发体验」，模块是这套 API 形态的组成部分，去掉会让使用者的迁移成本显著上升
2. 扁平注册换来的是「provider 只在模块内可见」这一表达能力的丧失，框架不应退回该状态
3. `@Module` 本身值得保留 —— 它不是对 ES module 的重复，而是 **DI 图的边界与作用域单位**

## 实施

每个模块拥有独立的子容器，模块间为兄弟关系（同挂在一个父容器下）：

- 模块自己的 `providers` / `controllers` 注册进自己的容器
- 只有被 `imports` 引入、**且**被对方 `exports` 声明的 provider 才接入导入方容器
- 单例以 `registerInstance` 共享同一实例；`transient` 以类重新注册
- 同一模块被多处 `import` 时只初始化一次，避免重复单例
- `RouterExplorer.explore` 新增 `moduleContainers` 参数，控制器由所属模块容器解析

### 关键点：必须显式校验依赖可见性

子容器只建立了**结构**，并不构成边界。最小复现确认：**TSyringe 的解析器在遇到未注册的类时会直接构造它**：

```javascript
root.register(Consumer, Consumer)   // Consumer 依赖未注册的 Hidden
root.resolve(Consumer)              // 成功构造，Hidden 未被注册
```

因此新增 `validateModuleDependencies`：遍历模块内所有 provider / controller 的 `design:paramtypes`，确认每个类依赖都能在当前模块容器中解析，否则**启动即报错**，并给出可操作的提示：

```
模块 AppModule 中的 UsersController 依赖 UserRepository（第 0 个构造参数），
但该依赖对 AppModule 不可见。它由模块 UserModule 提供，但未对该模块导出；
请在 UserModule 的 exports 中声明 UserRepository，并把 UserModule
加入 AppModule 的 imports。
```

## 后果

**正面**

- `imports` / `exports` 从声明变成约束
- 越权依赖在**启动时**暴露，而不是运行期静默成功
- 两个模块的同名 provider 不再互相覆盖（此前 `provider.name` 注册在同一容器里会静默覆盖）

**负面 / 遗留**

- **`Container` 的子容器注册对父容器不可见**，父容器无法直接 `resolve` 模块内的 provider。为此新增 `resolveScoped`（由拥有者容器解析）与 `findContainerFor`，cqrs 等需要在应用级访问模块内实例的场景依赖它
- **`@Inject('字符串令牌')` 不被静态校验覆盖**：这类参数在 `design:paramtypes` 中呈现为 `Object` / `String` 等内置类型，无法还原真实令牌
- **`Container` 与 `ApplicationHooks` 均为单例**：同一进程内多次 `HestFactory.create()` 会互相影响（对单应用进程无影响）

## 相关

- [issue #1](https://github.com/aqz236/hestjs/issues/1) —— 原始质疑
- [issue #14](https://github.com/aqz236/hestjs/issues/14) —— 缺陷立项
- [ADR-0002 装饰器驱动的 API 形态](./0002-decorator-driven-api.md)
