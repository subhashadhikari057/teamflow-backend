import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { ChannelsModule } from '../channels/channels.module';
import { AdminWorkspacesController } from './admin/admin-workspaces.controller';
import { AdminWorkspacesService } from './admin/admin-workspaces.service';
import { MobileWorkspacesController } from './mobile/mobile-workspaces.controller';
import { MobileWorkspacesService } from './mobile/mobile-workspaces.service';
import { WorkspaceInvitesRepository } from './repositories/workspace-invites.repository';
import { WorkspaceMembersRepository } from './repositories/workspace-members.repository';
import { WorkspacesRepository } from './repositories/workspaces.repository';

@Module({
  imports: [JwtModule.register({}), ChannelsModule],
  controllers: [MobileWorkspacesController, AdminWorkspacesController],
  providers: [
    MobileWorkspacesService,
    AdminWorkspacesService,
    WorkspacesRepository,
    WorkspaceMembersRepository,
    WorkspaceInvitesRepository,
    WorkspaceRoleGuard,
  ],
})
export class WorkspacesModule {}
