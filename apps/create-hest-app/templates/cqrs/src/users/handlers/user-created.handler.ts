import { Injectable } from '@hestjs/core';
import { EventsHandler, IEventHandler } from '@hestjs/cqrs';
import { logger } from '@hestjs/logger';
import { UserCreatedEvent } from '../events';

@Injectable()
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    logger.info(`User created: ${event.user.name} (${event.user.email})`);

    // 这里可以执行其他业务逻辑，比如发送欢迎邮件等
    // await this.emailService.sendWelcomeEmail(event.user);
  }
}
