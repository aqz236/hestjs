import { Injectable } from '@hestjs/core';
import { QueryHandler, IQueryHandler } from '@hestjs/cqrs';
import { GetUserQuery, GetUserResult } from '../queries';
import { UserRepository } from '../repositories';

@Injectable()
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, GetUserResult> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserQuery): Promise<GetUserResult> {
    const user = await this.userRepository.findById(query.userId);
    return { user };
  }
}
