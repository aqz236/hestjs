import { IQueryResult, Query } from "@hestjs/cqrs";

export class GetUserQuery extends Query<GetUserResult> {
  constructor(public readonly userId: string) {
    super();
  }
}

export class GetUserResult implements IQueryResult {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string
  ) {}
}
