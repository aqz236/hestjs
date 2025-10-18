import { Injectable, logger } from "@hestjs/core";
import { container } from "tsyringe";
import { CommandBus } from "./command-bus";
import { CQRS_MODULE_OPTIONS } from "./constants";
import { EventBus } from "./event-bus";
import {
  CqrsModuleAsyncOptions,
  CqrsModuleOptions,
  CqrsModuleOptionsFactory,
  IEvent,
} from "./interfaces";
import { QueryBus } from "./query-bus";
import { ExplorerService } from "./services";

/**
 * CQRS Module for HestJS
 * Provides Command Query Responsibility Segregation capabilities
 */
@Injectable()
export class CqrsModule<EventBase extends IEvent = IEvent> {
  private static isInitialized = false;

  constructor(
    private readonly explorerService: ExplorerService<EventBase>,
    private readonly eventBus: EventBus<EventBase>,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  /**
   * Configure CQRS module with options
   */
  static forRoot(options?: CqrsModuleOptions): typeof CqrsModule {
    if (CqrsModule.isInitialized) {
      logger.warn("CqrsModule is already initialized");
      return CqrsModule;
    }

    // Register options
    if (options) {
      container.registerInstance(CQRS_MODULE_OPTIONS, options);
    }

    // Register core services
    container.registerSingleton(CommandBus);
    container.registerSingleton(QueryBus);
    container.registerSingleton(EventBus);
    container.registerSingleton(ExplorerService);

    CqrsModule.isInitialized = true;
    logger.info("CqrsModule initialized");

    return CqrsModule;
  }

  /**
   * Configure CQRS module with async options
   */
  static forRootAsync(options: CqrsModuleAsyncOptions): typeof CqrsModule {
    if (CqrsModule.isInitialized) {
      logger.warn("CqrsModule is already initialized");
      return CqrsModule;
    }

    // Handle async configuration
    if (options.useFactory) {
      const factory = options.useFactory;
      const deps = options.inject || [];

      container.register(CQRS_MODULE_OPTIONS, {
        useFactory: () => factory(...deps.map((dep) => container.resolve(dep))),
      });
    } else if (options.useClass) {
      container.registerSingleton(options.useClass);
      container.register(CQRS_MODULE_OPTIONS, {
        useFactory: () => {
          const factory = container.resolve(
            options.useClass!
          ) as CqrsModuleOptionsFactory;
          return factory.createCqrsOptions();
        },
      });
    } else if (options.useValue) {
      container.registerInstance(CQRS_MODULE_OPTIONS, options.useValue);
    }

    // Register core services
    container.registerSingleton(CommandBus);
    container.registerSingleton(QueryBus);
    container.registerSingleton(EventBus);
    container.registerSingleton(ExplorerService);

    CqrsModule.isInitialized = true;
    logger.info("CqrsModule initialized with async options");

    return CqrsModule;
  }

  /**
   * Initialize the CQRS module and register all handlers
   */
  async onApplicationBootstrap(): Promise<void> {
    const { events, queries, sagas, commands } =
      this.explorerService.getRegisteredHandlers();

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

  /**
   * Get a singleton instance of the CQRS module
   */
  static getInstance<
    EventBase extends IEvent = IEvent,
  >(): CqrsModule<EventBase> {
    if (!CqrsModule.isInitialized) {
      throw new Error(
        "CqrsModule must be initialized before getting instance. Call forRoot() or forRootAsync() first."
      );
    }

    // Manually create the instance to avoid circular dependency
    const explorerService = container.resolve(ExplorerService);
    const eventBus = container.resolve(EventBus);
    const commandBus = container.resolve(CommandBus);
    const queryBus = container.resolve(QueryBus);

    return new CqrsModule(
      explorerService,
      eventBus,
      commandBus,
      queryBus
    ) as unknown as CqrsModule<EventBase>;
  }
}
