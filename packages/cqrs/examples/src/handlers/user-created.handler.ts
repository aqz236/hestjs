import { EventsHandler, IEventHandler } from "@hestjs/cqrs";
import { UserCreatedEvent } from "../events/user-created.event";

@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    console.log(`Event: User created - ${event.name} (${event.email})`);

    // 模拟发送欢迎邮件
    console.log(`Sending welcome email to ${event.email}`);

    // 模拟更新统计信息
    console.log("Updating user statistics...");
  }
}
