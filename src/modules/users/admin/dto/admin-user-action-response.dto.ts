import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AdminUserActionResponseDto {
  @ApiProperty({
    description: 'Action result message',
    example: 'User activated successfully',
  })
  @Expose()
  message!: string;

  @ApiProperty({
    description: 'Affected user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  userId!: string;

  @ApiProperty({
    description: 'Whether the user is active',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiPropertyOptional({
    description: 'Soft delete timestamp if deleted',
    example: '2026-06-10T19:00:00.000Z',
  })
  @Expose()
  deletedAt?: Date | null;
}
