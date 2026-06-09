import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Verification token received over email',
  })
  @IsString()
  @MinLength(10)
  token!: string;
}
