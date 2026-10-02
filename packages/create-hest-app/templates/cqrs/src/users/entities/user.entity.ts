import { IQueryResult } from '@hestjs/cqrs';

export interface User extends IQueryResult {
  id: string;
  name: string;
  email: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  age?: number;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  age?: number;
}
