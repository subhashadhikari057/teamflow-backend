import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AuthSessionIdParamDto {
  @ApiProperty({ description: 'Session ID' })
  @IsUUID()
  id!: string;
}
