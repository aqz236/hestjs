import type { HestContext } from '@hestjs/core';
import { Context, Controller, Get, Post, Put } from '@hestjs/core';
import { CommandBus, QueryBus } from '@hestjs/cqrs';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@hestjs/scalar';
import { CreateUserCommand, UpdateUserCommand } from './commands';
import { CreateUserData, UpdateUserData } from './entities';
import { GetAllUsersQuery, GetUserQuery } from './queries';

@Controller('/users')
@ApiTags('Users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user using CQRS pattern with command bus',
  })
  @ApiBody(
    {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
              description: 'User email address',
            },
            age: {
              type: 'number',
              example: 25,
              description: 'User age (optional)',
              minimum: 0,
              maximum: 150,
            },
          },
        },
      },
    },
    {
      description: 'User creation data',
      required: true,
    },
  )
  @ApiResponse('201', {
    description: 'User created successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '1' },
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', example: 'john@example.com' },
                age: { type: 'number', example: 25 },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse('400', {
    description: 'Invalid input data',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'string',
              example: 'Name and email are required',
            },
          },
        },
      },
    },
  })
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
    // 直接返回数据，让拦截器处理响应格式
    // 注意：这里我们无法通过拦截器设置状态码为201，如果需要可以抛出特殊异常或使用其他方式
    return user;
  }

  @Get('/')
  async getAllUsers() {
    
    // 使用查询总线获取所有用户
    const result = await this.queryBus.execute(new GetAllUsersQuery());
    
    // 直接返回数据，让拦截器处理响应格式
    return result.users;
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their ID using CQRS pattern',
  })
  @ApiParam('id', {
    description: 'User unique identifier',
    schema: { type: 'string' },
    example: '1',
  })
  @ApiResponse('200', {
    description: 'User found successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '1' },
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', example: 'john@example.com' },
                age: { type: 'number', example: 25 },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse('404', {
    description: 'User not found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'User not found' },
          },
        },
      },
    },
  })
  async getUserById(@Context() c: HestContext) {
    const id = c.req.param('id');
    const result = await this.queryBus.execute(new GetUserQuery(id));

    if (!result.user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // 直接返回数据，让拦截器处理响应格式
    return result.user;
  }

  @Put('/:id')
  @ApiOperation({
    summary: 'Update user by ID',
    description: 'Updates an existing user using CQRS pattern with command bus',
  })
  @ApiParam('id', {
    description: 'User unique identifier',
    schema: { type: 'string' },
    example: '1',
  })
  @ApiBody(
    {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Jane Doe',
              description: 'User full name (optional)',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane@example.com',
              description: 'User email address (optional)',
            },
            age: {
              type: 'number',
              example: 30,
              description: 'User age (optional)',
              minimum: 0,
              maximum: 150,
            },
          },
        },
      },
    },
    {
      description: 'User update data (all fields are optional)',
      required: true,
    },
  )
  @ApiResponse('200', {
    description: 'User updated successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '1' },
                name: { type: 'string', example: 'Jane Doe' },
                email: { type: 'string', example: 'jane@example.com' },
                age: { type: 'number', example: 30 },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse('404', {
    description: 'User not found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'User not found' },
          },
        },
      },
    },
  })
  @ApiResponse('500', {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'string',
              example: 'An error occurred while updating the user',
            },
          },
        },
      },
    },
  })
  async updateUser(@Context() c: HestContext) {
    const id = c.req.param('id');
    const userData = await c.req.json<UpdateUserData>();

    try {
      const user = await this.commandBus.execute(
        new UpdateUserCommand(id, userData),
      );
      // 直接返回数据，让拦截器处理响应格式
      return user;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }
      throw error;
    }
  }
}
