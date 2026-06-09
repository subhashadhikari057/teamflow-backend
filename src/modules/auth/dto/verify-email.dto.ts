import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Verification token received over email',
    example: '1b2787a087d04f2ead08e5c8f38bc753',
  })
  @IsString()
  @MinLength(10)
  token!: string;
}
