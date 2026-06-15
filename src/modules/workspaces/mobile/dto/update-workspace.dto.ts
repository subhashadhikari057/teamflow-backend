import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({
    description: 'Name of the workspace',
    example: 'Acme Corp',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Expose()
  name?: string;

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
    description:
      'Allowed email domain for joining the workspace. Pass null or omit to clear.',
    example: 'acme.com',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Expose()
  allowedEmailDomain?: string;
}
