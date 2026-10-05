import type { Env, MiddlewareHandler } from 'hono';
import { attachRouteMeta, type DocumentationRouteMeta } from '@hestjs/core';

export interface ResponseDocumentation {
  readonly description: string;
  readonly jsonSchema?: Record<string, unknown>;
}

export interface RouteDocumentation {
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly operationId?: string;
  readonly deprecated?: boolean;
  readonly responses?: Readonly<Record<string, ResponseDocumentation>>;
}

/**
 * 给一条路由补上人看的说明。
 *
 * ```ts
 * hono.get('/users/:id',
 *   documented({ summary: '查单个用户', tags: ['users'] }),
 *   (c) => users.detail(c),
 * )
 * ```
 *
 * 是一段「什么都不做、只挂元数据」的中间件 —— 这样 Hono 的链式类型推导
 * 完全不受影响，而 `buildOpenApiDocument` 能从 `hono.routes` 里读回说明。
 */
export function documented<E extends Env = Env>(
  documentation: RouteDocumentation,
): MiddlewareHandler<E> {
  const middleware = (async (_context, next: () => Promise<void>) => {
    await next();
  }) as MiddlewareHandler<E>;

  return attachRouteMeta(middleware, {
    kind: 'documentation',
    ...documentation,
  } as DocumentationRouteMeta);
}
