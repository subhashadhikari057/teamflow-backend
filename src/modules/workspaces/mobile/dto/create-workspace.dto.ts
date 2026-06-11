import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Name of the workspace',
    example: 'Acme Corp',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the workspace',
    example: 'Our company workspace for all projects',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL of the workspace logo',
    example: 'https://example.com/logo.png',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl()
  @Expose()
  logoUrl?: string;
}
