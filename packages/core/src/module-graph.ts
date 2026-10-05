import { Container } from './container';
import {
  AmbiguousImportError,
  AmbiguousProviderError,
  DuplicateProviderError,
  InvalidModuleError,
  ModuleCycleError,
  UnresolvedExportError,
} from './errors';
import { normalizeProvider, readModule } from './metadata';
import type { Constructor, DynamicModule, ModuleMetadata, ModuleNode, ModuleRef, ResolvedGraph, Token } from './types';

/**
 * 把模块声明编译成一组容器。
 *
 * 每个模块一个容器，`imports` 会变成指向对方容器的 alias ——
 * 所以被导入模块的单例在两个模块里是同一个实例，而不是各造一份。
 *
 * 这个函数负责把整张图校验干净：重复 provider、与 import 撞名、
 * export 了不存在的东西、模块成环，全部在启动前报错。
 */
/** 把「类」或「动态模块对象」统一成 { 类, 元数据 }。 */
function describeRef(ref: ModuleRef): { module: Constructor; metadata: ModuleMetadata } {
  if (typeof ref === 'function') {
    const metadata = readModule(ref);
    if (metadata === undefined) {
      throw new InvalidModuleError(ref);
    }
    return { module: ref, metadata };
  }
  if (typeof (ref as DynamicModule).module !== 'function') {
    throw new InvalidModuleError(ref);
  }
  return { module: ref.module, metadata: ref };
}

export function resolveModuleGraph(root: ModuleRef): ResolvedGraph {
  // 按「引用」去重而不是按类：同一个类的多个 forRoot() 配置必须各自成节点
  const nodes = new Map<ModuleRef, ModuleNode>();
  const order: ModuleNode[] = [];

  const build = (ref: ModuleRef, chain: readonly ModuleRef[]): ModuleNode => {
    const cached = nodes.get(ref);
    if (cached !== undefined) {
      return cached;
    }
    if (chain.includes(ref)) {
      throw new ModuleCycleError([...chain, ref]);
    }

    const { module, metadata } = describeRef(ref);

    const container = new Container();
    const imports: ModuleNode[] = [];

    for (const imported of metadata.imports ?? []) {
      const node = build(imported, [...chain, ref]);
      imports.push(node);
      for (const token of node.exports) {
        if (container.has(token)) {
          throw new AmbiguousImportError(module, token);
        }
        container.alias(token, node.container);
      }
    }

    const entries = metadata.providers ?? [];
    const declared = new Set<Token>();
    for (const entry of entries) {
      const token = normalizeProvider(entry).provide;
      if (declared.has(token)) {
        throw new DuplicateProviderError(module, token);
      }
      if (container.has(token)) {
        throw new AmbiguousProviderError(module, token);
      }
      declared.add(token);
    }
    container.provide(...entries);

    const exported = metadata.exports ?? [];
    for (const token of exported) {
      if (!container.has(token)) {
        throw new UnresolvedExportError(module, token);
      }
    }

    const node: ModuleNode = { ref, module, metadata, container, imports, exports: exported };
    nodes.set(ref, node);
    order.push(node);
    return node;
  };

  const rootNode = build(root, []);
  return { root: rootNode, modules: order, container: rootNode.container };
}

export type { ResolvedGraph } from './types';
export { Container } from './container';
