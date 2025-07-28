import { ICommand, ICommandPublisher } from "../interfaces";

export class DefaultCommandPubSub<CommandBase extends ICommand = ICommand>
  implements ICommandPublisher<CommandBase>
{
  private commandHandlers = new Map<
    string,
    (command: CommandBase) => Promise<any>
  >();

  async publish<T extends CommandBase>(command: T): Promise<any> {
    const commandName = command.constructor.name;
    const handler = this.commandHandlers.get(commandName);

    if (!handler) {
      throw new Error(`No handler registered for command "${commandName}"`);
    }

    return await handler(command);
  }

  setHandler(
    commandName: string,
    handler: (command: CommandBase) => Promise<any>
  ): void {
    this.commandHandlers.set(commandName, handler);
  }
}
