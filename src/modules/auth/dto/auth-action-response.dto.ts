import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthActionResponseDto {
  @ApiProperty({
    description: 'Human-readable status message',
    example: 'Password changed successfully',
  })
  @Expose()
  message!: string;
}
