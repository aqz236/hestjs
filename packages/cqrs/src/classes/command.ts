import { RESULT_TYPE_SYMBOL } from "../constants";
import { ICommand } from "../interfaces";

/**
 * Utility type to extract the result type of a command.
 */
export type CommandResult<C extends Command<unknown>> =
  C extends Command<infer R> ? R : never;

/**
 * Base command class with typed result
 */
export class Command<T> implements ICommand {
  readonly [RESULT_TYPE_SYMBOL]?: T;
}
