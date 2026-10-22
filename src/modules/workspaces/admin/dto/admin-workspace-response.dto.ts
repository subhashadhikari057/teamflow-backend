import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspacePlan } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class AdminWorkspaceCreatorDto {
  @ApiProperty({ description: 'Unique identifier of the creator', example: 'clx1y2z3a0000abc123def456' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Full name of the creator', example: 'Alice Smith' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Username of the creator', example: 'alice.smith' })
  @Expose()
  username: string;

  @ApiProperty({ description: 'Email address of the creator', example: 'alice@example.com' })
  @Expose()
  email: string;
}

export class AdminWorkspaceResponseDto {
  @ApiProperty({ description: 'Unique identifier of the workspace', example: 'clx1y2z3a0000abc123def456' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Name of the workspace', example: 'Acme Corp' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug for the workspace', example: 'acme-corp' })
  @Expose()
  slug: string;

  @ApiPropertyOptional({ description: 'URL of the workspace logo', example: 'https://example.com/logo.png', nullable: true })
  @Expose()
  logoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Description of the workspace', example: 'Our company workspace', nullable: true })
  @Expose()
  description?: string | null;

  @ApiProperty({ description: 'Subscription plan of the workspace', enum: WorkspacePlan, example: WorkspacePlan.FREE })
  @Expose()
  plan: WorkspacePlan;

  @ApiProperty({ description: 'Whether the workspace is active', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Whether the workspace is verified', example: false })
  @Expose()
  isVerified: boolean;

  @ApiProperty({ description: 'Maximum number of members allowed', example: 10 })
  @Expose()
  maxMembers: number;

  @ApiProperty({ description: 'Number of active members in the workspace', example: 5 })
  @Expose()
  memberCount: number;

  @ApiProperty({ description: 'Number of pending invites', example: 2 })
  @Expose()
  inviteCount: number;

  @ApiProperty({ description: 'User who created the workspace', type: AdminWorkspaceCreatorDto })
  @Type(() => AdminWorkspaceCreatorDto)
  @Expose()
  createdBy: AdminWorkspaceCreatorDto;

  @ApiProperty({ description: 'Date the workspace was created', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Date the workspace was soft-deleted', example: null, nullable: true })
  @Expose()
  deletedAt?: Date | null;
}
