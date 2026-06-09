import { Module } from '@nestjs/common';
import { GlobalAdminGuard } from '../../common/guards/global-admin.guard';
import { AdminUsersController } from './admin/admin-users.controller';
import { AdminUsersService } from './admin/admin-users.service';
import { UsersRepository } from './repositories/users.repository';

@Module({
  controllers: [AdminUsersController],
  providers: [AdminUsersService, UsersRepository, GlobalAdminGuard],
})
export class UsersModule {}
