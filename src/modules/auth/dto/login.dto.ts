import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email or username used to log in',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  identifier!: string;

  @ApiProperty({
    description: 'User password',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
