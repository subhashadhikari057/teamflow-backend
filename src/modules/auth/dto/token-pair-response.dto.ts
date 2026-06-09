import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TokenPairResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access',
  })
  @Expose()
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
  })
  @Expose()
  refreshToken!: string;

  @ApiProperty({
    description: 'Access token expiration string',
    example: '7d',
  })
  @Expose()
  accessTokenExpiresIn!: string;

  @ApiProperty({
    description: 'Refresh token expiration string',
    example: '30d',
  })
  @Expose()
  refreshTokenExpiresIn!: string;
}
