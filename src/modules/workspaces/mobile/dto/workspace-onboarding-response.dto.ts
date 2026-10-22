import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { WorkspaceInviteResponseDto } from './invite-response.dto';
import { WorkspaceResponseDto } from './workspace-response.dto';

export class WorkspaceOnboardingResponseDto {
  @ApiProperty({
    description: 'Created workspace details',
    type: WorkspaceResponseDto,
  })
  @Expose()
  @Type(() => WorkspaceResponseDto)
  workspace!: WorkspaceResponseDto;

  @ApiProperty({
    description: 'Invites created during onboarding',
    type: [WorkspaceInviteResponseDto],
  })
  @Expose()
  @Type(() => WorkspaceInviteResponseDto)
  invites!: WorkspaceInviteResponseDto[];
}
