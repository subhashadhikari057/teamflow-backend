import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AdminUserResponseDto } from './admin-user-response.dto';

export class AdminUsersListResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: [AdminUserResponseDto],
  })
  @Expose()
  @Type(() => AdminUserResponseDto)
  items!: AdminUserResponseDto[];

  @ApiProperty({
    description: 'Total matching users',
    example: 42,
  })
  @Expose()
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  @Expose()
  page!: number;

  @ApiProperty({
    description: 'Page size',
    example: 20,
  })
  @Expose()
  limit!: number;
}
