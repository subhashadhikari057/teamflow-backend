import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { Expose } from 'class-transformer';

export class WorkspaceMemberResponseDto {
  @ApiProperty({ description: 'Unique identifier of the membership record', example: 'clx1y2z3a0000abc123def456' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Unique identifier of the user', example: 'clx1y2z3a0000abc123def457' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Full name of the member', example: 'Alice Smith' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Username of the member', example: 'alice.smith' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ description: 'URL of the member avatar', example: 'https://example.com/avatar.png', nullable: true })
  @Expose()
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Role of the member in the workspace', enum: WorkspaceRole, example: WorkspaceRole.MEMBER })
  @Expose()
  role: WorkspaceRole;

  @ApiPropertyOptional({ description: 'Job title of the member', example: 'Software Engineer', nullable: true })
  @Expose()
  jobTitle?: string | null;

  @ApiPropertyOptional({ description: 'Department the member belongs to', example: 'Engineering', nullable: true })
  @Expose()
  department?: string | null;

  @ApiProperty({ description: 'Date the member joined the workspace', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  joinedAt: Date;
}
