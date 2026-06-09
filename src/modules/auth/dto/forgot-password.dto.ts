import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the account',
    example: 'alex@teamflow.app',
  })
  @IsEmail()
  email!: string;
}
