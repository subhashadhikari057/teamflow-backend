import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { ChannelMemberResponseDto } from './channel-member-response.dto';

export class ChannelResponseDto {
  @ApiProperty({ description: 'Channel ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  workspaceId!: string;

  @ApiProperty({ description: 'Normalized channel name', example: 'general' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ description: 'Channel description', example: 'Company-wide updates', nullable: true })
  @Expose()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Channel topic', example: 'Announcements and discussion', nullable: true })
  @Expose()
  topic?: string | null;

  @ApiProperty({ description: 'Channel type', enum: ChannelType, example: ChannelType.PUBLIC })
  @Expose()
  type!: ChannelType;

  @ApiProperty({ description: 'Whether the channel is read-only for non-admins', example: false })
  @Expose()
  isReadOnly!: boolean;

  @ApiProperty({ description: 'Whether the channel is archived', example: false })
  @Expose()
  isArchived!: boolean;

  @ApiProperty({ description: 'Whether this is the general channel', example: true })
  @Expose()
  isGeneral!: boolean;

  @ApiProperty({ description: 'Number of channel members', example: 12 })
  @Expose()
  memberCount!: number;

  @ApiProperty({ description: 'Whether the current user is a member of the channel', example: true })
  @Expose()
  isMember!: boolean;

  @ApiProperty({ description: 'User ID of the creator', example: '550e8400-e29b-41d4-a716-446655440002' })
  @Expose()
  createdBy!: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-06-11T12:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Channel members returned when requested with the member query parameter',
    type: [ChannelMemberResponseDto],
  })
  @Expose()
  @Type(() => ChannelMemberResponseDto)
  members?: ChannelMemberResponseDto[];
}
