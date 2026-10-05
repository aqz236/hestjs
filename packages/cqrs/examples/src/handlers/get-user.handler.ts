import { IQueryHandler, QueryHandler } from "@hestjs/cqrs";
import { GetUserQuery, GetUserResult } from "../queries/get-user.query";

@QueryHandler(GetUserQuery)
export class GetUserHandler
  implements IQueryHandler<GetUserQuery, GetUserResult>
{
  private users = new Map<string, { name: string; email: string }>();

  async execute(query: GetUserQuery): Promise<GetUserResult> {
    console.log(`Getting user: ${query.userId}`);

    const user = this.users.get(query.userId);
    if (!user) {
      throw new Error(`User not found: ${query.userId}`);
    }

    return new GetUserResult(query.userId, user.name, user.email);
  }

  // 辅助方法，用于演示
  addUser(id: string, name: string, email: string): void {
    this.users.set(id, { name, email });
  }
}
