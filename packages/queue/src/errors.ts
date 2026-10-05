import { HestError } from '@hestjs/core';

export class UnknownJobHandlerError extends HestError {
  constructor(task: string, method: string) {
    super(`${task}.${method} 被 @Process 标记，但实例上没有这个方法。`);
  }
}

export class NoProcessorJobsError extends HestError {
  constructor(processors: readonly string[]) {
    super(
      `queue() 收到了 ${processors.length} 个 processor（${processors.join(', ')}），` +
        `但它们身上一个 @Process 都没有。\n` +
        `列进来的类必须真的有被标记的方法 —— 那是漏写装饰器，不是空 processor。`,
    );
  }
}

export class MissingProcessorDecoratorError extends HestError {
  constructor(handler: unknown) {
    super(
      `${String(handler)} 没有 @Processor() 装饰器，却出现在 queue() 的列表里。\n` +
        `@Processor('队列名') 决定它消费哪个队列，不能靠列表顺序推断。`,
    );
  }
}

export class DuplicateJobHandlerError extends HestError {
  constructor(queue: string, job: string, first: string, second: string) {
    super(
      `队列 "${queue}" 里的任务 "${job}" 有两个 handler：${first} 和 ${second}。\n` +
        `一个任务只能有一个 handler。`,
    );
  }
}

export class DuplicateProcessorError extends HestError {
  constructor(queue: string, first: string, second: string) {
    super(
      `队列 "${queue}" 被两个 processor 声明：${first} 和 ${second}。\n` +
        `一个队列只能有一个 processor —— 需要多个消费者就多开几个进程。`,
    );
  }
}

export class UnknownQueueError extends HestError {
  constructor(queue: string, known: readonly string[]) {
    super(
      `没有叫 "${queue}" 的队列。\n` +
        `已注册的有：\n  ${known.join('\n  ')}`,
    );
  }
}
