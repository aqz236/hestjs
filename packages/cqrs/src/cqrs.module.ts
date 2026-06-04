import { Injectable, Module, logger } from "@hestjs/core";
import { CommandBus } from "./command-bus";
import { EventBus } from "./event-bus";
import { IEvent } from "./interfaces";
import { QueryBus } from "./query-bus";
import { ExplorerService } from "./services";

/**
 * CQRS Module for HestJS
 * Provides Command Query Responsibility Segregation capabilities
 */
@Module({
  providers: [CommandBus, QueryBus, EventBus, ExplorerService],
  exports: [CommandBus, QueryBus, EventBus, ExplorerService],
})
@Injectable()
export class CqrsModule<EventBase extends IEvent = IEvent> {
  constructor(
    private readonly explorerService: ExplorerService<EventBase>,
    private readonly eventBus: EventBus<EventBase>,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  /**
   * Configure CQRS module for root
   */
  static forRoot(): typeof CqrsModule {
    logger.info("CqrsModule configured for root");
    return CqrsModule;
  }

  /**
   * Initialize the CQRS module and register all handlers
   * This will be called automatically by the application hooks system
   */
  async onApplicationBootstrap(): Promise<void> {
    const { events, queries, sagas, commands } =
      this.explorerService.explore();

    this.eventBus.register(events);
    this.commandBus.register(commands);
    this.queryBus.register(queries);
    this.eventBus.registerSagas(sagas);

    logger.info("CQRS module bootstrap completed");
  }

  /**
   * Get the command bus instance
   */
  getCommandBus(): CommandBus {
    return this.commandBus;
  }

  /**
   * Get the query bus instance
   */
  getQueryBus(): QueryBus {
    return this.queryBus;
  }

  /**
   * Get the event bus instance
   */
  getEventBus(): EventBus<EventBase> {
    return this.eventBus;
  }

  /**
   * Register a handler manually
   */
  registerHandler(handlerClass: Function): void {
    this.explorerService.registerHandler(handlerClass);
  }
}
