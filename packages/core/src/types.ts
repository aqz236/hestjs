import type { Env, Hono, Input, MiddlewareHandler } from 'hono';
import type { Container } from './container';

/** 能被 new 的类型。参数用 any[] 是为了让容器把解析结果原样透传。 */
export type Constructor<T = unknown> = new (...args: any[]) => T;

/**
 * 依赖查找键。
 *
 * - 类本身即可作 token：`providers: [UserService]`
 * - 接口、配置、第三方实例用字符串或 symbol
 */
export type Token<T = unknown> = string | symbol | Constructor<T>;

/** singleton：容器内只建一次（默认）　transient：每次解析都新建 */
export type Scope = 'singleton' | 'transient';

export interface ClassProvider<T = unknown> {
  readonly provide: Token<T>;
  readonly useClass: Constructor<T>;
}

export interface ValueProvider<T = unknown> {
  readonly provide: Token<T>;
  readonly useValue: T;
}

export interface FactoryProvider<T = unknown> {
  readonly provide: Token<T>;
  /** 刻意不支持 async：异步会污染整条解析链。需要异步初始化请实现 OnStart。 */
  readonly useFactory: (container: Container) => T;
  readonly scope?: Scope;
}

export type Provider<T = unknown> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;

/** 模块 providers 里可以直接写类名，等价于 `{ provide: X, useClass: X }`。 */
export type ProviderEntry<T = unknown> = Provider<T> | Constructor<T>;

/** 容器解析一个 token 的函数。`routes` 里用它把控制器拿进来。 */
export type Resolve = <T>(token: Token<T>) => T;

export interface CreateAppOptions<E extends Env, R extends Hono<E>> {
  /** 复用已有的 Hono 实例。 */
  readonly hono?: Hono<E>;
  /**
   * 在路由之前执行。中间件要包住路由，就必须写在这里 ——
   * Hono 里后注册的中间件不会作用于先注册的路由。
   */
  readonly middleware?: readonly MiddlewareHandler<E>[];
  /**
   * 注册路由。返回的链式 Hono 决定了 `app.hono` 的类型，
   * 所以 `hc<typeof app.hono>` 能拿到完整的 RPC 类型。
   *
   * ```ts
   * routes: (hono, resolve) => hono
   *   .get('/users', (c) => resolve(Users).list(c))
   *   .get('/users/:id', (c) => resolve(Users).detail(c))
   * ```
   */
  readonly routes?: (hono: Hono<E>, resolve: Resolve) => R;
  /**
   * 替换已有的 provider。主要给测试用。
   *
   * 只能替换本来注册过的 token：写错名字会立刻抛 UnknownOverrideError，
   * 而不是让测试在「其实没换掉」的情况下假装通过。
   */
  readonly overrides?: readonly ProviderEntry[];
}

export interface App<R extends Hono<any> = Hono<any>> {
  /** 链式注册之后的 Hono 实例。没有包装、没有代理。 */
  readonly hono: R;
  readonly container: Container;
  /** 编译好的模块图，可以直接查。 */
  readonly graph: ResolvedGraph;
  /**
   * 构造全部单例，然后按依赖顺序执行 OnStart。
   * 构造错误会在这一步集中暴露，而不是等某个请求打进来。
   */
  start(): Promise<App<R>>;
  /** 逆序执行 OnStop。 */
  stop(): Promise<void>;
}

/**
 * 动态模块：`DatabaseModule.forRoot({ url })` 的返回值。
 *
 * 它是一个普通对象，不是类 —— 所以每次 `forRoot()` 调用都是**独立的模块实例**，
 * 可以带不同的配置并存。模块图按对象标识去重，不按类。
 */
export interface DynamicModule extends ModuleMetadata {
  /** 这个动态模块对应哪个类。用于报错信息、调试与 `graph` 展示。 */
  readonly module: Constructor;
}

/** `imports` 里可以放的东西：静态模块类，或动态模块对象。 */
export type ModuleRef = Constructor | DynamicModule;

export interface ModuleNode {
  /** 模块标识。静态模块是类本身，动态模块是 `forRoot()` 返回的那个对象。 */
  readonly ref: ModuleRef;
  /** 展示与报错用的类。动态模块取 `dynamic.module`。 */
  readonly module: Constructor;
  readonly metadata: ModuleMetadata;
  /** 本模块自己的容器：自己的 provider + 从 imports 借来的 token。 */
  readonly container: Container;
  readonly imports: readonly ModuleNode[];
  /** 本模块允许别人看到的东西。 */
  readonly exports: readonly Token[];
}

export interface ResolvedGraph {
  readonly root: ModuleNode;
  /** 依赖在前、根模块在后。 */
  readonly modules: readonly ModuleNode[];
  /** 根模块的容器。子模块的东西要通过 export + import 才看得见。 */
  readonly container: Container;
}

export interface ModuleMetadata {
  /** 本模块依赖的其他模块。它们 export 的东西才对本模块可见。 */
  readonly imports?: readonly ModuleRef[];
  readonly providers?: readonly ProviderEntry[];
  /** 本模块愿意借给别的模块的东西。只能导出自己提供的、或已从 imports 拿到的。 */
  readonly exports?: readonly Token[];
}

export interface InjectableMetadata {
  readonly scope: Scope;
}

export type { Input };
