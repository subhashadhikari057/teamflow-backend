import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Valid refresh token',
  })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
