import { defineInjectable } from '../metadata';
import type { Constructor, Scope } from '../types';

export interface InjectableOptions {
  /** 默认 singleton。transient 表示每次解析都新建。 */
  readonly scope?: Scope;
}

/**
 * 标记一个类可以被容器构造。
 *
 * 装饰器本身只写入元数据，注册与否由模块的 providers 决定。
 * 依赖用 `static inject` 声明，不依赖 emitDecoratorMetadata。
 *
 * ```ts
 * @Injectable()
 * class UserService {
 *   static readonly inject = [Database] as const;
 *   constructor(private readonly db: Database) {}
 * }
 * ```
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return (target) => {
    defineInjectable(target as unknown as Constructor, { scope: options.scope ?? 'singleton' });
  };
}
