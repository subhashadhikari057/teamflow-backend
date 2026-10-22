import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class WorkspaceMemberParamDto {
  @ApiProperty({ description: 'Unique identifier of the workspace', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @Expose()
  workspaceId: string;

  @ApiProperty({ description: 'Unique identifier of the user', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @Expose()
  userId: string;
}
