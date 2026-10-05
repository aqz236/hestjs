import PQueue from 'p-queue';
import type { ConsumeOptions, EnqueuedJob, QueueDriver, QueuedJob } from './driver';

/**
 * 单进程内存队列。
 *
 * 能用的场景：单实例部署的后台任务、开发与测试、以及作为换驱动的参考实现。
 *
 * **不能用的场景**：进程重启后未处理的任务会丢，也没有跨进程协调。
 * 生产环境请换一个有持久化的 driver。
 */
export class MemoryQueueDriver implements QueueDriver {
  readonly #queues = new Map<string, PQueue>();
  readonly #handlers = new Map<string, (job: QueuedJob) => Promise<void>>();
  readonly #pending = new Map<string, EnqueuedJob[]>();
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  #stopped = false;

  async enqueue(job: EnqueuedJob): Promise<void> {
    if (this.#stopped) {
      return;
    }
    if (job.delay > 0) {
      const timer = setTimeout(() => {
        this.#timers.delete(timer);
        this.#dispatch(job);
      }, job.delay);
      timer.unref?.();
      this.#timers.add(timer);
      return;
    }
    this.#dispatch(job);
  }

  async consume(
    queue: string,
    handler: (job: QueuedJob) => Promise<void>,
    options: ConsumeOptions,
  ): Promise<() => Promise<void>> {
    const runner = new PQueue({ concurrency: options.concurrency });
    this.#queues.set(queue, runner);
    this.#handlers.set(queue, handler);

    // 消费开始前入队的任务先攒着，这里一次性放出去
    const buffered = this.#pending.get(queue) ?? [];
    this.#pending.delete(queue);
    for (const job of buffered) {
      this.#push(queue, job);
    }

    return async () => {
      runner.pause();
      this.#handlers.delete(queue);
      await runner.onIdle();
    };
  }

  /** 停掉所有延迟计时器。给测试收尾用。 */
  async close(): Promise<void> {
    this.#stopped = true;
    for (const timer of this.#timers) {
      clearTimeout(timer);
    }
    this.#timers.clear();
    await Promise.all([...this.#queues.values()].map((queue) => queue.onIdle()));
  }

  #dispatch(job: EnqueuedJob): void {
    if (!this.#handlers.has(job.queue)) {
      // 还没有消费者：先攒着，避免 enqueue 早于 onStart 时丢任务
      this.#pending.set(job.queue, [...(this.#pending.get(job.queue) ?? []), job]);
      return;
    }
    this.#push(job.queue, job);
  }

  #push(queue: string, job: EnqueuedJob): void {
    const runner = this.#queues.get(queue);
    const handler = this.#handlers.get(queue);
    if (runner === undefined || handler === undefined) {
      return;
    }
    void runner.add(() => handler(job));
  }
}
