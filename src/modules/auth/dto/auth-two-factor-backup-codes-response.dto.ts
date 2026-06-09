import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthTwoFactorBackupCodesResponseDto {
  @ApiProperty({ type: [String] })
  @Expose()
  codes!: string[];
}
