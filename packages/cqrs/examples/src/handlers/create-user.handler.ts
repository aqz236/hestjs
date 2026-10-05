import { CommandHandler, ICommandHandler } from "@hestjs/cqrs";
import { CreateUserCommand } from "../commands/create-user.command";

@CommandHandler(CreateUserCommand)
export class CreateUserHandler
  implements ICommandHandler<CreateUserCommand, string>
{
  async execute(command: CreateUserCommand): Promise<string> {
    console.log(`Creating user: ${command.name} (${command.email})`);

    // 模拟数据库操作
    const userId = `user_${Date.now()}`;

    console.log(`User created with ID: ${userId}`);
    return userId;
  }
}
