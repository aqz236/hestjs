import { HestError } from '@hestjs/core';

export class UnknownScheduledMethodError extends HestError {
  constructor(task: string, method: string) {
    super(
      `${task}.${method} 被定时装饰器标记，但实例上没有这个方法。\n` +
        `装饰器位置和类定义对不上了。`,
    );
  }
}

export class NoScheduledMethodsError extends HestError {
  constructor(tasks: readonly string[]) {
    super(
      `schedule() 收到了 ${tasks.length} 个任务类（${tasks.join(', ')}），` +
        `但它们身上一个 @Cron / @Interval / @Timeout 都没有。\n` +
        `列进来的类必须真的有被标记的方法，否则它什么都不做 —— 那是漏写装饰器，不是空任务。`,
    );
  }
}

export class DuplicateScheduleNameError extends HestError {
  constructor(name: string, first: string, second: string) {
    super(
      `定时任务名字 "${name}" 用了两次：${first} 和 ${second}。\n` +
        `名字用于手动触发与日志定位，必须唯一。用 @Cron(expr, { name: '...' }) 区分。`,
    );
  }
}

export class UnknownScheduleNameError extends HestError {
  constructor(name: string, known: readonly string[]) {
    super(
      `没有叫 "${name}" 的定时任务。\n` +
        `已注册的有：\n  ${known.join('\n  ')}`,
    );
  }
}

export class InvalidScheduleSpecError extends HestError {
  constructor(task: string, method: string, detail: string) {
    super(`${task}.${method} 的定时表达式不合法：${detail}`);
  }
}
