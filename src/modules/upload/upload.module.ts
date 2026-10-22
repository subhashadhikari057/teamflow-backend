import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MobileUploadController } from './mobile/mobile-upload.controller';
import { MobileUploadService } from './mobile/mobile-upload.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MobileUploadController],
  providers: [MobileUploadService],
  exports: [MobileUploadService],
})
export class UploadModule {}
