import { Injectable } from '@hestjs/core';
import { CommandHandler, EventBus, ICommandHandler } from '@hestjs/cqrs';
import { UpdateUserCommand } from '../commands';
import { User } from '../entities';
import { UserUpdatedEvent } from '../events';
import { UserRepository } from '../repositories';

@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler
  implements ICommandHandler<UpdateUserCommand, User>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const user = await this.userRepository.update(
      command.userId,
      command.userData,
    );

    if (!user) {
      throw new Error(`User with id ${command.userId} not found`);
    }

    // 发布用户更新事件
    await this.eventBus.publish(new UserUpdatedEvent(user));

    return user;
  }
}
