import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class AddChannelMemberDto {
  @ApiProperty({
    description: 'User ID to add to the channel',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @Expose()
  userId!: string;
}
