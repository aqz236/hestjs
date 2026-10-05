import type { Env, Hono } from 'hono';
import { Hono as HonoApp } from 'hono';
import { UnknownOverrideError } from './errors';
import { hasOnStart, hasOnStop } from './lifecycle';
import { normalizeProvider } from './metadata';
import { resolveModuleGraph } from './module-graph';
import type { App, CreateAppOptions, ModuleRef, ResolvedGraph, Resolve } from './types';

function applyOverrides(
  graph: ResolvedGraph,
  overrides: CreateAppOptions<Env, Hono>['overrides'],
): void {
  for (const entry of overrides ?? []) {
    const token = normalizeProvider(entry).provide;
    const replaced = graph.modules.some((node) => node.container.override(entry));
    if (!replaced) {
      throw new UnknownOverrideError(token);
    }
  }
}

/**
 * 组装一个 HestJS 应用。
 *
 * 返回的不是黑盒：`app.hono` 是链式注册之后的 Hono 实例，
 * `app.container` 是依赖容器，`app.graph` 是模块图。三个都随你查。
 *
 * 框架**不替你决定路由长什么样** —— 路由就是 Hono 的路由。
 * 这样 `hc<typeof app.hono>` 能拿到完整的 RPC 类型，也不用把路径写两遍。
 */
export function createApp<E extends Env = Env, R extends Hono<E> = Hono<E>>(
  root: ModuleRef,
  options: CreateAppOptions<E, R> = {},
): App<R> {
  const graph = resolveModuleGraph(root);
  applyOverrides(graph, options.overrides as CreateAppOptions<Env, Hono>['overrides']);

  const hono: Hono<E> = options.hono ?? new HonoApp<E>();
  for (const middleware of options.middleware ?? []) {
    hono.use(middleware);
  }

  const resolve: Resolve = (token) => graph.container.resolve(token);
  const routed: R = options.routes === undefined ? (hono as unknown as R) : options.routes(hono, resolve);

  let started = false;
  let instances: readonly unknown[] = [];

  const app: App<R> = {
    hono: routed,
    container: graph.container,
    graph,

    async start(): Promise<App<R>> {
      if (started) {
        return app;
      }
      const built: unknown[] = [];
      for (const node of graph.modules) {
        built.push(...node.container.instantiateAll());
      }
      for (const instance of built) {
        if (hasOnStart(instance)) {
          await instance.onStart();
        }
      }
      instances = built;
      started = true;
      return app;
    },

    async stop(): Promise<void> {
      if (!started) {
        return;
      }
      started = false;
      for (const instance of [...instances].reverse()) {
        if (hasOnStop(instance)) {
          await instance.onStop();
        }
      }
      instances = [];
    },
  };

  return app;
}
