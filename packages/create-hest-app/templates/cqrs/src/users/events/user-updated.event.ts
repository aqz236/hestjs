import { Event } from '@hestjs/cqrs';
import { User } from '../entities';

export class UserUpdatedEvent extends Event {
  constructor(public readonly user: User) {
    super();
  }
}
