import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class MessageSenderResponseDto {
  @ApiProperty({
    description: 'Sender user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id!: string;

  @ApiPropertyOptional({
    description: 'Sender display name',
    example: 'Subhash Adhikari',
  })
  @Expose()
  name?: string | null;

  @ApiProperty({
    description: 'Sender username',
    example: 'subhash',
  })
  @Expose()
  username!: string;

  @ApiPropertyOptional({
    description: 'Sender avatar path or URL',
    example: 'images/ba3b4bdf-9ba8-4ff0-a40e-5a10acce84c2.webp',
  })
  @Expose()
  avatarUrl?: string | null;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Channel ID the message belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  channelId!: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hey team, standup starts in 10 minutes.',
  })
  @Expose()
  content!: string;

  @ApiProperty({
    description: 'Sender user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  senderId!: string;

  @ApiProperty({
    description: 'Sender details',
    type: MessageSenderResponseDto,
  })
  @Expose()
  @Type(() => MessageSenderResponseDto)
  sender!: MessageSenderResponseDto;

  @ApiProperty({
    description: 'When the message was created',
    example: '2026-06-15T10:30:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'When the message was last edited',
    example: '2026-06-15T10:35:00.000Z',
  })
  @Expose()
  editedAt?: Date | null;

  @ApiProperty({
    description: 'Whether the message has been edited',
    example: false,
  })
  @Expose()
  isEdited!: boolean;
}
