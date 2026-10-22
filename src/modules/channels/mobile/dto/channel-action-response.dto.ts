import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ChannelActionResponseDto {
  @ApiProperty({
    description: 'Result message describing the outcome of the action',
    example: 'Channel deleted',
  })
  @Expose()
  message!: string;
}
