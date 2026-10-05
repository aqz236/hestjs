/**
 * 取得命令 / 查询 / 事件的类型名。
 *
 * 这些名字在「注册」与「执行」两处被用于查表，因此两边必须得到同一个结果。
 * 但入参形态不同：注册时传的是**类本身**，执行时传的是**实例**。
 *
 * 早先的实现统一用 `Object.getPrototypeOf(value).constructor.name`：
 *
 *   getTypeName(CreateUser)         // Object.getPrototypeOf(类) -> Command
 *                                   // => 'Command'（父类名！）
 *   getTypeName(new CreateUser())   // -> 'CreateUser'
 *
 * 两边永不相等，导致所有命令与查询的执行都抛 *HandlerNotFoundException，
 * 即 CommandBus / QueryBus 实际上从未成功执行过。
 */
export function resolveTypeName(value: unknown): string {
  if (typeof value === 'function') {
    // 传入的是类本身
    return (value as { name?: string }).name || 'AnonymousType';
  }

  if (value !== null && typeof value === 'object') {
    // 传入的是实例
    return (value as object).constructor?.name || 'AnonymousType';
  }

  return String(value);
}
