import { Module } from '@hestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { CustomValidationModule } from './modules/custom-validation/custom-validation.module';

@Module({
  imports: [UsersModule, CustomValidationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
