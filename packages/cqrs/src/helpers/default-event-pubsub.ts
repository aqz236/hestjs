import { IEvent, IEventPublisher } from "../interfaces";

export class DefaultEventPubSub<EventBase extends IEvent = IEvent>
  implements IEventPublisher<EventBase>
{
  private eventHandlers = new Map<
    string,
    ((event: EventBase) => Promise<void> | void)[]
  >();

  async publish<T extends EventBase>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.eventHandlers.get(eventName) || [];

    await Promise.all(
      handlers.map((handler) => Promise.resolve(handler(event)))
    );
  }

  async publishAll<T extends EventBase>(events: T[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }

  addHandler(
    eventName: string,
    handler: (event: EventBase) => Promise<void> | void
  ): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }
}
