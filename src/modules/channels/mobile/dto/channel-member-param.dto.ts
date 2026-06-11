import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class ChannelMemberParamDto {
  @ApiProperty({ description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @Expose()
  workspaceId!: string;

  @ApiProperty({ description: 'Channel ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @Expose()
  channelId!: string;

  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  @Expose()
  userId!: string;
}
