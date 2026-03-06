import { Injectable } from '@hestjs/core';
import { User, CreateUserData, UpdateUserData } from '../entities';

@Injectable()
export class UserRepository {
  private users: Map<string, User> = new Map();
  private nextId = 4; // 从4开始，因为我们预填充了3个用户

  constructor() {
    // 初始化一些 mock 数据
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        age: 28,
        createdAt: new Date('2024-01-15T08:30:00Z'),
        updatedAt: new Date('2024-01-15T08:30:00Z'),
      },
      {
        id: '2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        age: 32,
        createdAt: new Date('2024-01-16T10:15:00Z'),
        updatedAt: new Date('2024-01-16T10:15:00Z'),
      },
      {
        id: '3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        age: 25,
        createdAt: new Date('2024-01-17T14:20:00Z'),
        updatedAt: new Date('2024-01-17T14:20:00Z'),
      },
    ];

    // 将 mock 数据添加到内存存储中
    mockUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  async create(userData: CreateUserData): Promise<User> {
    const id = this.nextId.toString();
    this.nextId++;

    const user: User = {
      id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      ...userData,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}
