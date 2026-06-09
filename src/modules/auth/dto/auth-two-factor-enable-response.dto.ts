import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthTwoFactorEnableResponseDto {
  @ApiProperty()
  @Expose()
  secret!: string;

  @ApiProperty()
  @Expose()
  otpauthUrl!: string;

  @ApiProperty()
  @Expose()
  qrCodeUrl!: string;
}
