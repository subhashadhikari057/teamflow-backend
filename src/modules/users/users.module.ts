import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GlobalAdminGuard } from '../../common/guards/global-admin.guard';
import { AdminUsersController } from './admin/admin-users.controller';
import { AdminUsersService } from './admin/admin-users.service';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, UsersRepository, GlobalAdminGuard],
})
export class UsersModule {}
