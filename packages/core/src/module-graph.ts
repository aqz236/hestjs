import { Container } from './container';
import {
  AmbiguousProviderError,
  DuplicateProviderError,
  InvalidModuleError,
  ModuleCycleError,
  UnresolvedExportError,
} from './errors';
import { normalizeProvider, readModule } from './metadata';
import type { Constructor, ModuleMetadata, ModuleNode, ResolvedGraph, Token } from './types';

/**
 * 把模块声明编译成一组容器。
 *
 * 每个模块一个容器，`imports` 会变成指向对方容器的 alias ——
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

    const metadata: ModuleMetadata | undefined = readModule(target);
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
  return { root: rootNode, modules: order, container: rootNode.container };
}

export type { ResolvedGraph } from './types';
export { Container } from './container';
