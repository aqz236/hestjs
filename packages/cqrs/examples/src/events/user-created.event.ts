import { Event } from "@hestjs/cqrs";

export class UserCreatedEvent extends Event {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly email: string
  ) {
    super(userId);
  }
}
