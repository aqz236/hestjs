// Query interfaces
export interface IQuery {}

export interface IQueryResult {}

export interface IQueryHandler<
  TQuery extends IQuery = any,
  TResult extends IQueryResult = any,
> {
  execute(query: TQuery): Promise<TResult>;
}

export interface IQueryBus<QueryBase extends IQuery = IQuery> {
  execute<T extends QueryBase, R extends IQueryResult = any>(
    query: T
  ): Promise<R>;
  register(handlers: QueryHandlerType<QueryBase>[]): void;
}

export interface IQueryPublisher<QueryBase extends IQuery = IQuery> {
  publish<T extends QueryBase>(query: T): Promise<any>;
  /** 注册某个查询的处理器；由 QueryBus 在注册阶段调用 */
  setHandler(
    queryName: string,
    handler: (query: QueryBase) => Promise<any>
  ): void;
}

export type QueryHandlerType<
  QueryBase extends IQuery = IQuery,
  QueryResultBase extends IQueryResult = IQueryResult,
> = new (...args: any[]) => IQueryHandler<QueryBase, QueryResultBase>;
