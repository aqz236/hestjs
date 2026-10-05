import { defineInjectable } from '../metadata';
import type { Constructor, Scope } from '../types';

export interface InjectableOptions {
  /** 默认 singleton。transient 表示每次解析都新建。 */
  readonly scope?: Scope;
}

/**
 * 声明一个类的作用域。不写就是 singleton。
 *
 * 作用域只有这一个来源 —— provider 对象里没有 scope 字段，
 * 免得同一个东西有两个地方可以改。
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return (target) => {
    defineInjectable(target as unknown as Constructor, { scope: options.scope ?? 'singleton' });
  };
}
