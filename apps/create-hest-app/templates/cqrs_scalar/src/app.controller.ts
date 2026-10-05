import { Controller, Get } from '@hestjs/core';
import { ApiOperation, ApiResponse, ApiTags } from '@hestjs/scalar';
import { AppService } from './app.service';

@Controller('/')
@ApiTags('Application')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get application info',
    description: 'Returns application information and available endpoints',
    tags: ['Health Check', 'Application'],
  })
  @ApiResponse('200', {
    description: 'Application information',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Hello World from HestJS CQRS!',
            },
            description: {
              type: 'string',
              example:
                'HestJS CQRS Demo - A demonstration of CQRS pattern using HestJS framework',
            },
            endpoints: {
              type: 'object',
              properties: {
                users: {
                  type: 'object',
                  properties: {
                    getAll: { type: 'string', example: 'GET /users' },
                    getById: { type: 'string', example: 'GET /users/:id' },
                    create: { type: 'string', example: 'POST /users' },
                    update: { type: 'string', example: 'PUT /users/:id' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  getHello() {
    return {
      message: this.appService.getHello(),
      description:
        'HestJS CQRS Demo - A demonstration of CQRS pattern using HestJS framework',
      endpoints: {
        users: {
          getAll: 'GET /users',
          getById: 'GET /users/:id',
          create: 'POST /users',
          update: 'PUT /users/:id',
        },
      },
    };
  }

  @Get('/error')
  @ApiOperation({
    summary: 'Test error endpoint',
    description: 'Throws an error for testing exception handling and filters',
  })
  @ApiResponse('500', {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'This is a test error for exception handling',
            },
          },
        },
      },
    },
  })
  throwError() {
    throw new Error('This is a test error for exception handling');
  }
}
