import { addSchedule, type ScheduleEntry } from './metadata';

export interface ScheduleOptions {
  /** 唯一名字，默认 `TaskClass.method`。用于手动触发与日志定位。 */
  readonly name?: string;
  /** IANA 时区，例如 `Asia/Shanghai`。不写就用系统时区。 */
  readonly timezone?: string;
  /** 跑多少次之后自动停。默认不限。 */
  readonly maxRuns?: number;
  /** 上一次还没跑完时，本次是否照常开始。默认 false。 */
  readonly overlap?: boolean;
}

function decorator(kind: ScheduleEntry['kind'], spec: string | number) {
  return (options: ScheduleOptions = {}): MethodDecorator =>
    (target, propertyKey) => {
      const className = target.constructor?.name ?? '<匿名>';
      addSchedule(target, propertyKey, {
        kind,
        spec,
        name: options.name ?? `${className}.${String(propertyKey)}`,
        ...(options.timezone === undefined ? {} : { timezone: options.timezone }),
        ...(options.maxRuns === undefined ? {} : { maxRuns: options.maxRuns }),
        overlap: options.overlap ?? false,
      });
    };
}

/**
 * 标准 cron 表达式。支持 5 / 6 / 7 段（含秒），解析交给 `croner`。
 *
 * ```ts
 * @Cron('0 3 * * *', { timezone: 'Asia/Shanghai' })
 * cleanup(): Promise<void> {}
 * ```
 */
export function Cron(expression: string, options?: ScheduleOptions): MethodDecorator {
  return decorator('cron', expression)(options);
}

/**
 * 每 N 毫秒跑一次。
 *
 * 用原生定时器而不是 cron：毫秒精度是 `Interval` 存在的意义，
 * cron 的最小粒度是秒。
 */
export function Interval(milliseconds: number, options?: ScheduleOptions): MethodDecorator {
  return decorator('interval', milliseconds)(options);
}

/** 延迟 N 毫秒后跑一次。 */
export function Timeout(milliseconds: number, options?: ScheduleOptions): MethodDecorator {
  return decorator('timeout', milliseconds)(options);
}
