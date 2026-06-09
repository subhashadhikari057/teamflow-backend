import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email to resend verification to',
    example: 'alex@teamflow.app',
  })
  @IsEmail()
  email!: string;
}
