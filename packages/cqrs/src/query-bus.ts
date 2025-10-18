import { Injectable, logger } from "@hestjs/core";
import "reflect-metadata";
import { container } from "tsyringe";
import { Query } from "./classes";
import { QUERY_HANDLER_METADATA } from "./constants";
import {
  InvalidQueryHandlerException,
  QueryHandlerNotFoundException,
} from "./exceptions";
import { DefaultQueryPubSub } from "./helpers";
import {
  IQuery,
  IQueryBus,
  IQueryHandler,
  IQueryPublisher,
  IQueryResult,
  QueryHandlerType,
} from "./interfaces";
import { ObservableBus } from "./utils";

@Injectable()
export class QueryBus<QueryBase extends IQuery = IQuery>
  extends ObservableBus<QueryBase>
  implements IQueryBus<QueryBase>
{
  private handlers = new Map<string, (query: QueryBase) => Promise<any>>();
  private _publisher!: IQueryPublisher<QueryBase>;

  constructor() {
    super();
    this.useDefaultPublisher();
  }

  /**
   * Returns the publisher.
   */
  get publisher(): IQueryPublisher<QueryBase> {
    return this._publisher;
  }

  /**
   * Sets the publisher.
   */
  set publisher(_publisher: IQueryPublisher<QueryBase>) {
    this._publisher = _publisher;
  }

  /**
   * Executes a query.
   */
  async execute<R extends IQueryResult = any>(query: Query<R>): Promise<R>;
  async execute<T extends QueryBase, R extends IQueryResult = any>(
    query: T
  ): Promise<R>;
  async execute<T extends QueryBase, R extends IQueryResult = any>(
    query: T
  ): Promise<R> {
    const queryName = this.getQueryName(query);
    const handler = this.handlers.get(queryName);

    if (!handler) {
      logger.error(`Query handler for "${queryName}" not found`);
      throw new QueryHandlerNotFoundException(queryName);
    }

    this.publishToSubject(query);

    try {
      return await handler(query);
    } catch (error) {
      logger.error(`Error executing query "${queryName}":`, String(error));
      throw error;
    }
  }

  /**
   * Registers query handlers.
   */
  register(handlers: QueryHandlerType<QueryBase>[]): void {
    handlers.forEach((handler) => this.registerHandler(handler));
  }

  private registerHandler(handler: QueryHandlerType<QueryBase>): void {
    const target = handler;
    const queryType = Reflect.getMetadata(QUERY_HANDLER_METADATA, target);

    if (!queryType) {
      throw new InvalidQueryHandlerException(
        `Missing @QueryHandler decorator on ${target.name}`
      );
    }

    const queryName = this.getQueryName(queryType);

    if (this.handlers.has(queryName)) {
      logger.warn(
        `Query handler for "${queryName}" already registered. Overwriting.`
      );
    }

    // Get handler instance from container
    const handlerInstance = container.resolve(
      target
    ) as IQueryHandler<QueryBase>;

    this.handlers.set(queryName, (query: QueryBase) =>
      handlerInstance.execute(query)
    );

    logger.info(`Registered query handler for "${queryName}"`);
  }

  private useDefaultPublisher(): void {
    this._publisher = new DefaultQueryPubSub<QueryBase>();
  }

  private getQueryName(query: any): string {
    const { constructor } = Object.getPrototypeOf(query);
    return constructor.name;
  }
}
