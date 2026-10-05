import { Injectable, logger } from "@hestjs/core";
import "reflect-metadata";
import { Command } from "./classes";
import { COMMAND_HANDLER_METADATA } from "./constants";
import {
  CommandHandlerNotFoundException,
  InvalidCommandHandlerException,
} from "./exceptions";
import { DefaultCommandPubSub } from "./helpers";
import {
  CommandHandlerType,
  ICommand,
  ICommandBus,
  ICommandHandler,
  ICommandPublisher,
} from "./interfaces";
import { ObservableBus, resolveTypeName } from "./utils";

@Injectable()
export class CommandBus<CommandBase extends ICommand = ICommand>
  extends ObservableBus<CommandBase>
  implements ICommandBus<CommandBase>
{
  private handlers = new Map<string, (command: CommandBase) => Promise<any>>();
  private _publisher!: ICommandPublisher<CommandBase>;

  constructor() {
    super();
    this.useDefaultPublisher();
  }

  /**
   * Returns the publisher.
   */
  get publisher(): ICommandPublisher<CommandBase> {
    return this._publisher;
  }

  /**
   * Sets the publisher.
   */
  set publisher(_publisher: ICommandPublisher<CommandBase>) {
    this._publisher = _publisher;
  }

  /**
   * Executes a command.
   */
  async execute<R = void>(command: Command<R>): Promise<R>;
  async execute<T extends CommandBase, R = any>(command: T): Promise<R>;
  async execute<T extends CommandBase, R = any>(command: T): Promise<R> {
    const commandName = this.getCommandName(command);
    const handler = this.handlers.get(commandName);

    if (!handler) {
      logger.error(`Command handler for "${commandName}" not found`);
      throw new CommandHandlerNotFoundException(commandName);
    }

    this.publishToSubject(command);

    try {
      // 经 publisher 分发，允许使用者替换为自定义实现
      return await this.publisher.publish(command);
    } catch (error) {
      logger.error(`Error executing command "${commandName}":`, String(error));
      throw error;
    }
  }

  /**
   * Registers command handlers.
   */
  register(handlers: CommandHandlerType<CommandBase>[]): void {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  private registerHandler(handler: CommandHandlerType<CommandBase>): void {
    const target = handler;
    const commandType = Reflect.getMetadata(COMMAND_HANDLER_METADATA, target);

    if (!commandType) {
      throw new InvalidCommandHandlerException(
        `Missing @CommandHandler decorator on ${target.name}`
      );
    }

    const commandName = this.getCommandName(commandType);

    if (this.handlers.has(commandName)) {
      logger.warn(
        `Command handler for "${commandName}" already registered. Overwriting.`
      );
    }

    // Get handler instance from container
    // 通过 HestJS 容器解析，确保 handler 受模块作用域约束（见 issue #19）
    const handlerInstance = this.resolveType<ICommandHandler<CommandBase>>(target);

    const dispatch = (command: CommandBase) =>
      handlerInstance.execute(command);

    // 本地映射用于「是否已注册」的快速判断，实际分发交给 publisher
    this.handlers.set(commandName, dispatch);
    this.publisher.setHandler(commandName, dispatch);

    logger.info(`Registered command handler for "${commandName}"`);
  }

  private useDefaultPublisher(): void {
    this._publisher = new DefaultCommandPubSub<CommandBase>();
  }

  private getCommandName(value: any): string {
    // 入参可能是类（注册时）或实例（执行时），必须得到同一个名字
    return resolveTypeName(value);
  }
}
