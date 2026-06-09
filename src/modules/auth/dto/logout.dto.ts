import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description: 'Refresh token to revoke on logout',
  })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
