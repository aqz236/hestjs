import { describe, expect, it } from 'bun:test';
import { Container } from './container';
import { CircularDependencyError, ProviderNotFoundError } from './errors';
import { Injectable } from './decorators/injectable';
import type { ProviderEntry, Token } from './types';

const CONFIG: unique symbol = Symbol('config');

@Injectable()
class Repository {
  readonly name = 'repo';
}

@Injectable()
class Service {
  static readonly inject = [Repository, CONFIG] as const;

  constructor(
    readonly repository: Repository,
    readonly config: { dsn: string },
  ) {}
}

describe('Container', () => {
  it('默认 singleton，只建一次', () => {
    const container = new Container().provide(Repository);
    expect(container.resolve(Repository)).toBe(container.resolve(Repository));
  });

  it('transient 每次都新建', () => {
    const container = new Container().provide({
      provide: Repository,
      useClass: Repository,
      scope: 'transient',
    });
    expect(container.resolve(Repository)).not.toBe(container.resolve(Repository));
  });

  it('useValue 原样返回', () => {
    const container = new Container().provide({ provide: CONFIG, useValue: { dsn: 'x' } });
    expect(container.resolve<{ dsn: string }>(CONFIG)).toEqual({ dsn: 'x' });
  });

  it('useFactory 拿到容器本身', () => {
    const container = new Container().provide(
      Repository,
      { provide: CONFIG, useFactory: (c) => ({ dsn: c.resolve(Repository).name }) },
    );
    expect(container.resolve<{ dsn: string }>(CONFIG)).toEqual({ dsn: 'repo' });
  });

  it('按 static inject 顺序注入', () => {
    const container = new Container().provide(Repository, Service, {
      provide: CONFIG,
      useValue: { dsn: 'x' },
    });
    const service = container.resolve(Service);
    expect(service.repository).toBeInstanceOf(Repository);
    expect(service.config.dsn).toBe('x');
  });

  it('未注册的 token 抛出可读错误', () => {
    expect(() => new Container().resolve(CONFIG)).toThrow(ProviderNotFoundError);
  });

  it('依赖环会被发现', () => {
    class A {
      static inject: readonly Token[] = [];
    }
    class B {
      static inject: readonly Token[] = [A];
    }
    A.inject = [B];
    const container = new Container().provide(A as ProviderEntry, B as ProviderEntry);
    expect(() => container.resolve(A)).toThrow(CircularDependencyError);
  });

  it('同一 token 提供两次直接报错', () => {
    expect(() => new Container().provide(Repository, Repository)).toThrow();
  });

  it('alias 到源容器时单例共享', () => {
    const source = new Container().provide(Repository);
    const consumer = new Container().alias(Repository, source);
    expect(consumer.resolve(Repository)).toBe(source.resolve(Repository));
  });

  it('alias 与本地 provide 冲突时报错', () => {
    const source = new Container();
    const consumer = new Container().provide(Repository);
    expect(() => consumer.alias(Repository, source)).toThrow();
  });

  it('instantiateAll 返回本容器全部 provider', () => {
    const container = new Container().provide(Repository, { provide: CONFIG, useValue: { dsn: 'x' } });
    expect(container.instantiateAll()).toHaveLength(2);
  });
});
