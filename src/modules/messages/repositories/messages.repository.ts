import { Injectable } from '@nestjs/common';
import type { Message, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { MessageWithSender } from '../interfaces/messages.interface';

const messageWithSenderInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
  },
  attachments: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  pin: {
    include: {
      pinnedByUser: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  },
} satisfies Prisma.MessageInclude;

interface FindChannelMessagesInput {
  channelId: string;
  cursor?: string;
  limit: number;
}

interface CountUnreadMessagesInput {
  channelId: string;
  lastReadAt?: Date | null;
}

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MessageCreateInput): Promise<MessageWithSender> {
    return this.prisma.message.create({
      data,
      include: messageWithSenderInclude,
    }) as Promise<MessageWithSender>;
  }

  findById(id: string): Promise<MessageWithSender | null> {
    return this.prisma.message.findFirst({
      where: { id, deletedAt: null },
      include: messageWithSenderInclude,
    }) as Promise<MessageWithSender | null>;
  }

  findByChannel(input: FindChannelMessagesInput): Promise<MessageWithSender[]> {
    return this.prisma.message.findMany({
      where: {
        channelId: input.channelId,
        deletedAt: null,
      },
      ...(input.cursor
        ? {
            cursor: { id: input.cursor },
            skip: 1,
          }
        : {}),
      take: input.limit,
      include: messageWithSenderInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }) as Promise<MessageWithSender[]>;
  }

  update(
    id: string,
    data: Prisma.MessageUpdateInput,
  ): Promise<MessageWithSender> {
    return this.prisma.message.update({
      where: { id },
      data,
      include: messageWithSenderInclude,
    }) as Promise<MessageWithSender>;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  countUnreadByChannel(input: CountUnreadMessagesInput): Promise<number> {
    return this.prisma.message.count({
      where: {
        channelId: input.channelId,
        deletedAt: null,
        ...(input.lastReadAt
          ? {
              createdAt: {
                gt: input.lastReadAt,
              },
            }
          : {}),
      },
    });
  }

  findPinnedByChannel(channelId: string): Promise<MessageWithSender[]> {
    return this.prisma.message.findMany({
      where: {
        channelId,
        deletedAt: null,
        pin: {
          isNot: null,
        },
      },
      include: messageWithSenderInclude,
      orderBy: [{ pin: { pinnedAt: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }],
    }) as Promise<MessageWithSender[]>;
  }
}
