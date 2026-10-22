import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateUserSettingDto {
  @ApiProperty({
    description: 'Whether message sound is enabled for the authenticated user',
    example: true,
  })
  @IsBoolean()
  @Expose()
  messageSoundEnabled!: boolean;
}
