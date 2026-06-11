import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChannelMemberGuard } from '../../common/guards/channel-member.guard';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { WorkspaceMembersRepository } from '../workspaces/repositories/workspace-members.repository';
import { MobileChannelsController } from './mobile/mobile-channels.controller';
import { MobileChannelsService } from './mobile/mobile-channels.service';
import { ChannelMembersRepository } from './repositories/channel-members.repository';
import { ChannelsRepository } from './repositories/channels.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MobileChannelsController],
  providers: [
    MobileChannelsService,
    ChannelsRepository,
    ChannelMembersRepository,
    WorkspaceMembersRepository,
    WorkspaceRoleGuard,
    ChannelMemberGuard,
  ],
  exports: [ChannelsRepository, ChannelMembersRepository],
})
export class ChannelsModule {}
