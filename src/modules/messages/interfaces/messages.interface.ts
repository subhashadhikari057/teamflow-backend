import type { Message } from '@prisma/client';

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string | null;
    username: string;
    avatarUrl: string | null;
  };
}
