import type { Context, Handler, Hono, Next } from 'hono';
import { DuplicateRouteError, MissingRouteHandlerError, NoRoutesRegisteredError } from './errors';
import { readController, readRoutes } from './metadata';
import type { ResolvedGraph } from './module-graph';
import { joinPath } from './path';

/** Hono 对动态注册的类型支持有限，这里只取我们真正用到的两个方法。 */
interface Registrable {
  on(method: string, path: string, handler: Handler): void;
  all(path: string, handler: Handler): void;
}

export interface MountOptions {
  /** 给所有控制器再加一层前缀，例如 '/api/v1'。 */
  readonly prefix?: string;
}

/**
 * 把控制器上的路由挂到 Hono 实例上。
 *
 * 控制器实例在挂载时构造一次（singleton），方法里第一个参数始终是
 * Hono 的 Context —— 你随时可以 `c.req` / `c.var` / `c.header`。
 */
export function mountControllers(hono: Hono, graph: ResolvedGraph, options: MountOptions = {}): void {
  const router = hono as unknown as Registrable;
  const registered = new Set<string>();
  const prefix = options.prefix ?? '';

  for (const controller of graph.controllers) {
    const routes = readRoutes(controller.prototype);
    if (routes.length === 0) {
      continue;
    }

    const base = joinPath(prefix, readController(controller)?.path ?? '');
    const instance = graph.container.resolve(controller) as Record<string | symbol, unknown>;

    for (const route of routes) {
      const path = joinPath(base, route.path);
      const key = `${route.method} ${path}`;
      if (registered.has(key)) {
        throw new DuplicateRouteError(route.method, path);
      }
      registered.add(key);

      const handler = (context: Context, next: Next): unknown => {
        const fn = instance[route.propertyKey];
        if (typeof fn !== 'function') {
          throw new MissingRouteHandlerError(controller.name, route.propertyKey);
        }
        return (fn as (c: Context, n: Next) => unknown).call(instance, context, next);
      };

      if (route.method === 'ALL') {
        router.all(path, handler as Handler);
      } else {
        router.on(route.method, path, handler as Handler);
      }
    }
  }

  if (graph.controllers.length > 0 && registered.size === 0) {
    throw new NoRoutesRegisteredError(graph.controllers.map((controller) => controller.name));
  }
}
