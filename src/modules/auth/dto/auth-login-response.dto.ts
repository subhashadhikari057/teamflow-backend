import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuthSessionResponseDto } from './auth-session-response.dto';

export class AuthLoginResponseDto extends AuthSessionResponseDto {
  @ApiPropertyOptional({
    description: 'Whether two-factor verification is required before completing login',
  })
  @Expose()
  requiresTwoFactor?: boolean;

  @ApiPropertyOptional({
    description: 'Temporary challenge token used for the 2FA verify step',
  })
  @Expose()
  challengeToken?: string;

  @ApiPropertyOptional({
    description: 'Present only when the login is fully authenticated',
    type: AuthSessionResponseDto,
  })
  @Expose()
  @Type(() => AuthSessionResponseDto)
  session?: AuthSessionResponseDto;
}
