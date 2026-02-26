import { Injectable } from '@hestjs/core';
import { EventsHandler, IEventHandler } from '@hestjs/cqrs';
import { logger } from '@hestjs/logger';
import { UserUpdatedEvent } from '../events';

@Injectable()
@EventsHandler(UserUpdatedEvent)
export class UserUpdatedHandler implements IEventHandler<UserUpdatedEvent> {
  async handle(event: UserUpdatedEvent): Promise<void> {
    logger.info(`User updated: ${event.user.name} (${event.user.email})`);

    // 这里可以执行其他业务逻辑，比如发送通知等
    // await this.notificationService.sendUpdateNotification(event.user);
  }
}
