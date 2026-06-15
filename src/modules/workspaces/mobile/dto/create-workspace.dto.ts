import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
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
    description: 'Workspace logo path or URL',
    example: 'images/ba3b4bdf-9ba8-4ff0-a40e-5a10acce84c2.webp',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Expose()
  logoUrl?: string;
}
