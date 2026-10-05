import type { Hono } from 'hono';
import type { Container } from './container';

/** 可被 new 的类型。参数用 any[] 是为了让容器能把解析结果原样透传。 */
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
  readonly useFactory: (container: Container) => T;
  readonly scope?: Scope;
}

export type Provider<T = unknown> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;

/**
 * 模块 providers 里可以直接写类名，等价于 `{ provide: X, useClass: X }`。
 */
export type ProviderEntry<T = unknown> = Provider<T> | Constructor<T>;

/**
 * 用 `static inject` 声明构造参数的类。
 *
 * 刻意不用 `emitDecoratorMetadata`：那会把依赖关系藏进编译产物，
 * 换打包器（esbuild / swc / bun）就可能静默失效。
 */
export type InjectableClass<T = unknown> = Constructor<T> & {
  readonly inject?: readonly Token[];
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export type RouteMethod = HttpMethod | 'ALL';

export interface App {
  /** Hono 实例本身。永远可以直接操作它。 */
  readonly hono: Hono;
  readonly container: Container;
  /** 依次执行各模块的 onStart。 */
  start(): Promise<App>;
  /** 逆序执行各模块的 onStop。 */
  stop(): Promise<void>;
}
