import { Module } from '@hestjs/core';
import { SystemModule } from './system/system.module';

@Module({
  controllers: [],
  providers: [],
  imports: [SystemModule],
})
export class AppModule {}
