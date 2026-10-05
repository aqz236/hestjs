import type { Env, Hono } from 'hono';
import { Hono as HonoApp } from 'hono';
import type { Container } from './container';
import { hasOnStart, hasOnStop } from './lifecycle';
import { resolveModuleGraph } from './module-graph';
import type { ResolvedGraph } from './module-graph';
import { mountControllers } from './router';
import type { Constructor } from './types';

export interface CreateAppOptions<E extends Env> {
  /** 复用已有的 Hono 实例，例如把 HestJS 挂进一个已经存在的应用。 */
  readonly hono?: Hono<E>;
  /**
   * 在控制器挂载之前调用，拿到的是 Hono 实例本身。
   * 中间件要包住控制器路由，就写在这里。
   */
  readonly configure?: (hono: Hono<E>, container: Container) => void;
  /** 给所有控制器再加一层前缀。 */
  readonly prefix?: string;
  /** 关掉自动挂载，自己决定什么时候挂。 */
  readonly mountControllers?: boolean;
}

export interface App<E extends Env = Env> {
  /** Hono 实例本身。没有包装、没有代理。 */
  readonly hono: Hono<E>;
  /** 根模块的容器。 */
  readonly container: Container;
  /** 编译好的模块图，可以直接查。 */
  readonly graph: ResolvedGraph;
  /**
   * 构造全部单例，然后按依赖顺序执行 OnStart。
   * 构造错误会在这一步集中暴露，而不是等某个请求打进来。
   */
  start(): Promise<App<E>>;
  /** 逆序执行 OnStop。 */
  stop(): Promise<void>;
}

/**
 * 组装一个 HestJS 应用。
 *
 * 返回的不是黑盒：`app.hono` 是 Hono 实例，`app.container` 是依赖容器，
 * `app.graph` 是模块图。三个都随你查、随你改。
 */
export function createApp<E extends Env = Env>(
  root: Constructor,
  options: CreateAppOptions<E> = {},
): App<E> {
  const graph = resolveModuleGraph(root);
  const hono = options.hono ?? (new HonoApp() as Hono<E>);

  options.configure?.(hono, graph.container);

  if (options.mountControllers ?? true) {
    mountControllers(hono, graph, { prefix: options.prefix ?? '' });
  }

  let started = false;
  let instances: readonly unknown[] = [];

  const app: App<E> = {
    hono,
    container: graph.container,
    graph,

    async start(): Promise<App<E>> {
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
