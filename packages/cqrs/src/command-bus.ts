import { Injectable, logger } from "@hestjs/core";
import "reflect-metadata";
import { container } from "tsyringe";
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
import { ObservableBus } from "./utils";

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
      return await handler(command);
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
    const handlerInstance = container.resolve(
      target
    ) as ICommandHandler<CommandBase>;

    this.handlers.set(commandName, (command: CommandBase) =>
      handlerInstance.execute(command)
    );

    logger.info(`Registered command handler for "${commandName}"`);
  }

  private useDefaultPublisher(): void {
    this._publisher = new DefaultCommandPubSub<CommandBase>();
  }

  private getCommandName(command: any): string {
    const { constructor } = Object.getPrototypeOf(command);
    return constructor.name;
  }
}
