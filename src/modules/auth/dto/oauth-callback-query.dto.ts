import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class OAuthCallbackQueryDto {
  @ApiProperty({
    description: 'Authorization code returned by the OAuth provider',
    example: '4/0AQSTgQHExampleGoogleCode',
  })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({
    description: 'Opaque state token used to validate the OAuth flow',
    example: 'oauth_state_abc123',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  state!: string;
}
