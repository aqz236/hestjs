import { ROUTE_META } from './symbols';

/**
 * 所有挂在路由 handler 上的元数据都长这样。
 *
 * core 只认 `kind`，其余字段一律不解释 —— 索引签名就是为这个留的，
 * 插件想带什么就带什么。
 */
export interface RouteMetaEntry {
  readonly kind: string;
  readonly [key: string]: unknown;
}

/**
 * 校验插件写入的约定。core 定义形状，validation 写、openapi 读，
 * 三方之间没有互相 import —— 契约放在 core 里。
 */
export interface ValidationRouteMeta extends RouteMetaEntry {
  readonly kind: 'validation';
  readonly source: 'json' | 'query' | 'param' | 'header' | 'form' | 'cookie';
  /** 纯文档用。校验本身不读它。 */
  readonly jsonSchema?: Record<string, unknown>;
}

/** 文档插件写入的约定。 */
export interface DocumentationRouteMeta extends RouteMetaEntry {
  readonly kind: 'documentation';
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly operationId?: string;
  readonly deprecated?: boolean;
  readonly responses?: Readonly<
    Record<string, { readonly description: string; readonly jsonSchema?: Record<string, unknown> }>
  >;
}

type Handler = (...args: any[]) => any;

/**
 * 把一条元数据挂到路由 handler 上，返回同一个 handler。
 *
 * 类型不变，所以 Hono 的类型推导（以及 `hc` 的 RPC 类型）完全不受影响。
 * 元数据可以直接从 `app.hono.routes[i].handler` 读回来。
 */
export function attachRouteMeta<T extends Handler>(handler: T, entry: RouteMetaEntry): T {
  const existing = (handler as unknown as Record<symbol, RouteMetaEntry[] | undefined>)[ROUTE_META];
  Object.defineProperty(handler, ROUTE_META, {
    value: existing === undefined ? [entry] : [...existing, entry],
    enumerable: false,
    configurable: true,
    writable: true,
  });
  return handler;
}

export function readRouteMeta(handler: unknown): readonly RouteMetaEntry[] {
  if (typeof handler !== 'function') {
    return [];
  }
  return (handler as unknown as Record<symbol, RouteMetaEntry[] | undefined>)[ROUTE_META] ?? [];
}

/**
 * 从 handler 上按 kind 找一条元数据。
 *
 * 返回 `RouteMetaEntry` 而不是收窄后的类型：core 不解释插件写入的字段，
 * 调用方（openapi 之类）自己把它当成 `DocumentationRouteMeta` 用。
 */
export function findRouteMeta(handler: unknown, kind: string): RouteMetaEntry | undefined {
  return readRouteMeta(handler).find((entry) => entry.kind === kind);
}
