import { Module } from '@hestjs/core';
import { CustomValidationController } from './custom-validation.controller';
import { CustomValidationService } from './custom-validation.service';

@Module({
  controllers: [CustomValidationController],
  providers: [CustomValidationService],
  exports: [CustomValidationService],
})
export class CustomValidationModule {}
