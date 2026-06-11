import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { SessionClientMetadataDto } from './session-client-metadata.dto';

export class VerifyTwoFactorDto extends SessionClientMetadataDto {
  @ApiProperty({ description: 'Temporary challenge token returned from login' })
  @IsString()
  @MinLength(10)
  challengeToken!: string;

  @ApiPropertyOptional({ description: 'Six digit authenticator code' })
  @ValidateIf((value: VerifyTwoFactorDto) => !value.backupCode)
  @IsString()
  @Length(6, 6)
  code?: string;

  @ApiPropertyOptional({ description: 'One unused backup code' })
  @ValidateIf((value: VerifyTwoFactorDto) => !value.code)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  backupCode?: string;
}
