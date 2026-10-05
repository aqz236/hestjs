import type { Container, Constructor, OnStart, OnStop } from '@hestjs/core';
import type { ConsumeOptions, JobPolicy, QueueDriver, QueuedJob } from './driver';
import { UnknownJobHandlerError, UnknownQueueError } from './errors';

export interface JobOptions {
  /** 延迟多久才开始处理（毫秒）。 */
  readonly delay?: number;
  /** 最多尝试几次，含第一次。默认 1（不重试）。 */
  readonly attempts?: number;
  /** 重试间隔策略。默认 fixed。 */
  readonly backoff?: 'fixed' | 'exponential';
  /** 重试基准间隔（毫秒）。默认 1000。 */
  readonly backoffDelay?: number;
}

export interface QueueConfig {
  /** 每个队列同时处理几条。默认 1。 */
  readonly concurrency?: number;
  /** 任务重试用尽时调用。默认打到 console.error。 */
  readonly onError?: (error: unknown, job: QueuedJob) => void;
  /** 换驱动。默认 MemoryQueueDriver。 */
  readonly driver?: QueueDriver;
}

export interface ProcessorRegistration {
  readonly queue: string;
  readonly handler: Constructor;
  readonly jobs: ReadonlyMap<string, readonly (string | symbol)[]>;
}

/**
 * 生产者用。注入它来投递任务。
 *
 * ```ts
 * class Users {
 *   constructor(@Inject(Queue) private readonly queue: Queue) {}
 *
 *   async create(name: string): Promise<void> {
 *     await this.queue.enqueue('mail', 'welcome', { name });
 *   }
 * }
 * ```
 */
export class Queue {
  constructor(
    private readonly driver: QueueDriver,
    private readonly knownQueues: ReadonlySet<string>,
  ) {}

  /** 已注册的队列名。 */
  get queues(): readonly string[] {
    return [...this.knownQueues];
  }

  async enqueue<T>(
    queue: string,
    job: string,
    payload: T,
    options: JobOptions = {},
  ): Promise<string> {
    if (!this.knownQueues.has(queue)) {
      throw new UnknownQueueError(queue, [...this.knownQueues]);
    }

    const policy: JobPolicy = {
      attempts: options.attempts ?? 1,
      backoff: options.backoff ?? 'fixed',
      backoffDelay: options.backoffDelay ?? 1000,
    };

    const id = crypto.randomUUID();
    await this.driver.enqueue({
      id,
      queue,
      name: job,
      payload,
      attempt: 1,
      delay: options.delay ?? 0,
      policy,
    });
    return id;
  }
}

/**
 * 消费者。由 `queue()` 注册，实现 `OnStart` / `OnStop`：
 * 启动时开始消费，关闭时停止取新任务并等在跑的结束。
 */
export class QueueRunner implements OnStart, OnStop {
  readonly #registrations: readonly ProcessorRegistration[];
  readonly #stops: Array<() => Promise<void>> = [];

  constructor(
    private readonly container: Container,
    private readonly driver: QueueDriver,
    private readonly config: QueueConfig,
    registrations: readonly ProcessorRegistration[],
  ) {
    this.#registrations = registrations;
  }

  get queues(): readonly string[] {
    return this.#registrations.map((registration) => registration.queue);
  }

  async onStart(): Promise<void> {
    // 先把方法找齐：拼错一个名字要在启动时炸，而不是等第一条任务进来
    for (const registration of this.#registrations) {
      const instance = this.container.resolve(registration.handler) as Record<
        string | symbol,
        unknown
      >;
      for (const [job, propertyKeys] of registration.jobs) {
        // 重复在 queue() 阶段就报过了，这里只可能有一个
        const propertyKey = propertyKeys[0]!;
        if (typeof instance[propertyKey] !== 'function') {
          throw new UnknownJobHandlerError(
            `${registration.handler.name}（${registration.queue}/${job}）`,
            String(propertyKey),
          );
        }
      }
    }

    const consumeOptions: ConsumeOptions = { concurrency: this.config.concurrency ?? 1 };
    for (const registration of this.#registrations) {
      this.#stops.push(
        await this.driver.consume(
          registration.queue,
          (job) => this.#handle(registration, job),
          consumeOptions,
        ),
      );
    }
  }

  async onStop(): Promise<void> {
    for (const stop of [...this.#stops].reverse()) {
      await stop();
    }
    this.#stops.length = 0;
  }

  async #handle(registration: ProcessorRegistration, job: QueuedJob): Promise<void> {
    const propertyKey = registration.jobs.get(job.name)?.[0];
    if (propertyKey === undefined) {
      // 这个 processor 没声明这条任务：不是错误，是别的消费者的事
      return;
    }

    const instance = this.container.resolve(registration.handler) as Record<
      string | symbol,
      unknown
    >;
    const method = instance[propertyKey] as (this: unknown, job: QueuedJob) => unknown;

    try {
      await method.call(instance, job);
    } catch (error) {
      const { attempts, backoff, backoffDelay } = job.policy;

      if (job.attempt < attempts) {
        const delay = backoff === 'exponential' ? backoffDelay * 2 ** (job.attempt - 1) : backoffDelay;
        await this.driver.enqueue({ ...job, attempt: job.attempt + 1, delay });
        return;
      }

      if (this.config.onError !== undefined) {
        this.config.onError(error, job);
        return;
      }
      console.error(`[hestjs] 队列任务 ${job.queue}/${job.name}（${job.id}）失败：`, error);
    }
  }
}
