import { Injectable } from '@nestjs/common';
import type { ChannelMember, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { ChannelMemberWithUser } from '../interfaces/channels.interface';

const channelMemberWithUserInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.ChannelMemberInclude;

@Injectable()
export class ChannelMembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.ChannelMemberUncheckedCreateInput,
  ): Promise<ChannelMember> {
    return this.prisma.channelMember.create({ data });
  }

  findByChannelAndUserRaw(
    channelId: string,
    userId: string,
  ): Promise<ChannelMember | null> {
    return this.prisma.channelMember.findFirst({
      where: { channelId, userId },
    });
  }

  findByChannelAndUser(
    channelId: string,
    userId: string,
  ): Promise<ChannelMemberWithUser | null> {
    return this.prisma.channelMember.findFirst({
      where: { channelId, userId },
      include: channelMemberWithUserInclude,
    }) as Promise<ChannelMemberWithUser | null>;
  }

  findAllByChannel(channelId: string): Promise<ChannelMemberWithUser[]> {
    return this.prisma.channelMember.findMany({
      where: { channelId },
      include: channelMemberWithUserInclude,
      orderBy: { joinedAt: 'asc' },
    }) as Promise<ChannelMemberWithUser[]>;
  }

  update(
    id: string,
    data: Prisma.ChannelMemberUpdateInput,
  ): Promise<ChannelMemberWithUser> {
    return this.prisma.channelMember.update({
      where: { id },
      data,
      include: channelMemberWithUserInclude,
    }) as Promise<ChannelMemberWithUser>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.channelMember.delete({ where: { id } });
  }

  async removeAllByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.channelMember.deleteMany({
      where: {
        userId,
        channel: {
          workspaceId,
        },
      },
    });
  }
}
