import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { StartupModule } from './startup/startup.module';

@Module({
  imports: [PrismaModule, StartupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
