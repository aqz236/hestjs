// Event interfaces
export interface IEvent {
  readonly aggregateId?: string;
  readonly version?: number;
}

export interface IEventHandler<TEvent extends IEvent = any> {
  handle(event: TEvent): Promise<void> | void;
}

export interface IEventBus<EventBase extends IEvent = IEvent> {
  publish<T extends EventBase>(event: T): Promise<void>;
  publishAll<T extends EventBase>(events: T[]): Promise<void>;
  register(handlers: EventHandlerType<EventBase>[]): void;
  registerSagas(sagas: SagaType<EventBase>[]): void;
}

export interface IEventPublisher<EventBase extends IEvent = IEvent> {
  publish<T extends EventBase>(event: T): Promise<void>;
  publishAll<T extends EventBase>(events: T[]): Promise<void>;
  /** 注册某个事件的处理器；由 EventBus 在注册阶段调用 */
  addHandler(
    eventName: string,
    handler: (event: EventBase) => Promise<void> | void
  ): void;
}

export type EventHandlerType<EventBase extends IEvent = IEvent> = new (
  ...args: any[]
) => IEventHandler<EventBase>;

export type SagaType<EventBase extends IEvent = IEvent> = new (
  ...args: any[]
) => ISaga<EventBase>;

export interface ISaga<EventBase extends IEvent = IEvent> {
  [key: string]: (event: EventBase) => Promise<void> | void;
}
