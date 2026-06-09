import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email or username used to log in',
    example: 'alex@teamflow.app',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  identifier!: string;

  @ApiProperty({
    description: 'User password',
    example: 'SuperSecret123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
