import { CircularDependencyError, ProviderNotFoundError } from './errors';
import type { Constructor, Provider, Scope, Token } from './types';

interface Registration {
  readonly provider: Provider;
  readonly scope: Scope;
}

function toRegistration(provider: Provider): Registration {
  if ('useValue' in provider) {
    return { provider, scope: 'singleton' };
  }
  return { provider, scope: provider.scope ?? 'singleton' };
}

/**
 * 依赖容器。
 *
 * 没有反射、没有装饰器魔法：解析一条依赖就是读 `static inject` 然后 `new`。
 * 父子关系只用于覆盖，不做作用域隔离——模块边界由模块图负责，容器只负责构造。
 */
export class Container {
  readonly #registrations = new Map<Token, Registration>();
  readonly #instances = new Map<Token, unknown>();
  readonly #resolving = new Set<Token>();

  readonly parent: Container | undefined;

  constructor(parent?: Container) {
    this.parent = parent;
  }

  register(...providers: readonly Provider[]): this {
    for (const provider of providers) {
      this.#registrations.set(provider.provide, toRegistration(provider));
    }
    return this;
  }

  has(token: Token): boolean {
    return this.#registrations.has(token) || (this.parent?.has(token) ?? false);
  }

  resolve<T>(token: Token<T>): T {
    const registration = this.#registrations.get(token);

    if (registration === undefined) {
      if (this.parent !== undefined) {
        return this.parent.resolve(token);
      }
      throw new ProviderNotFoundError(token);
    }

    if (registration.scope === 'singleton' && this.#instances.has(token)) {
      return this.#instances.get(token) as T;
    }

    if (this.#resolving.has(token)) {
      throw new CircularDependencyError(token);
    }

    this.#resolving.add(token);
    try {
      const value = this.#create(registration.provider);
      if (registration.scope === 'singleton') {
        this.#instances.set(token, value);
      }
      return value as T;
    } finally {
      this.#resolving.delete(token);
    }
  }

  resolveAll(tokens: readonly Token[]): unknown[] {
    return tokens.map((token) => this.resolve(token));
  }

  createChild(): Container {
    return new Container(this);
  }

  #create(provider: Provider): unknown {
    if ('useValue' in provider) {
      return provider.useValue;
    }
    if ('useFactory' in provider) {
      return provider.useFactory(this);
    }
    const { useClass } = provider;
    const dependencies = useClass.inject ?? [];
    return new useClass(...this.resolveAll(dependencies));
  }
}

export function isConstructor(token: Token): token is Constructor {
  return typeof token === 'function';
}
