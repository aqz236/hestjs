# 依赖注入

## 依赖写在 @Inject() 里

```ts
class UserService {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(CLOCK) private readonly now: () => string,
  ) {}
}
```

每个构造参数都要标。**少标一个，容器在启动时就抛 `MissingInjectError`**：

```
UserService 的第 1 个构造参数没有 @Inject()。
依赖是显式声明的，容器不会去猜类型 —— 给该参数加上 @Inject(Token)，
或者给它一个默认值让它变成可选。
```

这一条是刻意的。NestJS 靠 `design:paramtypes` 推断参数类型，
而 HestJS 不读编译产物里的类型信息——所以「参数个数」是唯一的校验依据，
缺一个就在启动期报错，而不是等到某个方法被调用时才发现拿到的是 `undefined`。

## 为什么不用 emitDecoratorMetadata

它能用（Bun 支持），但不用，有两个原因：

1. **依赖关系会藏进编译产物。** 换打包器、换 target、开 `isolatedModules`，
   都可能让它在编译期静默失效——而这类失效只在运行时暴露。
2. **TS 的标准装饰器（stage 3）不能发类型元数据。** 老式装饰器是过渡形态，
   依赖它的框架将来要改一次。

`@Inject()` 是文本，可搜索、可 review、可静态分析。

## 三种 provider

```ts
@Module({
  providers: [
    UserService,                                          // 类名简写 = singleton
    { provide: CLOCK, useFactory: () => () => Date.now() },
    { provide: 'app.name', useValue: 'hestjs' },
  ],
})
```

| 写法 | 用途 |
| --- | --- |
| `SomeClass` | 等价于 `{ provide: SomeClass, useClass: SomeClass }` |
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

```ts
@Injectable({ scope: 'transient' })
class RequestMetrics {}
```

| scope | 行为 |
| --- | --- |
| `singleton`（默认） | 每层容器一份，解析后复用 |
| `transient` | 每次解析都新建 |

作用域只有这一个来源——provider 对象里没有 `scope` 字段，
免得同一个东西有两个地方可以改。（`useFactory` 是个例外，
匿名工厂没有类可以挂装饰器。）

作用域是**模块级**的，不是请求级——需要按请求区分的值，用 Hono 自己的
`c.set()` / `c.get()`，那本来就是 Hono 解决的问题。

## 容器只认 token，不认类型

```ts
const CLOCK = Symbol('clock');
```

容器解析的是「键」，不是「类型」。所以同一个类可以用两个 token 注册两份实例，
也可以把接口的实现换掉——这些都靠 token 区分。
