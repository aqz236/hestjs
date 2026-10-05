import type { Constructor } from '@hestjs/core';
import { MissingHandlerDecoratorError, WrongHandlerKindError } from './errors';

export type HandlerKind = 'command' | 'query' | 'event';

export interface HandledMetadata {
  readonly kind: HandlerKind;
  readonly target: Constructor;
}

export const HANDLED_META = Symbol.for('hestjs:cqrs:handled');

interface HandlerCarrier {
  [HANDLED_META]?: HandledMetadata;
}

function defineHandled(handler: Constructor, metadata: HandledMetadata): void {
  (handler as HandlerCarrier)[HANDLED_META] = metadata;
}

export interface CommandHandler<TMessage> {
  execute(command: TMessage): unknown;
}

export interface QueryHandler<TMessage> {
  execute(query: TMessage): unknown;
}

export interface EventHandler<TMessage> {
  handle(event: TMessage): unknown;
}

export function CommandHandler(command: Constructor): ClassDecorator {
  return (target) => {
    defineHandled(target as unknown as Constructor, { kind: 'command', target: command });
  };
}

export function QueryHandler(query: Constructor): ClassDecorator {
  return (target) => {
    defineHandled(target as unknown as Constructor, { kind: 'query', target: query });
  };
}

export function EventHandler(event: Constructor): ClassDecorator {
  return (target) => {
    defineHandled(target as unknown as Constructor, { kind: 'event', target: event });
  };
}

/** 读出 handler 处理的是哪条消息，顺便校验它确实被声明过。 */
export function readHandled(handler: Constructor, expected: HandlerKind): Constructor {
  const metadata = (handler as HandlerCarrier)[HANDLED_META];
  if (metadata === undefined) {
    const decorator = { command: 'CommandHandler', query: 'QueryHandler', event: 'EventHandler' };
    throw new MissingHandlerDecoratorError(handler, decorator[expected]);
  }
  if (metadata.kind !== expected) {
    throw new WrongHandlerKindError(handler, metadata.kind, expected);
  }
  return metadata.target;
}
