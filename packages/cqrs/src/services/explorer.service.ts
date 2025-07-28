import { Injectable, logger } from "@hestjs/core";
import "reflect-metadata";
import {
  COMMAND_HANDLER_METADATA,
  EVENT_HANDLER_METADATA,
  QUERY_HANDLER_METADATA,
  SAGA_METADATA,
} from "../constants";
import {
  CommandHandlerType,
  EventHandlerType,
  ICommand,
  IEvent,
  IQuery,
  QueryHandlerType,
  SagaType,
} from "../interfaces";

export interface ExplorerResult<EventBase extends IEvent = IEvent> {
  commands: CommandHandlerType<ICommand>[];
  queries: QueryHandlerType<IQuery>[];
  events: EventHandlerType<EventBase>[];
  sagas: SagaType<EventBase>[];
}

@Injectable()
export class ExplorerService<EventBase extends IEvent = IEvent> {
  private registeredHandlers = new Set<Function>();

  /**
   * Explores and discovers all CQRS handlers and sagas from the TSyringe container.
   */
  explore(): ExplorerResult<EventBase> {
    const commands: CommandHandlerType<ICommand>[] = [];
    const queries: QueryHandlerType<IQuery>[] = [];
    const events: EventHandlerType<EventBase>[] = [];
    const sagas: SagaType<EventBase>[] = [];

    // In a real implementation, you would iterate through registered providers
    // For now, we'll provide a way to manually register handlers

    logger.info(
      `CQRS Explorer: Discovered handlers - commands: ${commands.length}, queries: ${queries.length}, events: ${events.length}, sagas: ${sagas.length}`
    );

    return {
      commands,
      queries,
      events,
      sagas,
    };
  }

  /**
   * Manually register a handler class for discovery.
   * This is a workaround since TSyringe doesn't provide direct access to all registered classes.
   */
  registerHandler(handlerClass: Function): void {
    if (this.registeredHandlers.has(handlerClass)) {
      return;
    }

    this.registeredHandlers.add(handlerClass);

    // Check if it's a command handler
    if (Reflect.hasMetadata(COMMAND_HANDLER_METADATA, handlerClass)) {
      logger.debug(`Discovered command handler: ${handlerClass.name}`);
    }

    // Check if it's a query handler
    if (Reflect.hasMetadata(QUERY_HANDLER_METADATA, handlerClass)) {
      logger.debug(`Discovered query handler: ${handlerClass.name}`);
    }

    // Check if it's an event handler
    if (Reflect.hasMetadata(EVENT_HANDLER_METADATA, handlerClass)) {
      logger.debug(`Discovered event handler: ${handlerClass.name}`);
    }

    // Check if it's a saga
    if (Reflect.hasMetadata(SAGA_METADATA, handlerClass)) {
      logger.debug(`Discovered saga: ${handlerClass.name}`);
    }
  }

  /**
   * Get all registered handlers categorized by type.
   */
  getRegisteredHandlers(): ExplorerResult<EventBase> {
    const commands: CommandHandlerType<ICommand>[] = [];
    const queries: QueryHandlerType<IQuery>[] = [];
    const events: EventHandlerType<EventBase>[] = [];
    const sagas: SagaType<EventBase>[] = [];

    for (const handlerClass of this.registeredHandlers) {
      if (Reflect.hasMetadata(COMMAND_HANDLER_METADATA, handlerClass)) {
        commands.push(handlerClass as CommandHandlerType<ICommand>);
      }

      if (Reflect.hasMetadata(QUERY_HANDLER_METADATA, handlerClass)) {
        queries.push(handlerClass as QueryHandlerType<IQuery>);
      }

      if (Reflect.hasMetadata(EVENT_HANDLER_METADATA, handlerClass)) {
        events.push(handlerClass as EventHandlerType<EventBase>);
      }

      if (Reflect.hasMetadata(SAGA_METADATA, handlerClass)) {
        sagas.push(handlerClass as SagaType<EventBase>);
      }
    }

    return {
      commands,
      queries,
      events,
      sagas,
    };
  }
}
