import { Module } from '@hestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  CustomValidationController,
  CustomValidationService,
} from './custom-validation.controller';
import { UserController, UserService } from './user.controller';

@Module({
  controllers: [AppController, UserController, CustomValidationController],
  providers: [AppService, UserService, CustomValidationService],
})
export class AppModule {}
