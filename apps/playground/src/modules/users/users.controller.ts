import type { HestContext } from '@hestjs/core';
import { Context, Controller, Get, Post } from '@hestjs/core';
import { Body } from '@hestjs/validation';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

/**
 * 用户控制器 - 展示验证功能
 */
@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  async getAllUsers() {
    return {
      success: true,
      data: this.usersService.findAll(),
      message: 'Users retrieved successfully',
    };
  }

  @Get('/:id')
  async getUser(@Context() c: HestContext) {
    const id = parseInt(c.req.param('id'));
    const user = this.usersService.findOne(id);

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'User not found',
        },
        404,
      );
    }

    return {
      success: true,
      data: user,
      message: 'User retrieved successfully',
    };
  }

  @Post('/')
  async createUser(@Body(CreateUserDto) createUserDto: CreateUserDto) {
    const newUser = this.usersService.create(createUserDto);
    return {
      success: true,
      data: newUser,
      message: 'User created successfully',
    };
  }

  @Post('/:id')
  async updateUser(
    @Context() c: HestContext,
    @Body(UpdateUserDto) updateUserDto: UpdateUserDto,
  ) {
    const id = parseInt(c.req.param('id'));
    const updatedUser = this.usersService.update(id, updateUserDto);
    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    };
  }
}
