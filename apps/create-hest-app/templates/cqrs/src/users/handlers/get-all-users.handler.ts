import { Injectable } from '@hestjs/core';
import { QueryHandler, IQueryHandler } from '@hestjs/cqrs';
import { GetAllUsersQuery, GetAllUsersResult } from '../queries';
import { UserRepository } from '../repositories';

@Injectable()
@QueryHandler(GetAllUsersQuery)
export class GetAllUsersHandler implements IQueryHandler<GetAllUsersQuery, GetAllUsersResult> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(_query: GetAllUsersQuery): Promise<GetAllUsersResult> {
    const users = await this.userRepository.findAll();
    return { users };
  }
}
