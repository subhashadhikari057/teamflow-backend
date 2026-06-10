import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RegenerateBackupCodesDto {
  @ApiProperty({ description: 'Current password to confirm backup code regeneration' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
