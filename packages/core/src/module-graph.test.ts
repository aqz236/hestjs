import { describe, expect, it } from 'bun:test';
import {
  AmbiguousProviderError,
  DuplicateProviderError,
  ModuleCycleError,
  ProviderNotFoundError,
  UnresolvedExportError,
} from './errors';
import { Inject } from './decorators/inject';
import { Module } from './decorators/module';
import { resolveModuleGraph } from './module-graph';
import type { Constructor } from './types';

class Repository {}

class Service {
  constructor(@Inject(Repository) readonly repository: Repository) {}
}

describe('resolveModuleGraph', () => {
  it('imports 变成 alias，跨模块单例共享', () => {
    @Module({ providers: [Repository], exports: [Repository] })
    class DataModule {}

    @Module({ imports: [DataModule], providers: [Service] })
    class FeatureModule {}

    const graph = resolveModuleGraph(FeatureModule);
    const repository = graph.container.resolve(Repository);
    expect(graph.root.imports[0]!.container.resolve(Repository)).toBe(repository);
  });

  it('没有 export 的东西别人看不见', () => {
    @Module({ providers: [Repository] })
    class ClosedModule {}

    @Module({ imports: [ClosedModule], providers: [Service] })
    class FeatureModule {}

    expect(() => resolveModuleGraph(FeatureModule).container.resolve(Repository)).toThrow(
      ProviderNotFoundError,
    );
  });

  it('模块顺序是依赖在前、根在后', () => {
    @Module({ providers: [Repository], exports: [Repository] })
    class DataModule {}

    @Module({ imports: [DataModule], providers: [Service] })
    class FeatureModule {}

    expect(resolveModuleGraph(FeatureModule).modules.map((node) => node.module)).toEqual([
      DataModule,
      FeatureModule,
    ]);
  });

  it('重复 provider 报错', () => {
    @Module({ providers: [Repository, Repository] })
    class BrokenModule {}

    expect(() => resolveModuleGraph(BrokenModule)).toThrow(DuplicateProviderError);
  });

  it('自己提供的 token 与 import 撞名时报错', () => {
    @Module({ providers: [Repository], exports: [Repository] })
    class DataModule {}

    @Module({ imports: [DataModule], providers: [Repository] })
    class BrokenModule {}

    expect(() => resolveModuleGraph(BrokenModule)).toThrow(AmbiguousProviderError);
  });

  it('export 不存在的东西报错', () => {
    @Module({ providers: [], exports: [Repository] })
    class BrokenModule {}

    expect(() => resolveModuleGraph(BrokenModule)).toThrow(UnresolvedExportError);
  });

  it('模块 import 成环报错', () => {
    const aImports: Constructor[] = [];

    @Module({ imports: aImports })
    class A {}
    @Module({ imports: [A] })
    class B {}

    aImports.push(B);

    expect(() => resolveModuleGraph(B)).toThrow(ModuleCycleError);
  });

  it('没有 @Module 的类会被指出', () => {
    class NotAModule {}
    expect(() => resolveModuleGraph(NotAModule)).toThrow();
  });
});
