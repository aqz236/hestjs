import { describe, expect, it } from 'bun:test';
import { Container } from './container';
import { CircularDependencyError, MissingInjectError, ProviderNotFoundError } from './errors';
import { Inject } from './decorators/inject';
import { token } from './token';
import { Injectable } from './decorators/injectable';
import type { ProviderEntry } from './types';

const CONFIG = token<{ dsn: string }>('config');

class Repository {
  readonly name = 'repo';
}

class Service {
  constructor(
    @Inject(Repository) readonly repository: Repository,
    @Inject(CONFIG) readonly config: { dsn: string },
  ) {}
}

describe('Container', () => {
  it('默认 singleton，只建一次', () => {
    const container = new Container().provide(Repository);
    expect(container.resolve(Repository)).toBe(container.resolve(Repository));
  });

  it('@Injectable({ scope: "transient" }) 每次都新建', () => {
    @Injectable({ scope: 'transient' })
    class Transient {}

    const container = new Container().provide(Transient);
    expect(container.resolve(Transient)).not.toBe(container.resolve(Transient));
  });

  it('useValue 原样返回', () => {
    const container = new Container().provide({ provide: CONFIG, useValue: { dsn: 'x' } });
    expect(container.resolve(CONFIG)).toEqual({ dsn: 'x' });
  });

  it('useFactory 拿到容器本身', () => {
    const container = new Container().provide(
      Repository,
      { provide: CONFIG, useFactory: (c) => ({ dsn: c.resolve(Repository).name }) },
    );
    expect(container.resolve(CONFIG)).toEqual({ dsn: 'repo' });
  });

  it('按 @Inject 的位置注入', () => {
    const container = new Container().provide(Repository, Service, {
      provide: CONFIG,
      useValue: { dsn: 'x' },
    });
    const service = container.resolve(Service);
    expect(service.repository).toBeInstanceOf(Repository);
    expect(service.config.dsn).toBe('x');
  });

  it('少标一个 @Inject 在启动期就报错，而不是留到调用时', () => {
    class Half {
      constructor(
        @Inject(Repository) readonly repository: Repository,
        readonly forgotten: unknown,
      ) {}
    }
    const container = new Container().provide(Repository, Half as ProviderEntry);
    expect(() => container.resolve(Half)).toThrow(MissingInjectError);
  });

  it('带默认值的参数不算进 arity，不会被误报', () => {
    class Optional {
      constructor(
        @Inject(Repository) readonly repository: Repository,
        readonly retries = 3,
      ) {}
    }
    const container = new Container().provide(Repository, Optional as ProviderEntry);
    expect(container.resolve(Optional).retries).toBe(3);
  });

  it('未注册的 token 抛出可读错误', () => {
    expect(() => new Container().resolve(CONFIG)).toThrow(ProviderNotFoundError);
  });

  it('依赖环会被发现', () => {
    // 用字符串 token 打断「声明顺序必须先于引用」的限制：
    // A → 'b' → B → A
    class A {
      constructor(@Inject('b') readonly b: unknown) {}
    }
    class B {
      constructor(@Inject(A) readonly a: A) {}
    }
    const container = new Container().provide(A as ProviderEntry, {
      provide: 'b',
      useClass: B,
    });
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

  it('override 只替换已登记的 token', () => {
    const container = new Container().provide(Repository);
    expect(container.override({ provide: Repository, useValue: { name: 'fake' } })).toBe(true);
    expect(container.override({ provide: CONFIG, useValue: 1 })).toBe(false);
    expect(container.resolve<{ name: string }>(Repository).name).toBe('fake');
  });

  it('instantiateAll 返回本容器全部 provider', () => {
    const container = new Container().provide(Repository, { provide: CONFIG, useValue: { dsn: 'x' } });
    expect(container.instantiateAll()).toHaveLength(2);
  });
});
