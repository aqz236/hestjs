import { Command } from '@hestjs/cqrs';
import { UpdateUserData, User } from '../entities';

export class UpdateUserCommand extends Command<User> {
  constructor(
    public readonly userId: string,
    public readonly userData: UpdateUserData,
  ) {
    super();
  }
}
