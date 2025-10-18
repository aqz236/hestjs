import { Injectable } from "@hestjs/core";
import { randomUUID } from "crypto";
import "reflect-metadata";
import { COMMAND_HANDLER_METADATA, COMMAND_METADATA } from "../constants";
import { ICommand } from "../interfaces";

/**
 * Decorator that marks a class as a command handler.
 * A command handler handles commands (actions) executed by your application code.
 *
 * The decorated class must implement the `ICommandHandler` interface.
 *
 * @param command command *type* to be handled by this handler.
 */
export const CommandHandler = (
  command: ICommand | (new (...args: any[]) => ICommand)
): ClassDecorator => {
  return (target: Function) => {
    if (!Reflect.hasOwnMetadata(COMMAND_METADATA, command)) {
      Reflect.defineMetadata(COMMAND_METADATA, { id: randomUUID() }, command);
    }
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, command, target);

    // 自动添加 Injectable 装饰器
    Injectable()(target);
  };
};
