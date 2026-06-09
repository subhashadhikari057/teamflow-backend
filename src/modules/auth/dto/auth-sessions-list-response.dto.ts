import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuthSessionItemResponseDto } from './auth-session-item-response.dto';

export class AuthSessionsListResponseDto {
  @ApiProperty({ type: [AuthSessionItemResponseDto] })
  @Expose()
  @Type(() => AuthSessionItemResponseDto)
  items!: AuthSessionItemResponseDto[];
}
