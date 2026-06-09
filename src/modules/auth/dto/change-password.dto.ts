import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'SuperSecret123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  currentPassword!: string;

  @ApiProperty({
    description: 'New password to set',
    example: 'EvenMoreSecret123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword!: string;
}
