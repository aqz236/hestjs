import { addProcess, defineProcessor } from './metadata';

/**
 * 声明这个类消费哪个队列。
 *
 * ```ts
 * @Processor('mail')
 * class MailProcessor {
 *   @Process('welcome')
 *   async welcome(job: Job<{ to: string }>): Promise<void> {}
 * }
 * ```
 *
 * 一个队列只能有一个 processor —— 要横向扩容就多开几个进程，
 * 那是部署问题，不是代码问题。
 */
export function Processor(queue: string): ClassDecorator {
  return (target) => {
    defineProcessor(target, queue);
  };
}

/**
 * 声明这个方法处理哪条任务。
 *
 * 任务名由生产者决定，`Queue.enqueue('mail', 'welcome', payload)` 里的
 * `'welcome'` 就是它。
 */
export function Process(job: string): MethodDecorator {
  return (target, propertyKey) => {
    addProcess(target, job, propertyKey);
  };
}
