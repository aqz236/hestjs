import type { Constructor, ProviderEntry } from '@hestjs/core';
import { MemoryQueueDriver } from './memory-driver';
import {
  DuplicateJobHandlerError,
  DuplicateProcessorError,
  MissingProcessorDecoratorError,
  NoProcessorJobsError,
} from './errors';
import { readProcesses, readProcessor } from './metadata';
import { Queue, QueueRunner, type ProcessorRegistration, type QueueConfig } from './queue';

/**
 * 一次性注册 processor 与队列服务。
 *
 * ```ts
 * @Module({
 *   providers: [MailProcessor, ...queue([MailProcessor])],
 * })
 * class AppModule {}
 * ```
 *
 * processor 必须显式列出来：不扫目录、不建全局注册表。
 */
export function queue(
  processors: readonly Constructor[],
  config: QueueConfig = {},
): ProviderEntry[] {
  const registrations: ProcessorRegistration[] = [];
  const byQueue = new Map<string, Constructor>();
  const handlers = new Map<string, Constructor>();

  for (const handler of processors) {
    const queueName = readProcessor(handler);
    if (queueName === undefined) {
      throw new MissingProcessorDecoratorError(handler.name);
    }

    const jobs = readProcesses(handler.prototype);
    if (jobs.size === 0) {
      throw new NoProcessorJobsError([handler.name]);
    }

    const existingProcessor = byQueue.get(queueName);
    if (existingProcessor !== undefined) {
      throw new DuplicateProcessorError(queueName, existingProcessor.name, handler.name);
    }

    for (const [job, propertyKeys] of jobs) {
      // 同一个类里两条 @Process('same')：不报的话后者会静默覆盖前者
      if (propertyKeys.length > 1) {
        throw new DuplicateJobHandlerError(
          queueName,
          job,
          `${handler.name}.${String(propertyKeys[0])}`,
          `${handler.name}.${String(propertyKeys[1])}`,
        );
      }

      const key = `${queueName}:${job}`;
      const existing = handlers.get(key);
      if (existing !== undefined) {
        throw new DuplicateJobHandlerError(queueName, job, existing.name, handler.name);
      }
      handlers.set(key, handler);
    }

    byQueue.set(queueName, handler);
    registrations.push({ queue: queueName, handler, jobs });
  }

  const driver = config.driver ?? new MemoryQueueDriver();
  const knownQueues = new Set(byQueue.keys());

  return [
    ...processors,
    { provide: Queue, useFactory: () => new Queue(driver, knownQueues) },
    {
      provide: QueueRunner,
      useFactory: (container) => new QueueRunner(container, driver, config, registrations),
    },
  ];
}
