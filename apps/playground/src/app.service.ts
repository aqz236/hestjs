import { Injectable } from '@hestjs/core';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to HestJS CQRS Demo! 🚀';
  }
}
