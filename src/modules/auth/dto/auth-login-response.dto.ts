import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuthSessionResponseDto } from './auth-session-response.dto';

export class AuthLoginResponseDto {
  @ApiPropertyOptional({
    description: 'Whether two-factor verification is required before completing login',
    example: false,
  })
  @Expose()
  requiresTwoFactor?: boolean;

  @ApiPropertyOptional({
    description: 'Temporary challenge token used for the 2FA verify step',
    example: 'a3f9c2e1b4d0...',
  })
  @Expose()
  challengeToken?: string;

  @ApiPropertyOptional({
    description: 'Present only when the login is fully authenticated (no 2FA required)',
    type: AuthSessionResponseDto,
  })
  @Expose()
  @Type(() => AuthSessionResponseDto)
  session?: AuthSessionResponseDto;
}
