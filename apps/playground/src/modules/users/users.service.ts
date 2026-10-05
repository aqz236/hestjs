import { Injectable } from '@hestjs/core';
import type { User } from './entities/user.entity';
import type { CreateUserDto, UpdateUserDto } from './dto/user.dto';

/**
 * 用户服务
 */
@Injectable()
export class UsersService {
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
