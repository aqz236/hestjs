import { Controller, Get, NotFoundException, Param, Post } from '@hestjs/core';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@hestjs/scalar';
import { Body } from '@hestjs/validation';
import { AppService } from './app.service';
import { CreateUserDto } from './modules/users/dto/user.dto';

@Controller('/api')
@ApiTags('Application')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get hello message',
    description: 'Returns a hello world message',
    tags: ['Health Check', 'Application'],
  })
  @ApiResponse('200', {
    description: 'Successful response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Hello World!' },
          },
        },
      },
    },
  })
  getHello() {
    return { message: this.appService.getHello() };
  }

  @Get('/users')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Returns a list of all users',
  })
  @ApiResponse('200', {
    description: 'List of users',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getUsers() {
    return this.appService.getUsers();
  }

  @Get('/users/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns a single user by their ID',
  })
  @ApiParam('id', {
    description: 'User ID',
    schema: { type: 'string' },
    example: '123',
  })
  @ApiResponse('200', {
    description: 'User found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
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
            message: { type: 'string', example: 'User with id 123 not found' },
          },
        },
      },
    },
  })
  getUser(@Param('id') id: string) {
    const user = this.appService.getUser(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  @Post('/users')
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user with the provided data',
  })
  @ApiBody(
    {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
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
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
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
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  createUser(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    return this.appService.createUser(createUserDto);
  }

  @Get('/error')
  @ApiOperation({
    summary: 'Test error endpoint',
    description: 'Throws an error for testing error handling',
  })
  @ApiResponse('500', {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'This is a test error' },
          },
        },
      },
    },
  })
  throwError() {
    throw new Error('This is a test error');
  }
}
