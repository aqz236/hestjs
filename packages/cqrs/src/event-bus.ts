import { Injectable, logger } from "@hestjs/core";
import "reflect-metadata";
import { container } from "tsyringe";
import { EVENT_HANDLER_METADATA, SAGA_METADATA } from "./constants";
import {
  InvalidEventHandlerException,
  InvalidSagaException,
} from "./exceptions";
import { DefaultEventPubSub } from "./helpers";
import {
  EventHandlerType,
  IEvent,
  IEventBus,
  IEventHandler,
  IEventPublisher,
  ISaga,
  SagaType,
} from "./interfaces";
import { ObservableBus } from "./utils";

@Injectable()
export class EventBus<EventBase extends IEvent = IEvent>
  extends ObservableBus<EventBase>
  implements IEventBus<EventBase>
{
  private eventHandlers = new Map<string, IEventHandler<EventBase>[]>();
  private sagas = new Map<string, ISaga<EventBase>[]>();
  private _publisher!: IEventPublisher<EventBase>;

  constructor() {
    super();
    this.useDefaultPublisher();
  }

  /**
   * Returns the publisher.
   */
  get publisher(): IEventPublisher<EventBase> {
    return this._publisher;
  }

  /**
   * Sets the publisher.
   */
  set publisher(_publisher: IEventPublisher<EventBase>) {
    this._publisher = _publisher;
  }

  /**
   * Publishes a single event.
   */
  async publish<T extends EventBase>(event: T): Promise<void> {
    const eventName = this.getEventName(event);

    this.publishToSubject(event);

    try {
      // Handle event handlers
      const handlers = this.eventHandlers.get(eventName) || [];
      await Promise.all(
        handlers.map((handler) => Promise.resolve(handler.handle(event)))
      );

      // Handle sagas
      const eventSagas = this.sagas.get(eventName) || [];
      await Promise.all(
        eventSagas.map((saga) => {
          const methodName = `on${eventName}`;
          const sagaMethod = (saga as any)[methodName];

          if (typeof sagaMethod === "function") {
            return Promise.resolve(sagaMethod.call(saga, event));
          }
          return Promise.resolve();
        })
      );

      logger.debug(`Published event "${eventName}"`);
    } catch (error) {
      logger.error(`Error publishing event "${eventName}":`, String(error));
      throw error;
    }
  }

  /**
   * Publishes multiple events.
   */
  async publishAll<T extends EventBase>(events: T[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }

  /**
   * Registers event handlers.
   */
  register(handlers: EventHandlerType<EventBase>[]): void {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  /**
   * Registers sagas.
   */
  registerSagas(sagas: SagaType<EventBase>[]): void {
    sagas.forEach((saga) => this.registerSaga(saga));
  }

  private registerHandler(handler: EventHandlerType<EventBase>): void {
    const target = handler;
    const events = Reflect.getMetadata(EVENT_HANDLER_METADATA, target);

    if (!events || !Array.isArray(events)) {
      throw new InvalidEventHandlerException(
        `Missing @EventsHandler decorator on ${target.name}`
      );
    }

    // Get handler instance from container
    const handlerInstance = container.resolve(
      target
    ) as IEventHandler<EventBase>;

    events.forEach((eventType: any) => {
      const eventName = this.getEventName(eventType);

      if (!this.eventHandlers.has(eventName)) {
        this.eventHandlers.set(eventName, []);
      }

      this.eventHandlers.get(eventName)!.push(handlerInstance);
      logger.info(`Registered event handler for "${eventName}"`);
    });
  }

  private registerSaga(saga: SagaType<EventBase>): void {
    const target = saga;
    const isSaga = Reflect.getMetadata(SAGA_METADATA, target);

    if (!isSaga) {
      throw new InvalidSagaException(
        `Missing @Saga decorator on ${target.name}`
      );
    }

    // Get saga instance from container
    const sagaInstance = container.resolve(target) as ISaga<EventBase>;

    // Find all methods that start with 'on' and register them as event handlers
    const prototype = Object.getPrototypeOf(sagaInstance);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name.startsWith("on") && typeof prototype[name] === "function"
    );

    methodNames.forEach((methodName) => {
      // Extract event name from method name (e.g., 'onUserCreated' -> 'UserCreated')
      const eventName = methodName.substring(2);

      if (!this.sagas.has(eventName)) {
        this.sagas.set(eventName, []);
      }

      this.sagas.get(eventName)!.push(sagaInstance);
      logger.info(
        `Registered saga method "${methodName}" for event "${eventName}"`
      );
    });
  }

  private useDefaultPublisher(): void {
    this._publisher = new DefaultEventPubSub<EventBase>();
  }

  private getEventName(event: any): string {
    const { constructor } = Object.getPrototypeOf(event);
    return constructor.name;
  }
}
