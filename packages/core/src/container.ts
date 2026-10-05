import {
  AmbiguousProviderError,
  CircularDependencyError,
  DuplicateProviderError,
  ProviderNotFoundError,
} from './errors';
import { normalizeProvider } from './metadata';
import type { Provider, ProviderEntry, Scope, Token } from './types';

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
 * 只有两种登记方式：
 * - `provide()` 自己造值
 * - `alias()` 把另一个容器的 token 借进来（解析时回到源容器，所以单例共享）
 *
 * 没有 parent 链。谁看得见谁，全部由模块图显式写成 alias，不用猜。
 */
export class Container {
  readonly #providers = new Map<Token, Registration>();
  readonly #aliases = new Map<Token, Container>();
  readonly #instances = new Map<Token, unknown>();
  readonly #resolving = new Set<Token>();

  provide(...entries: readonly ProviderEntry[]): this {
    for (const entry of entries) {
      const provider = normalizeProvider(entry);
      const { provide: token } = provider;

      if (this.#aliases.has(token)) {
        throw new AmbiguousProviderError('container', token);
      }
      if (this.#providers.has(token)) {
        throw new DuplicateProviderError('container', token);
      }
      this.#providers.set(token, toRegistration(provider));
    }
    return this;
  }

  /**
   * 替换已登记的 provider，并丢掉缓存实例。
   *
   * 只替换、不新增：找不到就返回 false，由调用方决定怎么报错。
   * 这是测试替身的唯一入口 —— 不给「运行时偷偷换实现」留后门。
   */
  override(entry: ProviderEntry): boolean {
    const provider = normalizeProvider(entry);
    const { provide: token } = provider;
    if (!this.#providers.has(token)) {
      return false;
    }
    this.#providers.set(token, toRegistration(provider));
    this.#instances.delete(token);
    return true;
  }

  alias(token: Token, source: Container): this {
    if (this.#providers.has(token)) {
      throw new AmbiguousProviderError('container', token);
    }
    const existing = this.#aliases.get(token);
    if (existing !== undefined && existing !== source) {
      throw new DuplicateProviderError('container', token);
    }
    this.#aliases.set(token, source);
    return this;
  }

  /** 本容器能解析的 token（含借来的）。 */
  has(token: Token): boolean {
    return this.#providers.has(token) || this.#aliases.has(token);
  }

  /** 本容器自己提供的 token。 */
  provides(token: Token): boolean {
    return this.#providers.has(token);
  }

  aliasSource(token: Token): Container | undefined {
    return this.#aliases.get(token);
  }

  /** 本容器自己提供的 token，按登记顺序。 */
  tokens(): readonly Token[] {
    return [...this.#providers.keys()];
  }

  resolve<T>(token: Token<T>): T {
    if (this.#resolving.has(token)) {
      throw new CircularDependencyError(token);
    }
    this.#resolving.add(token);
    try {
      const source = this.#aliases.get(token);
      if (source !== undefined) {
        return source.resolve(token);
      }

      const registration = this.#providers.get(token);
      if (registration === undefined) {
        throw new ProviderNotFoundError(token);
      }

      if (this.#instances.has(token)) {
        return this.#instances.get(token) as T;
      }

      const value = this.#instantiate(registration.provider);
      if (registration.scope === 'singleton') {
        this.#instances.set(token, value);
      }
      return value as T;
    } finally {
      this.#resolving.delete(token);
    }
  }

  /**
   * 按登记顺序把本容器所有 provider 都建出来。
   *
   * 启动时调用：单例的构造错误会在启动阶段就炸出来，而不是等到某个请求打进来。
   */
  instantiateAll(): readonly unknown[] {
    return this.tokens().map((token) => this.resolve(token));
  }

  #instantiate(provider: Provider): unknown {
    if ('useValue' in provider) {
      return provider.useValue;
    }
    if ('useFactory' in provider) {
      return provider.useFactory(this);
    }
    const dependencies = provider.useClass.inject ?? [];
    return new provider.useClass(...dependencies.map((token) => this.resolve(token)));
  }
}
