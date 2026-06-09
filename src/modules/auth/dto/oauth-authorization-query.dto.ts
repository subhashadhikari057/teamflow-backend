import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class OAuthAuthorizationQueryDto {
  @ApiPropertyOptional({
    description: 'Optional client redirect URL to remember through OAuth state',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  redirectUri?: string;

  @ApiPropertyOptional({
    description: 'Optional state passthrough from client',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientState?: string;
}
