import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalRole } from '@prisma/client';
import { Expose } from 'class-transformer';

export class AdminUserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Public username',
    example: 'john.doe',
  })
  @Expose()
  username!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
  })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'Profile avatar URL',
    example: 'https://example.com/avatar.png',
  })
  @Expose()
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+9779800000000',
  })
  @Expose()
  phone?: string | null;

  @ApiProperty({
    description: 'Global role',
    enum: GlobalRole,
    example: GlobalRole.USER,
  })
  @Expose()
  role!: GlobalRole;

  @ApiProperty({
    description: 'Whether the email is verified',
    example: true,
  })
  @Expose()
  isEmailVerified!: boolean;

  @ApiProperty({
    description: 'Whether the account is active',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiPropertyOptional({
    description: 'Last seen timestamp',
    example: '2026-06-10T17:30:00.000Z',
  })
  @Expose()
  lastSeenAt?: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-06-10T17:30:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2026-06-10T17:30:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
