import { Injectable } from '@hestjs/core';
import { CommandHandler, EventBus, ICommandHandler } from '@hestjs/cqrs';
import { CreateUserCommand } from '../commands';
import { User } from '../entities';
import { UserCreatedEvent } from '../events';
import { UserRepository } from '../repositories';

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler
  implements ICommandHandler<CreateUserCommand, User>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const user = await this.userRepository.create(command.userData);

    // 发布用户创建事件
    await this.eventBus.publish(new UserCreatedEvent(user));

    return user;
  }
}
