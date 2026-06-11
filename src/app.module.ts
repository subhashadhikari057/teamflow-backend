import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './infrastructure/email/email.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { StarterModule } from './modules/starter/starter.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { StartupModule } from './startup/startup.module';

@Module({
  imports: [
    JwtModule.register({}),
    AuthModule,
    EmailModule,
    PrismaModule,
    RedisModule,
    StarterModule,
    StartupModule,
    UsersModule,
    WorkspacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
