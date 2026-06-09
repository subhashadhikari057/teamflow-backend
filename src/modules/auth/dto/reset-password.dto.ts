import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
  })
  @IsString()
  @MinLength(10)
  token!: string;

  @ApiProperty({
    description: 'New password to set',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword!: string;
}
