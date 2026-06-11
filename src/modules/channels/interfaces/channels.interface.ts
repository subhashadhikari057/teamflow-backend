import type { Channel, ChannelMember, ChannelMemberRole } from '@prisma/client';

export interface ChannelWithCurrentMember extends Channel {
  _count: {
    members: number;
  };
  members: ChannelMember[];
}

export interface ChannelMemberWithUser extends ChannelMember {
  user: {
    id: string;
    name: string | null;
    username: string;
    avatarUrl: string | null;
  };
}

export type { ChannelMemberRole };
