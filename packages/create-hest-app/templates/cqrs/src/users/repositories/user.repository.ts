import { Injectable } from '@hestjs/core';
import { User, CreateUserData, UpdateUserData } from '../entities';

@Injectable()
export class UserRepository {
  private users: Map<string, User> = new Map();
  private nextId = 1;

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
