import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspacePlan } from '@prisma/client';
import { Expose } from 'class-transformer';

export class WorkspaceResponseDto {
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

  @ApiProperty({ description: 'Whether the workspace is verified', example: false })
  @Expose()
  isVerified: boolean;

  @ApiProperty({ description: 'Number of active members in the workspace', example: 5 })
  @Expose()
  memberCount: number;

  @ApiProperty({ description: 'Date the workspace was created', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;
}
