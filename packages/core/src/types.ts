import type { Context, Env, Input } from 'hono';
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

/**
 * singleton：容器内只建一次（默认）
 * transient：每次解析都新建
 */
export type Scope = 'singleton' | 'transient';

export interface ClassProvider<T = unknown> {
  readonly provide: Token<T>;
  readonly useClass: InjectableClass<T>;
  readonly scope?: Scope;
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

/**
 * 用 `static inject` 声明构造参数的类。
 *
 * 依赖是显式的、可静态阅读的，不依赖 emitDecoratorMetadata。
 */
export type InjectableClass<T = unknown> = Constructor<T> & {
  readonly inject?: readonly Token[];
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export type RouteMethod = HttpMethod | 'ALL';

/**
 * 控制器方法的签名。
 *
 * 动态注册拿不到 Hono 的路径推导，把完整路径写成类型参数就能把它找回来：
 *
 * ```ts
 * @Get('/:id')
 * detail(c: RouteContext<'/users/:id'>) { c.req.param('id') }  // string
 * ```
 */
export type RouteContext<
  TPath extends string,
  TInput extends Input = {},
  E extends Env = Env,
> = Context<E, TPath, TInput>;

export type RouteHandler<
  TPath extends string,
  TInput extends Input = {},
  E extends Env = Env,
> = (context: RouteContext<TPath, TInput, E>) => Response | Promise<Response>;
