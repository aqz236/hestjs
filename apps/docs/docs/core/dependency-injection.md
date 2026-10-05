---
sidebar_position: 2
---

# 依赖注入

## 依赖写在 static inject 里

```ts
@Injectable()
class UserService {
  static readonly inject = [UserRepository, CLOCK] as const;

  constructor(
    private readonly repository: UserRepository,
    private readonly now: () => string,
  ) {}
}
```

没有反射，没有 `emitDecoratorMetadata`。依赖关系是可静态阅读的文本，
换成 esbuild、swc、bun 都不会在编译期悄悄消失。

**为什么不用 `design:paramtypes`**：它把依赖关系藏进编译产物，
换打包器就可能静默失效——而这种失效只在运行时暴露，正是最难查的那类问题。

## 三种 provider

```ts
@Module({
  providers: [
    UserService,                                                    // 类名简写
    { provide: UserService, useClass: UserService, scope: 'transient' },
    { provide: CLOCK, useFactory: () => () => new Date().toISOString() },
    { provide: 'app.name', useValue: 'hestjs' },
  ],
})
```

| 写法 | 用途 |
| --- | --- |
| `SomeClass` | 等价于 `{ provide: SomeClass, useClass: SomeClass }`，scope 取 `@Injectable()` 上的设置 |
| `useClass` | 换实现，例如按环境给不同的 Repository |
| `useFactory` | 需要计算或组合时用，工厂拿到当前容器 |
| `useValue` | 常量、配置、第三方实例 |

**`useFactory` 必须是同步的。** 异步会污染整条解析链；
需要异步初始化请实现 `OnStart`。

## token 的选择

| 场景 | token |
| --- | --- |
| 类 | 类本身 |
| 接口、配置、第三方实例 | 字符串或 `Symbol` |
| 想区分同名 | `Symbol('clock')` |

接口在运行时不存在，只能用字符串或 Symbol 当 token。

## 作用域

| scope | 行为 |
| --- | --- |
| `singleton`（默认） | 每层容器一份，解析后复用 |
| `transient` | 每次解析都新建 |

```ts
@Injectable({ scope: 'transient' })
class RequestMetrics {}
```

作用域是**模块级**的，不是请求级——需要按请求区分的值，用 Hono 自己的
`c.set()` / `c.get()`，那本来就是 Hono 解决的问题，不需要再引一套。

## 构造函数注入的基类要写 super()

如果你的消息类继承 `Command` / `Query` / `Event`，构造函数里必须调 `super()`：

```ts
class CreateUser extends Command<string> {
  constructor(readonly name: string) {
    super();   // 缺了这行，tsc 会报 TS2377
  }
}
```

tsc 会拦住，不会留到运行时。
