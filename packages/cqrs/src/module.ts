import type { Constructor, Provider, ProviderEntry } from '@hestjs/core';
import { CommandBus, EventBus, QueryBus } from './bus';
import { readHandled, type HandlerKind } from './handlers';

export interface CqrsConfig {
  readonly commands?: readonly Constructor[];
  readonly queries?: readonly Constructor[];
  readonly events?: readonly Constructor[];
}

type Registry = Map<Constructor, Constructor[]>;

function collect(kind: HandlerKind, handlers: readonly Constructor[], into: Registry): void {
  for (const handler of handlers) {
    const message = readHandled(handler, kind);
    into.set(message, [...(into.get(message) ?? []), handler]);
  }
}

/**
 * 一次性注册 handler 与三条总线。
 *
 * ```ts
 * @Module({
 *   providers: [...cqrs({ commands: [CreateUserHandler], queries: [GetUserHandler] })],
 * })
 * class UserModule {}
 * ```
 *
 * handler 必须显式列出来：cqrs 不扫目录、不建全局注册表。
 * 列表里写错一个类，装饰器对不上会立刻报错。
 */
export function cqrs(config: CqrsConfig): Provider[] {
  const commands: Registry = new Map();
  const queries: Registry = new Map();
  const events: Registry = new Map();

  collect('command', config.commands ?? [], commands);
  collect('query', config.queries ?? [], queries);
  collect('event', config.events ?? [], events);

  const entries: ProviderEntry[] = [
    ...(config.commands ?? []),
    ...(config.queries ?? []),
    ...(config.events ?? []),
  ];

  const providers = entries.map((entry): Provider =>
    typeof entry === 'function' ? { provide: entry, useClass: entry } : entry,
  );

  return [
    ...providers,
    { provide: CommandBus, useFactory: (container) => new CommandBus(commands, container) },
    { provide: QueryBus, useFactory: (container) => new QueryBus(queries, container) },
    { provide: EventBus, useFactory: (container) => new EventBus(events, container) },
  ];
}
