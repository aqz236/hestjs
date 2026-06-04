import { Module } from '@hestjs/core';
import { CqrsModule } from '@hestjs/cqrs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController, UserModule } from './users';

@Module({
  imports: [CqrsModule.forRoot(), UserModule],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
