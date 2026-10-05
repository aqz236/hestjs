/**
 * 三种消息的基类。
 *
 * 泛型参数只用于类型推导，不产生运行时代码——`declare` 让它不出现在产物里。
 * 继承它们是为了拿到 `instanceof`，而不是为了拿走什么实现。
 */

/** 改变系统状态。默认没有返回值。 */
export abstract class Command<TResult = void> {
  declare readonly __result: TResult;
}

/** 只读查询。必须声明返回类型。 */
export abstract class Query<TResult> {
  declare readonly __result: TResult;
}

/** 已经发生的事实。命名用过去式。 */
export abstract class Event {
  declare readonly __event: true;
}

export type ResultOf<M> = M extends Command<infer R> | Query<infer R> ? R : never;
