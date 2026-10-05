import { defineInjectParam } from '../metadata';
import type { Constructor, Token } from '../types';

/**
 * 声明构造函数某个参数要注入什么。
 *
 * ```ts
 * class UserService {
 *   constructor(@Inject(Repository) private db: Repository) {}
 * }
 * ```
 *
 * 每个构造参数都必须标注。少标一个，容器在**启动时**就抛 MissingInjectError ——
 * 而不是等到某个方法被调用时才发现拿到的是 undefined。
 */
export function Inject(token: Token): ParameterDecorator {
  return (target, _propertyKey, index) => {
    defineInjectParam(target as unknown as Constructor, index, token);
  };
}
