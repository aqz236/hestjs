// Command interfaces
export interface ICommand {}

export interface ICommandHandler<
  TCommand extends ICommand = any,
  TResult = any,
> {
  execute(command: TCommand): Promise<TResult>;
}

export interface ICommandBus<CommandBase extends ICommand = ICommand> {
  execute<T extends CommandBase, R = any>(command: T): Promise<R>;
  register(handlers: CommandHandlerType<CommandBase>[]): void;
}

export interface ICommandPublisher<CommandBase extends ICommand = ICommand> {
  publish<T extends CommandBase>(command: T): Promise<any>;
}

export type CommandHandlerType<CommandBase extends ICommand = ICommand> = new (
  ...args: any[]
) => ICommandHandler<CommandBase>;
