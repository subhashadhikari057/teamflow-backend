import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class WorkspaceRoomActionDto {
  @ApiProperty({
    description: 'Workspace ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @Expose()
  workspaceId!: string;
}
