export const SCHEDULE_META = Symbol.for('hestjs:schedule');

export type ScheduleKind = 'cron' | 'interval' | 'timeout';

export interface ScheduleEntry {
  readonly kind: ScheduleKind;
  /** cron 表达式，或 interval/timeout 的毫秒数。 */
  readonly spec: string | number;
  /** 唯一名字。默认是 `TaskClass.method`。 */
  readonly name: string;
  readonly timezone?: string;
  readonly maxRuns?: number;
  /** 上一次没跑完时，本次是否照常开始。默认 false（跳过）。 */
  readonly overlap: boolean;
}

interface Carrier {
  [SCHEDULE_META]?: Map<string | symbol, ScheduleEntry[]>;
}

/**
 * 往原型上挂一条定时声明。
 *
 * 和路由元数据一样，必须是原型自己的 Map：顺着原型链写会让子类污染父类。
 */
export function addSchedule(prototype: object, propertyKey: string | symbol, entry: ScheduleEntry): void {
  if (!Object.hasOwn(prototype, SCHEDULE_META)) {
    Object.defineProperty(prototype, SCHEDULE_META, {
      value: new Map<string | symbol, ScheduleEntry[]>(),
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  const map = (prototype as Carrier)[SCHEDULE_META]!;
  map.set(propertyKey, [...(map.get(propertyKey) ?? []), entry]);
}

export function readSchedules(prototype: object): ReadonlyMap<string | symbol, ScheduleEntry[]> {
  return (prototype as Carrier)[SCHEDULE_META] ?? new Map();
}
