import type {
  ChannelMessagePin,
  Message,
  MessageAttachment,
} from '@prisma/client';

interface MessageUserSummary {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

export interface MessageWithSender extends Message {
  sender: MessageUserSummary;
  attachments: MessageAttachment[];
  pin: (ChannelMessagePin & { pinnedByUser: MessageUserSummary }) | null;
}
