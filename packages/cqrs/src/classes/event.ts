import { IEvent } from "../interfaces";

/**
 * Base event class
 */
export class Event implements IEvent {
  public readonly aggregateId?: string;
  public readonly version?: number;

  constructor(aggregateId?: string, version?: number) {
    this.aggregateId = aggregateId;
    this.version = version;
  }
}
