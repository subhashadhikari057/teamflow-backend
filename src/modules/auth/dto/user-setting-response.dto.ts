import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserSettingResponseDto {
  @ApiProperty({
    description: 'Whether message sound is enabled for the authenticated user',
    example: true,
  })
  @Expose()
  messageSoundEnabled!: boolean;
}
