import type { Env, Handler, Hono, Next } from 'hono';
import { DuplicateRouteError, MissingRouteHandlerError, NoRoutesRegisteredError } from './errors';
import { readRoutes } from './metadata';
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
 * 控制器在挂载时就构造好（singleton），方法第一个参数始终是 Hono 的 Context。
 * 注册顺序就是控制器的声明顺序，所以 `app.hono.routes` 里看到的和写的一致。
 */
export function mountControllers<E extends Env>(
  hono: Hono<E>,
  graph: ResolvedGraph,
  options: MountOptions = {},
): void {
  const router = hono as unknown as Registrable;
  const registered = new Set<string>();
  const prefix = options.prefix ?? '';

  for (const binding of graph.controllers) {
    const routes = readRoutes(binding.controller.prototype);
    if (routes.length === 0) {
      continue;
    }

    const base = joinPath(prefix, binding.basePath);
    const instance = binding.module.container.resolve(binding.controller) as Record<
      string | symbol,
      unknown
    >;

    for (const route of routes) {
      const path = joinPath(base, route.path);
      const key = `${route.method} ${path}`;
      if (registered.has(key)) {
        throw new DuplicateRouteError(route.method, path);
      }
      registered.add(key);

      const handler = (context: unknown, next: Next): unknown => {
        const fn = instance[route.propertyKey];
        if (typeof fn !== 'function') {
          throw new MissingRouteHandlerError(binding.controller.name, route.propertyKey);
        }
        return (fn as (c: unknown, n: Next) => unknown).call(instance, context, next);
      };

      if (route.method === 'ALL') {
        router.all(path, handler as Handler);
      } else {
        router.on(route.method, path, handler as Handler);
      }
    }
  }

  if (graph.controllers.length > 0 && registered.size === 0) {
    throw new NoRoutesRegisteredError(graph.controllers.map(({ controller }) => controller.name));
  }
}
