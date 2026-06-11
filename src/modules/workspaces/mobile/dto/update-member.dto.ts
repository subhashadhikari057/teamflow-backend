import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({
    description: 'New role to assign to the member',
    enum: WorkspaceRole,
    example: WorkspaceRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  @Expose()
  role?: WorkspaceRole;

  @ApiPropertyOptional({
    description: 'Job title of the member',
    example: 'Software Engineer',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Expose()
  jobTitle?: string;

  @ApiPropertyOptional({
    description: 'Department the member belongs to',
    example: 'Engineering',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Expose()
  department?: string;
}
