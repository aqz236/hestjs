import { describe, expect, it } from 'bun:test';
import { createApp } from './app';
import { dynamicModule } from './dynamic-module';
import { Inject } from './decorators/inject';
import { Module } from './decorators/module';
import {
  AmbiguousImportError,
  AmbiguousProviderError,
  InvalidModuleError,
  ModuleCycleError,
} from './errors';
import { resolveModuleGraph } from './module-graph';
import { token } from './token';
import type { DynamicModule, Token } from './types';

const DB_URL = token<string>('dbUrl');
const PRIMARY = token<Pool>('primaryPool');
const REPLICA = token<Pool>('replicaPool');

class Pool {
  constructor(@Inject(DB_URL) readonly url: string) {}
}

/**
 * 一个典型的动态模块：类只是工厂方法的命名空间，没有 @Module()。
 *
 * `provide` 让调用方决定这个实例挂在哪个 token 上 —— 这样同一个类
 * 可以配置出多个互不干扰的实例。
 */
class DatabaseModule {
  static forRoot(options: { url: string; provide?: Token<Pool> }): DynamicModule {
    const token = options.provide ?? Pool;
    return dynamicModule(DatabaseModule, {
      providers: [
        { provide: DB_URL, useValue: options.url },
        { provide: token, useClass: Pool },
      ],
      exports: [token],
    });
  }
}

describe('dynamicModule', () => {
  it('每次 forRoot 都是独立模块，各有自己的容器与单例', () => {
    const primary = DatabaseModule.forRoot({ url: 'postgres://primary', provide: PRIMARY });
    const replica = DatabaseModule.forRoot({ url: 'postgres://replica', provide: REPLICA });

    @Module({ imports: [primary, replica] })
    class AppModule {}

    const graph = resolveModuleGraph(AppModule);
    const nodes = graph.modules.filter((node) => node.module === DatabaseModule);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]!.ref).not.toBe(nodes[1]!.ref);
    expect(nodes[0]!.container.resolve(PRIMARY).url).toBe('postgres://primary');
    expect(nodes[1]!.container.resolve(REPLICA).url).toBe('postgres://replica');
  });

  it('同一个对象被引用两次只建一个节点，单例共享', () => {
    const shared = DatabaseModule.forRoot({ url: 'postgres://shared' });

    @Module({ imports: [shared] })
    class A {}
    @Module({ imports: [shared] })
    class B {}
    @Module({ imports: [A, B] })
    class AppModule {}

    const graph = resolveModuleGraph(AppModule);
    expect(graph.modules.filter((node) => node.module === DatabaseModule)).toHaveLength(1);

    // A 和 B 各自 alias 到同一个源容器，所以拿到同一个单例
    const fromA = graph.modules.find((node) => node.module === A)!.container.resolve(Pool);
    const fromB = graph.modules.find((node) => node.module === B)!.container.resolve(Pool);
    expect(fromA).toBe(fromB);
  });

  it('动态模块自己也能 imports 别的模块', () => {
    @Module({ providers: [{ provide: DB_URL, useValue: 'from-static' }], exports: [DB_URL] })
    class ConfigModule {}

    const dynamic = dynamicModule(DatabaseModule, {
      imports: [ConfigModule],
      providers: [Pool],
      exports: [Pool],
    });

    @Module({ imports: [dynamic] })
    class AppModule {}

    expect(resolveModuleGraph(AppModule).root.imports[0]!.container.resolve(Pool).url).toBe(
      'from-static',
    );
  });

  it('createApp 可以直接吃一个动态模块当根', async () => {
    const app = createApp(DatabaseModule.forRoot({ url: 'postgres://root' }), {
      routes: (hono, resolve) => hono.get('/pool', (c) => c.json({ url: resolve(Pool).url })),
    });

    expect(await (await app.hono.request('/pool')).json()).toEqual({ url: 'postgres://root' });
  });

  it('exports 依然受校验', () => {
    const broken = dynamicModule(DatabaseModule, { providers: [Pool], exports: [DB_URL] });
    @Module({ imports: [broken] })
    class AppModule {}

    expect(() => resolveModuleGraph(AppModule)).toThrow(/export 了/);
  });
});

describe('两条必须记住的规则', () => {
  it('两个 import 导出同一个 token 会冲突 —— 用 provide 区分开', () => {
    const a = DatabaseModule.forRoot({ url: 'a' });
    const b = DatabaseModule.forRoot({ url: 'b' });

    @Module({ imports: [a, b] })
    class AppModule {}

    expect(() => resolveModuleGraph(AppModule)).toThrow(AmbiguousImportError);
  });

  it('既 import 又本地提供同一个 token 也会冲突', () => {
    const db = DatabaseModule.forRoot({ url: 'x' });

    @Module({ imports: [db], providers: [Pool] })
    class AppModule {}

    expect(() => resolveModuleGraph(AppModule)).toThrow(AmbiguousProviderError);
  });
});

describe('用错时的报错', () => {
  it('只写类名、忘了调 forRoot，错误里会点名工厂方法', () => {
    @Module({ imports: [DatabaseModule] })
    class AppModule {}

    expect(() => resolveModuleGraph(AppModule)).toThrow(InvalidModuleError);
    expect(() => resolveModuleGraph(AppModule)).toThrow(/DatabaseModule\.forRoot\(\.\.\.\)/);
  });

  it('动态模块对象缺 module 字段会被指出', () => {
    @Module({ imports: [{ providers: [] } as unknown as DynamicModule] })
    class AppModule {}

    expect(() => resolveModuleGraph(AppModule)).toThrow(InvalidModuleError);
  });

  it('动态模块也能报成环', () => {
    const a = dynamicModule(DatabaseModule, {});
    const b = dynamicModule(DatabaseModule, { imports: [a] });
    (a as { imports?: unknown[] }).imports = [b];

    expect(() => resolveModuleGraph(b)).toThrow(ModuleCycleError);
  });
});
