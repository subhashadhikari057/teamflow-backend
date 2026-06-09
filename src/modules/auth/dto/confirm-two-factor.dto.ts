import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ConfirmTwoFactorDto {
  @ApiProperty({ description: 'Six digit authenticator code' })
  @IsString()
  @Length(6, 6)
  code!: string;
}
