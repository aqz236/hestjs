import type { Constructor, ProviderEntry } from '@hestjs/core';
import { NoScheduledMethodsError } from './errors';
import { readSchedules } from './metadata';
import { Scheduler, type ScheduleConfig } from './scheduler';

/**
 * 一次性注册任务类与调度器。
 *
 * ```ts
 * @Module({
 *   providers: [CleanupTask, ...schedule([CleanupTask])],
 * })
 * class AppModule {}
 * ```
 *
 * 任务类必须显式列出来：不扫目录、不建全局注册表。
 * 列进来却没有一个被 `@Cron` / `@Interval` / `@Timeout` 标记的类会直接报错 ——
 * 那是漏写装饰器，不是空任务。
 */
export function schedule(
  tasks: readonly Constructor[],
  config: ScheduleConfig = {},
): ProviderEntry[] {
  for (const task of tasks) {
    if (readSchedules(task.prototype).size === 0) {
      throw new NoScheduledMethodsError([task.name]);
    }
  }

  return [
    ...tasks,
    {
      provide: Scheduler,
      useFactory: (container) => new Scheduler(container, tasks, config),
    },
  ];
}
