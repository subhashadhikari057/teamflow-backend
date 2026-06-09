import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class OAuthAuthorizationQueryDto {
  @ApiPropertyOptional({
    description: 'Optional client redirect URL to remember through OAuth state',
    example: 'https://app.teamflow.app/auth/callback',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  redirectUri?: string;

  @ApiPropertyOptional({
    description: 'Optional state passthrough from client',
    example: 'state-from-client',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientState?: string;
}
