import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuthUserResponseDto } from './auth-user-response.dto';
import { TokenPairResponseDto } from './token-pair-response.dto';

export class AuthSessionResponseDto {
  @ApiProperty({
    description: 'Authenticated user information',
    type: AuthUserResponseDto,
  })
  @Expose()
  @Type(() => AuthUserResponseDto)
  user!: AuthUserResponseDto;

  @ApiProperty({
    description: 'Issued access and refresh tokens',
    type: TokenPairResponseDto,
  })
  @Expose()
  @Type(() => TokenPairResponseDto)
  tokens!: TokenPairResponseDto;
}
