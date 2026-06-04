import { IQuery, IQueryPublisher } from "../interfaces";

export class DefaultQueryPubSub<QueryBase extends IQuery = IQuery>
  implements IQueryPublisher<QueryBase>
{
  private queryHandlers = new Map<string, (query: QueryBase) => Promise<any>>();

  async publish<T extends QueryBase>(query: T): Promise<any> {
    const queryName = query.constructor.name;
    const handler = this.queryHandlers.get(queryName);

    if (!handler) {
      throw new Error(`No handler registered for query "${queryName}"`);
    }

    return await handler(query);
  }

  setHandler(
    queryName: string,
    handler: (query: QueryBase) => Promise<any>
  ): void {
    this.queryHandlers.set(queryName, handler);
  }
}
