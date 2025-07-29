import { Controller, Get, Post, Put, Context } from '@hestjs/core';
import type { HestContext } from '@hestjs/core';
import { CommandBus, QueryBus } from '@hestjs/cqrs';
import { CreateUserCommand, UpdateUserCommand } from './commands';
import { CreateUserData, UpdateUserData } from './entities';
import { GetAllUsersQuery, GetUserQuery } from './queries';

@Controller('/users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  async createUser(@Context() c: HestContext) {
    const userData = await c.req.json<CreateUserData>();

    // 基本验证（可以添加更复杂的验证逻辑）
    if (!userData.name || !userData.email) {
      return c.json(
        { success: false, error: 'Name and email are required' },
        400,
      );
    }

    const user = await this.commandBus.execute(new CreateUserCommand(userData));
    return c.json({ success: true, data: user }, 201);
  }

  @Get('/')
  async getAllUsers(@Context() c: HestContext) {
    const result = await this.queryBus.execute(new GetAllUsersQuery());
    return c.json({ success: true, data: result.users });
  }

  @Get('/:id')
  async getUserById(@Context() c: HestContext) {
    const id = c.req.param('id');
    const result = await this.queryBus.execute(new GetUserQuery(id));

    if (!result.user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, data: result.user });
  }

  @Put('/:id')
  async updateUser(@Context() c: HestContext) {
    const id = c.req.param('id');
    const userData = await c.req.json<UpdateUserData>();

    try {
      const user = await this.commandBus.execute(
        new UpdateUserCommand(id, userData),
      );
      return c.json({ success: true, data: user });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }
      throw error;
    }
  }
}
