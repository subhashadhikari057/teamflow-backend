import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OAuthCallbackQueryDto {
  @ApiProperty({
    description: 'Authorization code returned by the OAuth provider',
    example: '4/0AX4XfWi...',
  })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({
    description: 'Opaque state token used to validate the OAuth flow',
    example: 'a3f9c2e1b4d07f3a...',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  state!: string;

  @ApiPropertyOptional({
    description: 'Issuer identifier appended by Google to the callback URL',
    example: 'https://accounts.google.com',
  })
  @IsOptional()
  @IsString()
  iss?: string;

  @ApiPropertyOptional({
    description: 'Granted OAuth scopes appended by Google to the callback URL',
    example: 'email profile openid',
  })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({
    description: 'Google account index appended by Google to the callback URL',
    example: '0',
  })
  @IsOptional()
  @IsString()
  authuser?: string;

  @ApiPropertyOptional({
    description: 'Consent prompt result appended by Google to the callback URL',
    example: 'consent',
  })
  @IsOptional()
  @IsString()
  prompt?: string;
}
