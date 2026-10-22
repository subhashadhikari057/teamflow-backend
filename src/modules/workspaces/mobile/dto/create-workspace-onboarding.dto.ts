import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class WorkspaceOnboardingInviteItemDto {
  @ApiProperty({
    description: 'Email address to invite during onboarding',
    example: 'alice@example.com',
  })
  @IsEmail()
  email!: string;
}

export class CreateWorkspaceOnboardingDto {
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
  name!: string;

  @ApiPropertyOptional({
    description: 'Description of the workspace',
    example: 'Our company workspace for all projects',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Workspace logo path or URL',
    example: 'images/ba3b4bdf-9ba8-4ff0-a40e-5a10acce84c2.webp',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Invitees to add during onboarding',
    type: [WorkspaceOnboardingInviteItemDto],
    example: [{ email: 'alice@example.com' }, { email: 'bob@example.com' }],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => WorkspaceOnboardingInviteItemDto)
  invites?: WorkspaceOnboardingInviteItemDto[];

  @ApiPropertyOptional({
    description: 'Role assigned to onboarding invitees',
    enum: WorkspaceRole,
    example: WorkspaceRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  inviteRole?: WorkspaceRole = WorkspaceRole.MEMBER;
}
