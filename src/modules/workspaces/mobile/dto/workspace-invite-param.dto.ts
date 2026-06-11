import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class WorkspaceInviteParamDto {
  @ApiProperty({ description: 'Unique identifier of the workspace', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @Expose()
  workspaceId: string;

  @ApiProperty({ description: 'Unique identifier of the invite', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @Expose()
  inviteId: string;
}
