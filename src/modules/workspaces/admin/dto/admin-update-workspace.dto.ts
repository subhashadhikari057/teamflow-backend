import { ApiProperty } from '@nestjs/swagger';
import { WorkspacePlan } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class AdminUpdateWorkspacePlanDto {
  @ApiProperty({
    description: 'New subscription plan for the workspace',
    enum: WorkspacePlan,
    example: WorkspacePlan.PRO,
  })
  @IsEnum(WorkspacePlan)
  @Expose()
  plan: WorkspacePlan;
}

export class AdminWorkspaceActionResponseDto {
  @ApiProperty({ description: 'Result message describing the outcome of the action', example: 'Workspace plan updated successfully.' })
  @Expose()
  message: string;
}
