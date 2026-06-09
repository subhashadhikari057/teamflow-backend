import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class DisableTwoFactorDto {
  @ApiProperty({ description: 'Current password to disable 2FA' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
