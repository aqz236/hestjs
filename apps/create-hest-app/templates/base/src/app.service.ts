import { Injectable } from '@hestjs/core';

@Injectable()
export class AppService {
  private users = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ];

  getHello(): string {
    return 'Hello from HestJS!';
  }

  getUsers() {
    return this.users;
  }

  getUser(id: string) {
    return this.users.find(user => user.id === id);
  }

  createUser(userData: { name: string; email: string }) {
    const user = {
      id: Date.now().toString(),
      ...userData,
    };
    this.users.push(user);
    return user;
  }
}
