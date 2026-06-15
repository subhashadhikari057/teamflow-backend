import { HttpStatus, Injectable } from '@nestjs/common';
import { ChannelMemberRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { AppException } from '../../../common/exceptions/app.exception';
import { ChannelMembersRepository } from '../../channels/repositories/channel-members.repository';
import { ChannelsRepository } from '../../channels/repositories/channels.repository';
import type { MessageWithSender } from '../interfaces/messages.interface';
import { MessagesGateway } from '../messages.gateway';
import { MessagesRealtimeService } from '../messages-realtime.service';
import { MessagesRepository } from '../repositories/messages.repository';
import { MESSAGES_ERROR_CODES } from '../messages.types';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageActionResponseDto } from './dto/message-action-response.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MobileMessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly channelsRepository: ChannelsRepository,
    private readonly channelMembersRepository: ChannelMembersRepository,
    private readonly messagesGateway: MessagesGateway,
    private readonly messagesRealtimeService: MessagesRealtimeService,
  ) {}

  async createMessage(
    userId: string,
    workspaceId: string,
    channelId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const channel = await this.getChannelOrThrow(workspaceId, channelId);
    const membership = await this.getMembershipOrThrow(channelId, userId);
    const content = dto.content.trim();

    if (!content) {
      throw new AppException(
        MESSAGES_ERROR_CODES.MESSAGE_CONTENT_REQUIRED,
        'Message content is required',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (channel.isArchived) {
      throw new AppException(
        MESSAGES_ERROR_CODES.CHANNEL_ARCHIVED,
        'Cannot send messages to an archived channel',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    if (channel.isReadOnly && membership.role !== ChannelMemberRole.ADMIN) {
      throw new AppException(
        MESSAGES_ERROR_CODES.READ_ONLY_CHANNEL,
        'Only channel admins can send messages to this channel',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const message = await this.messagesRepository.create({
      channelId,
      senderId: userId,
      content,
    });
    await this.channelMembersRepository.update(membership.id, {
      lastReadAt: message.createdAt,
    });
    const response = this.mapMessageResponse(message);
    this.messagesGateway.emitTypingStop(workspaceId, channelId, {
      id: userId,
      username: message.sender.username,
      avatarUrl: message.sender.avatarUrl,
    });
    this.messagesGateway.emitMessageCreated(workspaceId, channelId, response);
    await this.messagesRealtimeService.emitChannelMetaUpdatedForChannelMembers(
      workspaceId,
      channelId,
    );

    return response;
  }

  async listMessages(
    userId: string,
    workspaceId: string,
    channelId: string,
    query: MessageQueryDto,
  ): Promise<MessageResponseDto[]> {
    const channel = await this.getChannelOrThrow(workspaceId, channelId);
    await this.getMembershipOrThrow(channelId, userId);

    if (channel.isArchived) {
      throw new AppException(
        MESSAGES_ERROR_CODES.CHANNEL_ARCHIVED,
        'Cannot read messages from an archived channel',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const messages = await this.messagesRepository.findByChannel({
      channelId,
      cursor: query.cursor,
      limit: query.limit ?? 30,
    });

    return messages
      .reverse()
      .map((message) => this.mapMessageResponse(message));
  }

  async updateMessage(
    userId: string,
    workspaceId: string,
    channelId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const channel = await this.getChannelOrThrow(workspaceId, channelId);
    await this.getMembershipOrThrow(channelId, userId);
    const content = dto.content.trim();

    if (!content) {
      throw new AppException(
        MESSAGES_ERROR_CODES.MESSAGE_CONTENT_REQUIRED,
        'Message content is required',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (channel.isArchived) {
      throw new AppException(
        MESSAGES_ERROR_CODES.CHANNEL_ARCHIVED,
        'Cannot edit messages in an archived channel',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const message = await this.getMessageOrThrow(messageId, channelId);

    if (message.senderId !== userId) {
      throw new AppException(
        MESSAGES_ERROR_CODES.MESSAGE_EDIT_FORBIDDEN,
        'You can only edit your own messages',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const updated = await this.messagesRepository.update(messageId, {
      content,
      editedAt: new Date(),
    });
    const response = this.mapMessageResponse(updated);
    this.messagesGateway.emitMessageUpdated(workspaceId, channelId, response);
    await this.messagesRealtimeService.emitChannelMetaUpdatedForChannelMembers(
      workspaceId,
      channelId,
    );

    return response;
  }

  async deleteMessage(
    userId: string,
    workspaceId: string,
    channelId: string,
    messageId: string,
  ): Promise<MessageActionResponseDto> {
    const channel = await this.getChannelOrThrow(workspaceId, channelId);
    await this.getMembershipOrThrow(channelId, userId);

    if (channel.isArchived) {
      throw new AppException(
        MESSAGES_ERROR_CODES.CHANNEL_ARCHIVED,
        'Cannot delete messages in an archived channel',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const message = await this.getMessageOrThrow(messageId, channelId);

    if (message.senderId !== userId) {
      throw new AppException(
        MESSAGES_ERROR_CODES.MESSAGE_DELETE_FORBIDDEN,
        'You can only delete your own messages',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    await this.messagesRepository.softDelete(messageId);
    this.messagesGateway.emitMessageDeleted(workspaceId, channelId, messageId);
    await this.messagesRealtimeService.emitChannelMetaUpdatedForChannelMembers(
      workspaceId,
      channelId,
    );

    return plainToInstance(
      MessageActionResponseDto,
      { message: 'Message deleted' },
      { excludeExtraneousValues: true },
    );
  }

  private async getChannelOrThrow(workspaceId: string, channelId: string) {
    const channel = await this.channelsRepository.findById(channelId);

    if (!channel || channel.workspaceId !== workspaceId) {
      throw new AppException(
        MESSAGES_ERROR_CODES.CHANNEL_NOT_FOUND,
        'Channel not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return channel;
  }

  private async getMembershipOrThrow(channelId: string, userId: string) {
    const membership =
      await this.channelMembersRepository.findByChannelAndUserRaw(
        channelId,
        userId,
      );

    if (!membership) {
      throw new AppException(
        MESSAGES_ERROR_CODES.CHANNEL_NOT_FOUND,
        'You are not a member of this channel',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    return membership;
  }

  private async getMessageOrThrow(messageId: string, channelId: string) {
    const message = await this.messagesRepository.findById(messageId);

    if (!message || message.channelId !== channelId) {
      throw new AppException(
        MESSAGES_ERROR_CODES.MESSAGE_NOT_FOUND,
        'Message not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return message;
  }

  private mapMessageResponse(message: MessageWithSender): MessageResponseDto {
    return plainToInstance(
      MessageResponseDto,
      {
        id: message.id,
        channelId: message.channelId,
        content: message.content,
        senderId: message.senderId,
        sender: message.sender,
        createdAt: message.createdAt,
        editedAt: message.editedAt,
        isEdited: Boolean(message.editedAt),
      },
      { excludeExtraneousValues: true },
    );
  }
}
