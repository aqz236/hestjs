/** 重试策略。跟着任务走，重试时不依赖调用方再传一次。 */
export interface JobPolicy {
  /** 最多尝试几次，含第一次。 */
  readonly attempts: number;
  readonly backoff: 'fixed' | 'exponential';
  /** 重试基准间隔（毫秒）。 */
  readonly backoffDelay: number;
}

/** 一条待消费的任务。handler 收到的东西。 */
export interface QueuedJob {
  readonly id: string;
  readonly queue: string;
  readonly name: string;
  readonly payload: unknown;
  /** 第几次尝试，从 1 开始。 */
  readonly attempt: number;
  readonly policy: JobPolicy;
}

/** 一条刚入队的任务。`delay` 表示多久之后才可被消费。 */
export interface EnqueuedJob extends QueuedJob {
  readonly delay: number;
}

export interface ConsumeOptions {
  /** 同时处理几条。 */
  readonly concurrency: number;
}

/**
 * 队列驱动。
 *
 * 内置的 `MemoryQueueDriver` 只在**单进程内存**里排队：进程重启任务就没了。
 * 需要持久化、跨进程、横向扩容时实现这个接口换上去 ——
 * 重试策略、生命周期、错误处理都在框架这侧，驱动只负责「排队」与「取任务」。
 */
export interface QueueDriver {
  enqueue(job: EnqueuedJob): Promise<void>;
  /**
   * 开始消费。
   *
   * 返回一个停止函数：调用后不再取新任务，并**等在跑的任务结束**。
   */
  consume(
    queue: string,
    handler: (job: QueuedJob) => Promise<void>,
    options: ConsumeOptions,
  ): Promise<() => Promise<void>>;
}
