import { Hono } from 'hono';
import type { Container } from './container';
import { readModule } from './metadata';
import { resolveModuleGraph } from './module-graph';
import { mountControllers } from './router';
import type { App, Constructor } from './types';

export interface CreateAppOptions {
  /** 复用已有的 Hono 实例，例如把 HestJS 挂进一个已经存在的应用。 */
  readonly hono?: Hono;
  /**
   * 在控制器挂载之前调用，拿到的是 Hono 实例本身。
   * 中间件要包住控制器路由，就写在这里。
   */
  readonly configure?: (hono: Hono, container: Container) => void;
  /** 给所有控制器再加一层前缀。 */
  readonly prefix?: string;
  /** 关掉自动挂载，自己决定什么时候挂。 */
  readonly mountControllers?: boolean;
}

/**
 * 组装一个 HestJS 应用。
 *
 * 返回的不是黑盒：`app.hono` 就是 Hono 实例，`app.container` 就是依赖容器，
 * 两个都随你操作。HestJS 只是把模块声明翻译成 `hono.get/post/use`。
 */
export function createApp(root: Constructor, options: CreateAppOptions = {}): App {
  const graph = resolveModuleGraph(root);
  const hono = options.hono ?? new Hono();

  options.configure?.(hono, graph.container);

  if (options.mountControllers ?? true) {
    mountControllers(hono, graph, { prefix: options.prefix ?? '' });
  }

  let started = false;

  const app: App = {
    hono,
    container: graph.container,

    async start(): Promise<App> {
      if (started) {
        return app;
      }
      started = true;
      for (const module of graph.modules) {
        await readModule(module)?.onStart?.(app);
      }
      return app;
    },

    async stop(): Promise<void> {
      if (!started) {
        return;
      }
      started = false;
      for (const module of [...graph.modules].reverse()) {
        await readModule(module)?.onStop?.(app);
      }
    },
  };

  return app;
}
