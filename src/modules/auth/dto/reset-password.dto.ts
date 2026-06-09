import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: '7ef0df45962b401bbb3aa4b7a42e7b3c',
  })
  @IsString()
  @MinLength(10)
  token!: string;

  @ApiProperty({
    description: 'New password to set',
    example: 'EvenMoreSecret123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword!: string;
}
