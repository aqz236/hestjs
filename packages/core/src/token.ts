import type { Token } from './types';

/**
 * 造一个带类型的 token。
 *
 * `const X = Symbol('x')` 的类型是 `unique symbol`，而 `Token<T>` 里的
 * `symbol` 分支推不出 `T`，于是 `container.resolve(X)` 得到 `unknown`。
 * 用它包一层就能把值类型带上：
 *
 * ```ts
 * const CLOCK = token<() => string>('clock');
 * container.resolve(CLOCK);   // () => string
 * ```
 *
 * 类作 token 时不需要它 —— 类型天然就在。
 */
export function token<T>(description: string): Token<T> {
  return Symbol(description);
}
