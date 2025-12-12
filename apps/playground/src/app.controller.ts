import { Controller, Get, NotFoundException, Param, Post } from '@hestjs/core';
import { Body } from '@hestjs/validation';
import { AppService } from './app.service';
import { CreateUserDto } from './dto/user.dto';

@Controller('/api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello() {
    return { message: this.appService.getHello() };
  }

  @Get('/users')
  getUsers() {
    return this.appService.getUsers();
  }

  @Get('/users/:id')
  getUser(@Param('id') id: string) {
    const user = this.appService.getUser(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  @Post('/users')
  createUser(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    return this.appService.createUser(createUserDto);
  }

  @Get('/error')
  throwError() {
    throw new Error('This is a test error');
  }
}
