import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { SessionClientMetadataDto } from './session-client-metadata.dto';

export class LoginDto extends SessionClientMetadataDto {
  @ApiProperty({
    description: 'Email or username used to log in',
    example: 'subhashadhikari057@gmail.com',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  identifier!: string;

  @ApiProperty({
    description: 'User password',
    example: 'Subhash@123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
