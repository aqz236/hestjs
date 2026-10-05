export const PROCESSOR_META = Symbol.for('hestjs:queue:processor');
export const PROCESS_META = Symbol.for('hestjs:queue:process');

type ProcessMap = Map<string, Array<string | symbol>>;

/**
 * 方法级：这条任务名由哪个方法处理。
 *
 * 存的是数组而不是单值 —— 两条 `@Process('same')` 必须能被发现，
 * 而不是后者静默覆盖前者。重复检查在 `queue()` 里做。
 */
export function addProcess(prototype: object, job: string, propertyKey: string | symbol): void {
  if (!Object.hasOwn(prototype, PROCESS_META)) {
    Object.defineProperty(prototype, PROCESS_META, {
      value: new Map<string, Array<string | symbol>>(),
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  const map = (prototype as Record<symbol, ProcessMap>)[PROCESS_META]!;
  map.set(job, [...(map.get(job) ?? []), propertyKey]);
}

export function readProcesses(prototype: object): ReadonlyMap<string, readonly (string | symbol)[]> {
  return (prototype as Record<symbol, ProcessMap>)[PROCESS_META] ?? new Map();
}

/** 类级：这个 processor 消费哪个队列。 */
export function defineProcessor(target: object, queue: string): void {
  (target as Record<symbol, string>)[PROCESSOR_META] = queue;
}

export function readProcessor(target: object): string | undefined {
  return (target as Record<symbol, string>)[PROCESSOR_META];
}
