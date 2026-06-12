import { HttpStatus, Injectable } from '@nestjs/common';
import { ChannelMemberRole, ChannelType, WorkspaceRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { AppException } from '../../../common/exceptions/app.exception';
import { WorkspaceMembersRepository } from '../../workspaces/repositories/workspace-members.repository';
import type {
  ChannelMemberWithUser,
  ChannelWithCurrentMember,
} from '../interfaces/channels.interface';
import { ChannelMembersRepository } from '../repositories/channel-members.repository';
import { ChannelsRepository } from '../repositories/channels.repository';
import { CHANNELS_ERROR_CODES } from '../channels.types';
import { AddChannelMemberDto } from './dto/add-channel-member.dto';
import { ChannelActionResponseDto } from './dto/channel-action-response.dto';
import { ChannelDetailQueryDto } from './dto/channel-detail-query.dto';
import { ChannelMemberResponseDto } from './dto/channel-member-response.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelMemberRoleDto } from './dto/update-channel-member-role.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class MobileChannelsService {
  constructor(
    private readonly channelsRepository: ChannelsRepository,
    private readonly channelMembersRepository: ChannelMembersRepository,
    private readonly workspaceMembersRepository: WorkspaceMembersRepository,
  ) {}

  async createChannel(
    userId: string,
    workspaceId: string,
    dto: CreateChannelDto,
  ): Promise<ChannelResponseDto> {
    const normalizedName = this.normalizeChannelName(dto.name);
    this.ensureNameIsNotReserved(normalizedName);

    const existing = await this.channelsRepository.findByWorkspaceAndName(
      workspaceId,
      normalizedName,
    );
    if (existing) {
      throw new AppException(
        CHANNELS_ERROR_CODES.DUPLICATE_CHANNEL_NAME,
        'A channel with this name already exists in the workspace',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const channel = await this.channelsRepository.create({
      workspaceId,
      name: normalizedName,
      description: dto.description ?? null,
      topic: dto.topic ?? null,
      type: dto.type,
      isReadOnly: dto.isReadOnly ?? false,
      isArchived: false,
      isGeneral: false,
      createdBy: userId,
    });

    await this.channelMembersRepository.create({
      channelId: channel.id,
      userId,
      role: ChannelMemberRole.ADMIN,
      isArchived: false,
    });

    const created = await this.channelsRepository.findByWorkspaceAndIdForUser(
      workspaceId,
      channel.id,
      userId,
    );

    if (!created) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_NOT_FOUND,
        'Channel not found after creation',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapChannelResponse(created);
  }

  async listChannels(
    userId: string,
    workspaceId: string,
  ): Promise<ChannelResponseDto[]> {
    const channels = await this.channelsRepository.findVisibleByWorkspaceForUser(
      workspaceId,
      userId,
    );

    return channels.map((channel) => this.mapChannelResponse(channel));
  }

  async getChannel(
    userId: string,
    workspaceId: string,
    channelId: string,
    query: ChannelDetailQueryDto,
  ): Promise<ChannelResponseDto> {
    const channel = await this.channelsRepository.findByWorkspaceAndIdForUser(
      workspaceId,
      channelId,
      userId,
    );

    if (!channel || channel.deletedAt || channel.isArchived) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_NOT_FOUND,
        'Channel not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (channel.type === ChannelType.PRIVATE && !channel.members.length) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_PRIVATE_ACCESS_DENIED,
        'You are not allowed to view this private channel',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const members = query.member
      ? await this.channelMembersRepository.findAllByChannel(channelId)
      : undefined;

    return this.mapChannelResponse(channel, members);
  }

  async updateChannel(
    userId: string,
    workspaceId: string,
    channelId: string,
    dto: UpdateChannelDto,
  ): Promise<ChannelResponseDto> {
    const channel = await this.getChannelEntityOrThrow(workspaceId, channelId);

    if (dto.name !== undefined) {
      if (channel.isGeneral) {
        throw new AppException(
          CHANNELS_ERROR_CODES.GENERAL_CHANNEL_RENAME_FORBIDDEN,
          'The general channel cannot be renamed',
          { status: HttpStatus.FORBIDDEN },
        );
      }

      const normalizedName = this.normalizeChannelName(dto.name);
      this.ensureNameIsNotReserved(normalizedName);

      const existing = await this.channelsRepository.findByWorkspaceAndName(
        workspaceId,
        normalizedName,
      );

      if (existing && existing.id !== channel.id) {
        throw new AppException(
          CHANNELS_ERROR_CODES.DUPLICATE_CHANNEL_NAME,
          'A channel with this name already exists in the workspace',
          { status: HttpStatus.UNPROCESSABLE_ENTITY },
        );
      }
    }

    await this.channelsRepository.update(channel.id, {
      ...(dto.name !== undefined && { name: this.normalizeChannelName(dto.name) }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.topic !== undefined && { topic: dto.topic }),
      ...(dto.isReadOnly !== undefined && { isReadOnly: dto.isReadOnly }),
    });

    const updated = await this.channelsRepository.findByWorkspaceAndIdForUser(
      workspaceId,
      channel.id,
      userId,
    );

    if (!updated) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_NOT_FOUND,
        'Channel not found after update',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapChannelResponse(updated);
  }

  async deleteChannel(
    workspaceId: string,
    channelId: string,
  ): Promise<ChannelActionResponseDto> {
    const channel = await this.getChannelEntityOrThrow(workspaceId, channelId);

    if (channel.isGeneral) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CANNOT_DELETE_GENERAL,
        'The general channel cannot be deleted',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    await this.channelsRepository.softDelete(channel.id);

    return plainToInstance(
      ChannelActionResponseDto,
      { message: 'Channel deleted' },
      { excludeExtraneousValues: true },
    );
  }

  async toggleArchive(
    userId: string,
    workspaceId: string,
    channelId: string,
  ): Promise<ChannelResponseDto> {
    const channel = await this.getChannelEntityOrThrow(workspaceId, channelId);

    if (channel.isGeneral) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CANNOT_DELETE_GENERAL,
        'The general channel cannot be archived',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    await this.channelsRepository.update(channel.id, {
      isArchived: !channel.isArchived,
    });

    const updated = await this.channelsRepository.findByWorkspaceAndIdForUser(
      workspaceId,
      channel.id,
      userId,
    );

    if (!updated) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_NOT_FOUND,
        'Channel not found after archive update',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapChannelResponse(updated);
  }

  async joinChannel(
    userId: string,
    workspaceId: string,
    channelId: string,
  ): Promise<ChannelMemberResponseDto> {
    const channel = await this.getChannelEntityOrThrow(workspaceId, channelId);

    if (channel.type === ChannelType.PRIVATE) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CANNOT_JOIN_PRIVATE,
        'Private channels cannot be joined from this endpoint',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    if (channel.isArchived) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CANNOT_JOIN_ARCHIVED,
        'Archived channels cannot be joined',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const existing = await this.channelMembersRepository.findByChannelAndUser(
      channel.id,
      userId,
    );
    if (existing) {
      throw new AppException(
        CHANNELS_ERROR_CODES.ALREADY_CHANNEL_MEMBER,
        'You are already a member of this channel',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    await this.channelMembersRepository.create({
      channelId: channel.id,
      userId,
      role: ChannelMemberRole.MEMBER,
      isArchived: false,
    });

    const created = await this.channelMembersRepository.findByChannelAndUser(
      channel.id,
      userId,
    );

    if (!created) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_MEMBER_NOT_FOUND,
        'Channel membership not found after join',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapChannelMemberResponse(created);
  }

  async leaveChannel(
    userId: string,
    workspaceId: string,
    channelId: string,
  ): Promise<ChannelActionResponseDto> {
    const channel = await this.getChannelEntityOrThrow(workspaceId, channelId);

    if (channel.isGeneral) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CANNOT_LEAVE_GENERAL,
        'You cannot leave the general channel',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const membership = await this.channelMembersRepository.findByChannelAndUserRaw(
      channel.id,
      userId,
    );
    if (!membership) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_MEMBER_NOT_FOUND,
        'Channel membership not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    await this.channelMembersRepository.delete(membership.id);

    return plainToInstance(
      ChannelActionResponseDto,
      { message: 'Left channel' },
      { excludeExtraneousValues: true },
    );
  }

  async addMember(
    workspaceId: string,
    channelId: string,
    dto: AddChannelMemberDto,
  ): Promise<ChannelMemberResponseDto> {
    const channel = await this.getChannelEntityOrThrow(workspaceId, channelId);

    if (channel.type !== ChannelType.PRIVATE) {
      throw new AppException(
        CHANNELS_ERROR_CODES.PRIVATE_MEMBER_ADD_ONLY,
        'Members can only be explicitly added to private channels',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const workspaceMember =
      await this.workspaceMembersRepository.findByWorkspaceAndUserRaw(
        workspaceId,
        dto.userId,
      );

    if (!workspaceMember || !workspaceMember.isActive) {
      throw new AppException(
        CHANNELS_ERROR_CODES.USER_NOT_WORKSPACE_MEMBER,
        'User must be an active workspace member to join this channel',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const existing = await this.channelMembersRepository.findByChannelAndUser(
      channel.id,
      dto.userId,
    );
    if (existing) {
      throw new AppException(
        CHANNELS_ERROR_CODES.ALREADY_CHANNEL_MEMBER,
        'User is already a member of this channel',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    await this.channelMembersRepository.create({
      channelId: channel.id,
      userId: dto.userId,
      role: ChannelMemberRole.MEMBER,
      isArchived: false,
    });

    const created = await this.channelMembersRepository.findByChannelAndUser(
      channel.id,
      dto.userId,
    );

    if (!created) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_MEMBER_NOT_FOUND,
        'Channel membership not found after add',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapChannelMemberResponse(created);
  }

  async listMembers(
    workspaceId: string,
    channelId: string,
  ): Promise<ChannelMemberResponseDto[]> {
    await this.getChannelEntityOrThrow(workspaceId, channelId);
    const members = await this.channelMembersRepository.findAllByChannel(channelId);
    return members.map((member) => this.mapChannelMemberResponse(member));
  }

  async updateMemberRole(
    workspaceId: string,
    channelId: string,
    userId: string,
    dto: UpdateChannelMemberRoleDto,
  ): Promise<ChannelMemberResponseDto> {
    await this.getChannelEntityOrThrow(workspaceId, channelId);

    const membership = await this.channelMembersRepository.findByChannelAndUserRaw(
      channelId,
      userId,
    );
    if (!membership) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_MEMBER_NOT_FOUND,
        'Channel membership not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const updated = await this.channelMembersRepository.update(membership.id, {
      role: dto.role,
    });

    return this.mapChannelMemberResponse(updated);
  }

  async removeMember(
    workspaceId: string,
    channelId: string,
    userId: string,
  ): Promise<ChannelActionResponseDto> {
    const channel = await this.getChannelEntityOrThrow(workspaceId, channelId);

    if (channel.isGeneral) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CANNOT_REMOVE_FROM_GENERAL,
        'Cannot remove members from general channel',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const membership = await this.channelMembersRepository.findByChannelAndUserRaw(
      channel.id,
      userId,
    );
    if (!membership) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_MEMBER_NOT_FOUND,
        'Channel membership not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    await this.channelMembersRepository.delete(membership.id);

    return plainToInstance(
      ChannelActionResponseDto,
      { message: 'Member removed' },
      { excludeExtraneousValues: true },
    );
  }

  async toggleArchivedForMe(
    userId: string,
    workspaceId: string,
    channelId: string,
  ): Promise<ChannelActionResponseDto> {
    await this.getChannelEntityOrThrow(workspaceId, channelId);
    const membership = await this.channelMembersRepository.findByChannelAndUserRaw(
      channelId,
      userId,
    );
    if (!membership) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_MEMBER_NOT_FOUND,
        'Channel membership not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    await this.channelMembersRepository.update(membership.id, {
      isArchived: !membership.isArchived,
    });

    return plainToInstance(
      ChannelActionResponseDto,
      { message: 'Channel archived' },
      { excludeExtraneousValues: true },
    );
  }

  async markRead(
    userId: string,
    workspaceId: string,
    channelId: string,
  ): Promise<ChannelActionResponseDto> {
    await this.getChannelEntityOrThrow(workspaceId, channelId);
    const membership = await this.channelMembersRepository.findByChannelAndUserRaw(
      channelId,
      userId,
    );
    if (!membership) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_MEMBER_NOT_FOUND,
        'Channel membership not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    await this.channelMembersRepository.update(membership.id, {
      lastReadAt: new Date(),
    });

    return plainToInstance(
      ChannelActionResponseDto,
      { message: 'Marked as read' },
      { excludeExtraneousValues: true },
    );
  }

  private async getChannelEntityOrThrow(
    workspaceId: string,
    channelId: string,
  ) {
    const channel = await this.channelsRepository.findById(channelId);
    if (!channel || channel.workspaceId !== workspaceId || channel.deletedAt) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_NOT_FOUND,
        'Channel not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return channel;
  }

  private normalizeChannelName(name: string) {
    const normalized = name
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!normalized) {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_NAME_INVALID,
        'Channel name is invalid',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    return normalized;
  }

  private ensureNameIsNotReserved(name: string) {
    if (name === 'general') {
      throw new AppException(
        CHANNELS_ERROR_CODES.CHANNEL_NAME_RESERVED,
        'The general channel name is reserved',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }
  }

  private mapChannelResponse(
    channel: ChannelWithCurrentMember,
    members?: ChannelMemberWithUser[],
  ): ChannelResponseDto {
    return plainToInstance(
      ChannelResponseDto,
      {
        id: channel.id,
        workspaceId: channel.workspaceId,
        name: channel.name,
        description: channel.description,
        topic: channel.topic,
        type: channel.type,
        isReadOnly: channel.isReadOnly,
        isArchived: channel.isArchived,
        isGeneral: channel.isGeneral,
        memberCount: channel._count.members,
        isMember: channel.members.length > 0,
        createdBy: channel.createdBy,
        createdAt: channel.createdAt,
        members: members?.map((member) => this.mapChannelMemberResponse(member)),
      },
      { excludeExtraneousValues: true },
    );
  }

  private mapChannelMemberResponse(
    member: ChannelMemberWithUser,
  ): ChannelMemberResponseDto {
    return plainToInstance(
      ChannelMemberResponseDto,
      {
        id: member.id,
        channelId: member.channelId,
        userId: member.userId,
        name: member.user.name,
        username: member.user.username,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        isArchived: member.isArchived,
        joinedAt: member.joinedAt,
      },
      { excludeExtraneousValues: true },
    );
  }
}
