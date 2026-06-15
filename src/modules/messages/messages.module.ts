import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChannelMemberGuard } from '../../common/guards/channel-member.guard';
import { WorkspaceRoleGuard } from '../../common/guards/workspace-role.guard';
import { WorkspaceMembersRepository } from '../workspaces/repositories/workspace-members.repository';
import { MessagesGateway } from './messages.gateway';
import { MessagesRealtimeService } from './messages-realtime.service';
import { MobileMessagesController } from './mobile/mobile-messages.controller';
import { MobileMessagesService } from './mobile/mobile-messages.service';
import { MessagesRepository } from './repositories/messages.repository';
import { ChannelMembersRepository } from '../channels/repositories/channel-members.repository';
import { ChannelsRepository } from '../channels/repositories/channels.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MobileMessagesController],
  providers: [
    MobileMessagesService,
    MessagesGateway,
    MessagesRealtimeService,
    MessagesRepository,
    ChannelsRepository,
    ChannelMembersRepository,
    WorkspaceMembersRepository,
    WorkspaceRoleGuard,
    ChannelMemberGuard,
  ],
  exports: [MessagesRealtimeService],
})
export class MessagesModule {}
