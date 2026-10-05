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
  /** 注册某个命令的处理器；由 CommandBus 在注册阶段调用 */
  setHandler(
    commandName: string,
    handler: (command: CommandBase) => Promise<any>
  ): void;
}

export type CommandHandlerType<CommandBase extends ICommand = ICommand> = new (
  ...args: any[]
) => ICommandHandler<CommandBase>;
