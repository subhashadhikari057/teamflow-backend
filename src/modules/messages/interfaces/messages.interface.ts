import type { Message, MessageAttachment } from '@prisma/client';

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string | null;
    username: string;
    avatarUrl: string | null;
  };
  attachments: MessageAttachment[];
}
