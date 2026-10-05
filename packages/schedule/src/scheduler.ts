import { Cron as Croner } from 'croner';
import type { Container, Constructor, OnStart, OnStop } from '@hestjs/core';
import {
  DuplicateScheduleNameError,
  InvalidScheduleSpecError,
  UnknownScheduleNameError,
  UnknownScheduledMethodError,
} from './errors';
import { readSchedules, type ScheduleEntry } from './metadata';

export interface ScheduleContext {
  readonly task: string;
  readonly method: string;
  readonly name: string;
}

export interface ScheduleConfig {
  /**
   * 任务抛错时调用。默认打到 `console.error`。
   *
   * 一个任务失败不该让调度器停摆，但也不该被静默吞掉。
   */
  readonly onError?: (error: unknown, context: ScheduleContext) => void;
  /** `onStop` 等待在跑任务的最长时间（毫秒）。默认一直等。 */
  readonly shutdownTimeout?: number;
}

interface Job {
  readonly name: string;
  readonly task: string;
  readonly method: string | symbol;
  readonly entry: ScheduleEntry;
  readonly instance: Record<string | symbol, unknown>;
  running: boolean;
  stop(): void;
}

/**
 * 定时任务调度器。
 *
 * 由 `schedule()` 注册成 provider，实现 `OnStart` / `OnStop`：
 * 启动时建好所有定时器，关闭时停掉并等在跑的任务结束。
 *
 * 可以直接注入它做手动触发或查看现状：
 *
 * ```ts
 * const scheduler = app.container.resolve(Scheduler);
 * await scheduler.run('CleanupTask.cleanup');
 * scheduler.names;   // 全部任务名
 * ```
 */
export class Scheduler implements OnStart, OnStop {
  readonly #jobs = new Map<string, Job>();
  readonly #inflight = new Set<Promise<void>>();

  constructor(
    private readonly container: Container,
    private readonly tasks: readonly Constructor[],
    private readonly config: ScheduleConfig = {},
  ) {}

  /** 全部已注册的任务名。 */
  get names(): readonly string[] {
    return [...this.#jobs.keys()];
  }

  onStart(): void {
    for (const task of this.tasks) {
      const instance = this.container.resolve(task) as Record<string | symbol, unknown>;

      for (const [propertyKey, entries] of readSchedules(task.prototype)) {
        const method = instance[propertyKey];
        if (typeof method !== 'function') {
          throw new UnknownScheduledMethodError(task.name, String(propertyKey));
        }
        for (const entry of entries) {
          if (this.#jobs.has(entry.name)) {
            const existing = this.#jobs.get(entry.name)!;
            throw new DuplicateScheduleNameError(
              entry.name,
              `${existing.task}.${String(existing.method)}`,
              `${task.name}.${String(propertyKey)}`,
            );
          }
          this.#jobs.set(
            entry.name,
            this.#createJob(entry, task, propertyKey, instance),
          );
        }
      }
    }
  }

  async onStop(): Promise<void> {
    for (const job of this.#jobs.values()) {
      job.stop();
    }
    this.#jobs.clear();

    if (this.#inflight.size === 0) {
      return;
    }

    const settled = Promise.allSettled([...this.#inflight]);
    const timeout = this.config.shutdownTimeout;
    if (timeout === undefined) {
      await settled;
      return;
    }

    // 等太久就放弃，但不能留下未处理的 rejection
    await Promise.race([
      settled,
      new Promise<void>((resolve) => {
        setTimeout(resolve, timeout).unref?.();
      }),
    ]);
  }

  /** 手动跑一次。给测试、管理端点、或者补跑用。 */
  async run(name: string): Promise<void> {
    const job = this.#jobs.get(name);
    if (job === undefined) {
      throw new UnknownScheduleNameError(name, [...this.#jobs.keys()]);
    }
    await this.#execute(job);
  }

  #createJob(
    entry: ScheduleEntry,
    task: Constructor,
    propertyKey: string | symbol,
    instance: Record<string | symbol, unknown>,
  ): Job {
    const context: ScheduleContext = {
      task: task.name,
      method: String(propertyKey),
      name: entry.name,
    };

    const job: Job = {
      name: entry.name,
      task: task.name,
      method: propertyKey,
      entry,
      instance,
      running: false,
      stop: () => undefined,
    };

    if (entry.kind === 'cron') {
      try {
        const cron = new Croner(
          entry.spec as string,
          {
            // 刻意不传 name：croner 的命名任务是**全局**注册表，
            // 同进程两个应用（或两次测试）会撞名。我们自己用 Map 管名字。
            protect: !entry.overlap,
            ...(entry.timezone === undefined ? {} : { timezone: entry.timezone }),
            ...(entry.maxRuns === undefined ? {} : { maxRuns: entry.maxRuns }),
            unref: true,
            catch: (error: unknown) => this.#report(error, context),
          },
          () => void this.#execute(job),
        );
        job.stop = () => cron.stop();
      } catch (error) {
        throw new InvalidScheduleSpecError(
          task.name,
          String(propertyKey),
          error instanceof Error ? error.message : String(error),
        );
      }
      return job;
    }

    const delay = entry.spec as number;
    if (!Number.isFinite(delay) || delay < 0) {
      throw new InvalidScheduleSpecError(task.name, String(propertyKey), `${delay} 不是合法的毫秒数`);
    }

    if (entry.kind === 'timeout') {
      const timer = setTimeout(() => void this.#execute(job), delay);
      timer.unref?.();
      job.stop = () => clearTimeout(timer);
      return job;
    }

    const timer = setInterval(() => void this.#execute(job), delay);
    timer.unref?.();
    job.stop = () => clearInterval(timer);
    return job;
  }

  #execute(job: Job): Promise<void> {
    // interval / timeout 没有 croner 的 protect，自己挡一次
    if (!job.entry.overlap && job.running) {
      return Promise.resolve();
    }
    job.running = true;

    const promise = (async () => {
      try {
        const method = job.instance[job.method] as (this: unknown) => unknown;
        await method.call(job.instance);
      } catch (error) {
        this.#report(error, { task: job.task, method: String(job.method), name: job.name });
      } finally {
        job.running = false;
      }
    })();

    this.#inflight.add(promise);
    void promise.then(() => this.#inflight.delete(promise));
    return promise;
  }

  #report(error: unknown, context: ScheduleContext): void {
    if (this.config.onError !== undefined) {
      this.config.onError(error, context);
      return;
    }
    console.error(`[hestjs] 定时任务 ${context.name} 抛错：`, error);
  }
}
