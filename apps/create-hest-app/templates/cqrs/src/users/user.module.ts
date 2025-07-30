import { Module } from '@hestjs/core';
import { CqrsModule } from '@hestjs/cqrs';
import { UserController } from './user.controller';
import { UserRepository } from './repositories';
import {
  CreateUserHandler,
  UpdateUserHandler,
  GetUserHandler,
  GetAllUsersHandler,
  UserCreatedHandler,
  UserUpdatedHandler,
} from './handlers';

@Module({
  imports: [CqrsModule],
  controllers: [UserController],
  providers: [
    UserRepository,
    // Command Handlers
    CreateUserHandler,
    UpdateUserHandler,
    // Query Handlers
    GetUserHandler,
    GetAllUsersHandler,
    // Event Handlers
    UserCreatedHandler,
    UserUpdatedHandler,
  ],
})
export class UserModule {}
