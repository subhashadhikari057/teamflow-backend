import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email address for the account',
    example: 'subhashadhikari057@gmail.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Public username',
    example: 'seenu.subhash',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'username may only contain letters, numbers, underscores, and dots',
  })
  username!: string;

  @ApiProperty({
    description: 'User password',
    example: 'Subhash@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'Subhash Adhikari',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional phone number',
    example: '+9779827828632',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
