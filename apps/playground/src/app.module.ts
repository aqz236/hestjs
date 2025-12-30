import { Module } from '@hestjs/core';
import { CqrsModule } from '@hestjs/cqrs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users';

@Module({
  imports: [CqrsModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
