import { Injectable } from '@nestjs/common';
import type { ChannelMessagePin, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ChannelMessagePinsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ChannelMessagePinUncheckedCreateInput) {
    return this.prisma.channelMessagePin.create({
      data,
    });
  }

  findByMessageId(messageId: string): Promise<ChannelMessagePin | null> {
    return this.prisma.channelMessagePin.findUnique({
      where: { messageId },
    });
  }

  async delete(channelId: string, messageId: string): Promise<void> {
    await this.prisma.channelMessagePin.delete({
      where: {
        channelId_messageId: {
          channelId,
          messageId,
        },
      },
    });
  }

  async deleteByMessageId(messageId: string): Promise<void> {
    await this.prisma.channelMessagePin.deleteMany({
      where: { messageId },
    });
  }
}
