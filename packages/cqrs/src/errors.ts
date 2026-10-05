import { HestError } from '@hestjs/core';

function nameOf(target: unknown): string {
  return typeof target === 'function' && target.name !== '' ? target.name : String(target);
}

export class HandlerNotFoundError extends HestError {
  constructor(kind: string, message: unknown) {
    super(
      `没有注册处理 ${nameOf(message)} 的 ${kind} handler。\n` +
        `检查它是否写进了某个模块的 cqrs({ ${kind}s: [...] })。`,
    );
  }
}

export class HandlerAlreadyRegisteredError extends HestError {
  constructor(kind: string, message: unknown, existing: unknown, incoming: unknown) {
    super(
      `${nameOf(message)} 已经有 ${kind} handler（${nameOf(existing)}），又注册了一个 ${nameOf(incoming)}。\n` +
        `${kind} 只能有一个 handler；事件才允许多个。`,
    );
  }
}

export class MissingHandlerDecoratorError extends HestError {
  constructor(handler: unknown, expected: string) {
    super(
      `${nameOf(handler)} 没有 @${expected} 装饰器，却出现在 cqrs() 的 ${expected.toLowerCase()} 列表里。\n` +
        `装饰器决定它处理哪条消息，不能靠列表顺序推断。`,
    );
  }
}

export class WrongHandlerKindError extends HestError {
  constructor(handler: unknown, declared: string, usedAs: string) {
    super(
      `${nameOf(handler)} 被声明为 ${declared} handler，却出现在 ${usedAs} 列表里。\n` +
        `两处必须一致，否则总线会找错人。`,
    );
  }
}
