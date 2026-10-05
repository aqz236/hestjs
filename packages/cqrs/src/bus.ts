import type { Constructor, Container } from '@hestjs/core';
import { HandlerAlreadyRegisteredError, HandlerNotFoundError } from './errors';
import type { Command, Event, Query, ResultOf } from './messages';

interface Executor<M> {
  execute(message: M): unknown;
}

interface EventListener<E> {
  handle(event: E): unknown;
}

/** 把「消息类 → handler 类」的映射收好，供三条总线共用。 */
export class HandlerRegistry {
  readonly #handlers = new Map<Constructor, Constructor[]>();

  constructor(
    private readonly kind: string,
    entries: ReadonlyMap<Constructor, readonly Constructor[]>,
  ) {
    for (const [message, handlers] of entries) {
      this.#handlers.set(message, [...handlers]);
    }
  }

  add(message: Constructor, handler: Constructor): void {
    const existing = this.#handlers.get(message) ?? [];
    if (existing.length > 0 && this.kind !== 'event') {
      throw new HandlerAlreadyRegisteredError(this.kind, message, existing[0], handler);
    }
    this.#handlers.set(message, [...existing, handler]);
  }

  handlersFor(message: Constructor, required = true): readonly Constructor[] {
    const handlers = this.#handlers.get(message);
    if (handlers === undefined || handlers.length === 0) {
      if (required) {
        throw new HandlerNotFoundError(this.kind, message);
      }
      return [];
    }
    return handlers;
  }

  get size(): number {
    return this.#handlers.size;
  }
}

type RegistrySource = ReadonlyMap<Constructor, readonly Constructor[]>;

export class CommandBus {
  readonly #registry: HandlerRegistry;

  constructor(
    entries: RegistrySource,
    private readonly container: Container,
  ) {
    this.#registry = new HandlerRegistry('command', entries);
  }

  async execute<M extends Command<unknown>>(message: M): Promise<ResultOf<M>> {
    const [handler] = this.#registry.handlersFor(message.constructor as Constructor);
    const instance = this.container.resolve(handler!) as Executor<M>;
    return (await instance.execute(message)) as ResultOf<M>;
  }
}

export class QueryBus {
  readonly #registry: HandlerRegistry;

  constructor(
    entries: RegistrySource,
    private readonly container: Container,
  ) {
    this.#registry = new HandlerRegistry('query', entries);
  }

  async execute<M extends Query<unknown>>(message: M): Promise<ResultOf<M>> {
    const [handler] = this.#registry.handlersFor(message.constructor as Constructor);
    const instance = this.container.resolve(handler!) as Executor<M>;
    return (await instance.execute(message)) as ResultOf<M>;
  }
}

export class EventBus {
  readonly #registry: HandlerRegistry;

  constructor(
    entries: RegistrySource,
    private readonly container: Container,
  ) {
    this.#registry = new HandlerRegistry('event', entries);
  }

  /** 顺序执行，保证 handler 之间有确定的先后关系。 */
  async publish<E extends Event>(event: E): Promise<void> {
    const handlers = this.#registry.handlersFor(event.constructor as Constructor, false);
    for (const handler of handlers) {
      const instance = this.container.resolve(handler) as EventListener<E>;
      await instance.handle(event);
    }
  }

  async publishAll(events: readonly Event[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
