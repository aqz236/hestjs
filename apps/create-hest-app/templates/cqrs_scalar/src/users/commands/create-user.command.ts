import { Command } from '@hestjs/cqrs';
import { CreateUserData, User } from '../entities';

export class CreateUserCommand extends Command<User> {
  constructor(public readonly userData: CreateUserData) {
    super();
  }
}
