import { Container } from './container';
import {
  AmbiguousProviderError,
  DuplicateProviderError,
  InvalidModuleError,
  ModuleCycleError,
  UnresolvedExportError,
} from './errors';
import { normalizeProvider, readController, readInjectableScope, readModule } from './metadata';
import type { ModuleMetadata } from './metadata';
import type { Constructor, Token } from './types';

export interface ModuleNode {
  readonly target: Constructor;
  readonly metadata: ModuleMetadata;
  /** 本模块自己的容器：自己的 provider + 从 imports 借来的 token。 */
  readonly container: Container;
  readonly imports: readonly ModuleNode[];
  /** 本模块允许别人看到的东西。 */
  readonly exports: readonly Token[];
}

export interface ControllerBinding {
  readonly controller: Constructor;
  readonly module: ModuleNode;
  readonly basePath: string;
}

export interface ResolvedGraph {
  readonly root: ModuleNode;
  /** 依赖在前、根模块在后。 */
  readonly modules: readonly ModuleNode[];
  readonly controllers: readonly ControllerBinding[];
  /** 根模块的容器。子模块的东西要通过 export + import 才看得见。 */
  readonly container: Container;
}

/**
 * 把模块声明编译成一组容器。
 *
 * 每个模块一个容器，`imports` 会变成指向对方容器的 alias——
 * 所以被导入模块的单例在两个模块里是同一个实例，而不是各造一份。
 *
 * 这个函数负责把整张图校验干净：重复 provider、与 import 撞名、
 * export 了不存在的东西、模块成环，全部在启动前报错。
 */
export function resolveModuleGraph(root: Constructor): ResolvedGraph {
  const nodes = new Map<Constructor, ModuleNode>();
  const order: ModuleNode[] = [];

  const build = (target: Constructor, chain: readonly Constructor[]): ModuleNode => {
    const cached = nodes.get(target);
    if (cached !== undefined) {
      return cached;
    }
    if (chain.includes(target)) {
      throw new ModuleCycleError([...chain, target]);
    }

    const metadata = readModule(target);
    if (metadata === undefined) {
      throw new InvalidModuleError(target);
    }

    const container = new Container();
    const imports: ModuleNode[] = [];

    for (const imported of metadata.imports ?? []) {
      const node = build(imported, [...chain, target]);
      imports.push(node);
      for (const token of node.exports) {
        container.alias(token, node.container);
      }
    }

    const entries = metadata.providers ?? [];
    const declared = new Set<Token>();
    for (const entry of entries) {
      const token = normalizeProvider(entry).provide;
      if (declared.has(token)) {
        throw new DuplicateProviderError(target, token);
      }
      if (container.has(token)) {
        throw new AmbiguousProviderError(target, token);
      }
      declared.add(token);
    }
    container.provide(...entries);

    for (const controller of metadata.controllers ?? []) {
      const token = controller as Token;
      if (declared.has(token) || container.has(token)) {
        throw new DuplicateProviderError(target, token);
      }
      container.provide({
        provide: controller,
        useClass: controller,
        scope: readInjectableScope(controller) ?? 'singleton',
      });
    }

    const exported = metadata.exports ?? [];
    for (const token of exported) {
      if (!container.has(token)) {
        throw new UnresolvedExportError(target, token);
      }
    }

    const node: ModuleNode = { target, metadata, container, imports, exports: exported };
    nodes.set(target, node);
    order.push(node);
    return node;
  };

  const rootNode = build(root, []);

  const controllers: ControllerBinding[] = [];
  for (const node of order) {
    for (const controller of node.metadata.controllers ?? []) {
      controllers.push({
        controller,
        module: node,
        basePath: readController(controller)?.path ?? '',
      });
    }
  }

  return { root: rootNode, modules: order, controllers, container: rootNode.container };
}
