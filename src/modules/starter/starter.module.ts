import { Module } from '@nestjs/common';
import { StarterAdminController } from './starter.admin.controller';
import { StarterMobileController } from './starter.mobile.controller';
import { StarterService } from './starter.service';

@Module({
  controllers: [StarterAdminController, StarterMobileController],
  providers: [StarterService],
})
export class StarterModule {}
