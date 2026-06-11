import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelMemberRole } from '@prisma/client';
import { Expose } from 'class-transformer';

export class ChannelMemberResponseDto {
  @ApiProperty({ description: 'Channel membership ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Channel ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  channelId!: string;

  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @Expose()
  userId!: string;

  @ApiPropertyOptional({ description: 'Full name of the member', example: 'Alice Smith', nullable: true })
  @Expose()
  name?: string | null;

  @ApiProperty({ description: 'Username of the member', example: 'alice.smith' })
  @Expose()
  username!: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.png', nullable: true })
  @Expose()
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Role within the channel', enum: ChannelMemberRole, example: ChannelMemberRole.MEMBER })
  @Expose()
  role!: ChannelMemberRole;

  @ApiProperty({ description: 'Whether this channel is archived in the member sidebar', example: false })
  @Expose()
  isArchived!: boolean;

  @ApiProperty({ description: 'Joined timestamp', example: '2026-06-11T12:00:00.000Z' })
  @Expose()
  joinedAt!: Date;
}
