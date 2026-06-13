import { Injectable } from '@nestjs/common';
import type { Channel, Prisma } from '@prisma/client';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { ChannelWithCurrentMember } from '../interfaces/channels.interface';

const channelWithCurrentMemberInclude = (userId: string) =>
  ({
    _count: {
      select: {
        members: true,
      },
    },
    creator: {
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
    },
    members: {
      where: { userId },
      take: 1,
    },
  }) satisfies Prisma.ChannelInclude;

@Injectable()
export class ChannelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ChannelUncheckedCreateInput): Promise<Channel> {
    return this.prisma.channel.create({ data });
  }

  findById(id: string): Promise<Channel | null> {
    return this.prisma.channel.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findByWorkspaceAndName(
    workspaceId: string,
    name: string,
  ): Promise<Channel | null> {
    return this.prisma.channel.findFirst({
      where: { workspaceId, name, deletedAt: null },
    });
  }

  findByWorkspaceAndIdForUser(
    workspaceId: string,
    channelId: string,
    userId: string,
  ): Promise<ChannelWithCurrentMember | null> {
    return this.prisma.channel.findFirst({
      where: {
        id: channelId,
        workspaceId,
        deletedAt: null,
      },
      include: channelWithCurrentMemberInclude(userId),
    }) as Promise<ChannelWithCurrentMember | null>;
  }

  findVisibleByWorkspaceForUser(
    workspaceId: string,
    userId: string,
  ): Promise<ChannelWithCurrentMember[]> {
    return this.prisma.channel.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        isArchived: false,
        OR: [
          { type: ChannelType.PUBLIC },
          { members: { some: { userId } } },
        ],
      },
      include: channelWithCurrentMemberInclude(userId),
      orderBy: [{ isGeneral: 'desc' }, { createdAt: 'asc' }],
    }) as Promise<ChannelWithCurrentMember[]>;
  }

  findGeneralByWorkspace(workspaceId: string): Promise<Channel | null> {
    return this.prisma.channel.findFirst({
      where: {
        workspaceId,
        isGeneral: true,
        deletedAt: null,
      },
    });
  }

  update(
    id: string,
    data: Prisma.ChannelUpdateInput,
  ): Promise<Channel> {
    return this.prisma.channel.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.channel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
