import { ApiProperty } from '@nestjs/swagger';
import { InviteStatus, WorkspaceRole } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class WorkspaceInviterDto {
  @ApiProperty({ description: 'Unique identifier of the inviter', example: 'clx1y2z3a0000abc123def456' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Full name of the inviter', example: 'Alice Smith' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Username of the inviter', example: 'alice.smith' })
  @Expose()
  username: string;
}

export class WorkspaceInviteResponseDto {
  @ApiProperty({ description: 'Unique identifier of the invite', example: 'clx1y2z3a0000abc123def456' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Email address of the invitee', example: 'bob@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Role assigned to the invitee upon acceptance', enum: WorkspaceRole, example: WorkspaceRole.MEMBER })
  @Expose()
  role: WorkspaceRole;

  @ApiProperty({ description: 'Current status of the invite', enum: InviteStatus, example: InviteStatus.PENDING })
  @Expose()
  status: InviteStatus;

  @ApiProperty({ description: 'User who sent the invite', type: WorkspaceInviterDto })
  @Type(() => WorkspaceInviterDto)
  @Expose()
  invitedBy: WorkspaceInviterDto;

  @ApiProperty({ description: 'Date when the invite expires', example: '2024-02-01T00:00:00.000Z' })
  @Expose()
  expiresAt: Date;

  @ApiProperty({ description: 'Number of times the invite has been resent', example: 0 })
  @Expose()
  resendCount: number;

  @ApiProperty({ description: 'Date the invite was created', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;
}
