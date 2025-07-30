import { RESULT_TYPE_SYMBOL } from "../constants";
import { IQuery, IQueryResult } from "../interfaces";

/**
 * Utility type to extract the result type of a query.
 */
export type QueryResult<Q extends Query<IQueryResult>> =
  Q extends Query<infer R> ? R : never;

/**
 * Base query class with typed result
 */
export class Query<T extends IQueryResult> implements IQuery {
  readonly [RESULT_TYPE_SYMBOL]?: T;
}
