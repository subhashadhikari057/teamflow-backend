import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MessageActionResponseDto {
  @ApiProperty({
    description: 'Action result message',
    example: 'Message deleted',
  })
  @Expose()
  message!: string;
}
