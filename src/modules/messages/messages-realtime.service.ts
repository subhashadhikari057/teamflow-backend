import { Injectable } from '@nestjs/common';
import { ChannelMembersRepository } from '../channels/repositories/channel-members.repository';
import { ChannelsRepository } from '../channels/repositories/channels.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { MessagesGateway } from './messages.gateway';

interface ChannelMetaUpdatedPayload {
  workspaceId: string;
  channelId: string;
  unreadCount: number;
  lastReadAt: Date | null;
  lastMessageAt: Date | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;
}

@Injectable()
export class MessagesRealtimeService {
  constructor(
    private readonly messagesGateway: MessagesGateway,
    private readonly channelsRepository: ChannelsRepository,
    private readonly channelMembersRepository: ChannelMembersRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  async emitChannelMetaUpdatedForUser(
    workspaceId: string,
    channelId: string,
    userId: string,
  ) {
    const channel = await this.channelsRepository.findByWorkspaceAndIdForUser(
      workspaceId,
      channelId,
      userId,
    );

    if (!channel) {
      return;
    }

    const currentMembership = channel.members[0];
    const lastMessage = channel.messages[0];
    const unreadCount = currentMembership
      ? await this.messagesRepository.countUnreadByChannel({
          channelId,
          lastReadAt: currentMembership.lastReadAt,
        })
      : 0;

    const payload: ChannelMetaUpdatedPayload = {
      workspaceId,
      channelId,
      unreadCount,
      lastReadAt: currentMembership?.lastReadAt ?? null,
      lastMessageAt: lastMessage?.createdAt ?? null,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : null,
    };

    this.messagesGateway.emitChannelMetaUpdated(userId, payload);
  }

  async emitChannelMetaUpdatedForChannelMembers(
    workspaceId: string,
    channelId: string,
  ) {
    const members =
      await this.channelMembersRepository.findAllByChannel(channelId);

    await Promise.all(
      members.map((member) =>
        this.emitChannelMetaUpdatedForUser(
          workspaceId,
          channelId,
          member.userId,
        ),
      ),
    );
  }
}
