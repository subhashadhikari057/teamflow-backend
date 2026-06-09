import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthSessionsController } from './auth-sessions.controller';
import { AuthSessionsService } from './auth-sessions.service';
import { AuthService } from './auth.service';
import { AuthTwoFactorController } from './auth-two-factor.controller';
import { AuthTwoFactorService } from './auth-two-factor.service';
import { AuthRepository } from './repositories/auth.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, AuthSessionsController, AuthTwoFactorController],
  providers: [AuthService, AuthSessionsService, AuthTwoFactorService, AuthRepository],
  exports: [AuthService, AuthSessionsService, AuthTwoFactorService, AuthRepository],
})
export class AuthModule {}
