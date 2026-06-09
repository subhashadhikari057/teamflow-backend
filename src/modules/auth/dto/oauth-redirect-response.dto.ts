import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OAuthRedirectResponseDto {
  @ApiProperty({
    description: 'Provider authorization URL to open in the browser',
    example:
      'https://accounts.google.com/o/oauth2/v2/auth?client_id=example&redirect_uri=http://localhost:5001/api/auth/google/callback',
  })
  @Expose()
  url!: string;
}
