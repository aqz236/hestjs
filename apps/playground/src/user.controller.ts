import type { HestContext } from '@hestjs/core';
import { Context, Controller, Get, Injectable, Post } from '@hestjs/core';
import { Body } from '@hestjs/validation';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

// 定义用户类型
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  password?: string;
}

/**
 * 用户服务
 */
@Injectable()
export class UserService {
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  ];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  create(createUserDto: CreateUserDto): Omit<User, 'password'> {
    const newUser: User = {
      id: this.users.length + 1,
      ...createUserDto,
    };
    this.users.push(newUser);

    // 不返回密码
    const { password: _password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  update(id: number, updateUserDto: UpdateUserDto): User {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updateUserDto };
    return this.users[userIndex];
  }

  remove(id: number): User {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const deletedUser = this.users[userIndex];
    this.users.splice(userIndex, 1);
    return deletedUser;
  }
}

/**
 * 用户控制器 - 展示验证功能
 */
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  async getAllUsers() {
    return {
      success: true,
      data: this.userService.findAll(),
      message: 'Users retrieved successfully',
    };
  }

  @Get('/:id')
  async getUser(@Context() c: HestContext) {
    const id = parseInt(c.req.param('id'));
    const user = this.userService.findOne(id);

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
    const newUser = this.userService.create(createUserDto);
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
    const updatedUser = this.userService.update(id, updateUserDto);
    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    };
  }
}
