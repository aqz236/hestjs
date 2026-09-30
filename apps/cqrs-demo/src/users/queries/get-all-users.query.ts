import { Query, IQueryResult } from '@hestjs/cqrs';
import { User } from '../entities';

export interface GetAllUsersResult extends IQueryResult {
  users: User[];
}

export class GetAllUsersQuery extends Query<GetAllUsersResult> {}
