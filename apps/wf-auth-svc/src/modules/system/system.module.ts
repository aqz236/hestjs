import { Module } from '@hestjs/core';
import { HealthController } from './infrastructure/controllers/http/health.controller';

@Module({
  controllers: [HealthController],
  providers: [],
})
export class SystemModule {}
