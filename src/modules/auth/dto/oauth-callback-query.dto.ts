import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class OAuthCallbackQueryDto {
  @ApiProperty({
    description: 'Authorization code returned by the OAuth provider',
  })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({
    description: 'Opaque state token used to validate the OAuth flow',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  state!: string;
}
