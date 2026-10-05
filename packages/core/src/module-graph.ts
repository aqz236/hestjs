import { Container } from './container';
import { InvalidModuleError } from './errors';
import { normalizeProvider, readInjectable, readModule } from './metadata';
import type { Constructor, Provider } from './types';

export interface ResolvedGraph {
  /** 依赖在前、根模块在后。onStart 按这个顺序执行。 */
  readonly modules: readonly Constructor[];
  readonly controllers: readonly Constructor[];
  readonly container: Container;
}

/**
 * 从根模块出发，把所有 imports 收进来，合成一个容器。
 *
 * 这里刻意不做模块作用域隔离：HestJS 的容器只负责构造，
 * 「谁能看见谁」由你在模块里写死 provider 来决定。
 */
export function resolveModuleGraph(root: Constructor): ResolvedGraph {
  const modules: Constructor[] = [];
  const controllers: Constructor[] = [];
  const providers: Provider[] = [];
  const visiting = new Set<Constructor>();

  const visit = (module: Constructor): void => {
    if (visiting.has(module)) {
      return;
    }
    const metadata = readModule(module);
    if (metadata === undefined) {
      throw new InvalidModuleError(module);
    }
    visiting.add(module);

    for (const imported of metadata.imports ?? []) {
      visit(imported);
    }

    modules.push(module);
    for (const entry of metadata.providers ?? []) {
      providers.push(normalizeProvider(entry));
    }
    for (const controller of metadata.controllers ?? []) {
      controllers.push(controller);
    }
  };

  visit(root);

  const container = new Container();
  container.register(...providers);

  for (const controller of controllers) {
    if (container.has(controller)) {
      continue;
    }
    container.register({
      provide: controller,
      useClass: controller,
      scope: readInjectable(controller)?.scope ?? 'singleton',
    });
  }

  return { modules, controllers, container };
}
