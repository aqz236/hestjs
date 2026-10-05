# 模块

```ts
@Module({
  imports: [DataModule, CoreModule],   // 依赖哪些模块
  providers: [UserService, UserController],
  exports: [UserService],              // 允许别的模块看到什么
})
class UsersModule {}
```

模块是**纯声明**。它没有钩子、没有方法、没有生命周期——那些属于 provider。

**控制器不是特殊东西**：它就是普通的 provider，方法接受 Hono 的 `Context`。
所以 `providers` 里写它就行，没有单独的 `controllers` 字段。

## 作用域是真的

每个模块一个容器：

- `imports` 编译成指向对方容器的 `alias`
- `exports` 是唯一能借出去的东西
- 没 export 的 provider，别的模块**看不见**

```ts
@Module({ providers: [UserRepository], exports: [UserRepository] })
class DataModule {}

@Module({ imports: [DataModule], providers: [UserService] })
class UsersModule {}
```

`UserService` 能注入 `UserRepository`，因为 `DataModule` 把它 export 了。
把 `exports` 删掉，`createApp()` 会在**启动前**抛 `ProviderNotFoundError`，
不是等某个请求打进来才炸。

### alias 不是复制

`DataModule` 的 `UserRepository` 单例，被十个模块 import 也是同一个实例。
`alias` 只是把解析请求转发回源容器，不会各造一份。

## 启动前的图校验

`createApp()` 会把整张图校验干净，下面这些都不会漏到运行期：

| 情况 | 错误 |
| --- | --- |
| 同一个模块里 provider 写了两遍 | `DuplicateProviderError` |
| 自己提供的 token 与 import 撞名 | `AmbiguousProviderError` |
| `exports` 了不存在的东西 | `UnresolvedExportError` |
| 模块 import 成环 | `ModuleCycleError`（带完整链路） |
| `imports` 里放了没 `@Module()` 的类 | `InvalidModuleError` |
| 构造参数少标 `@Inject()` | `MissingInjectError` |
| `overrides` 替换了不存在的 token | `UnknownOverrideError` |

错误信息都写清了「哪两个东西撞了」和「怎么改」。

## 为什么不做覆盖

NestJS 允许本地 provider 覆盖 import 进来的同名 token。这里直接报错：

**provider 的顺序不该决定谁生效。** 撞名就是设计问题，早报早改。

（测试里要换实现，用 `createApp` 的 `overrides`——那是显式的、会被校验的入口。）

## 模块的执行顺序

`graph.modules` 是**依赖在前、根模块在后**的后序：
`AppModule` 最后，被它依赖的模块最先。`app.start()` 按这个顺序跑生命周期。
