import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AdminGetUserParamDto {
  @ApiProperty({
    description: 'User ID',
  })
  @IsUUID()
  id!: string;
}
