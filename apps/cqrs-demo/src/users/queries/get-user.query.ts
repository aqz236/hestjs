import { Query, IQueryResult } from '@hestjs/cqrs';
import { User } from '../entities';

export interface GetUserResult extends IQueryResult {
  user: User | null;
}

export class GetUserQuery extends Query<GetUserResult> {
  constructor(public readonly userId: string) {
    super();
  }
}
