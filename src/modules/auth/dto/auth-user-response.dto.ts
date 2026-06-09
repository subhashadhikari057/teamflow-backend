import { GlobalRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthUserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'subhashadhikari057@gmail.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Public username',
    example: 'seenu.subhash',
  })
  @Expose()
  username!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'Subhash Adhikari',
  })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL',
    example: 'https://cdn.teamflow.app/avatars/subhash.png',
  })
  @Expose()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+9779827828632',
  })
  @Expose()
  phone?: string;

  @ApiProperty({
    description: 'Global role assigned to the user',
    enum: GlobalRole,
    example: GlobalRole.USER,
  })
  @Expose()
  role!: GlobalRole;

  @ApiProperty({
    description: 'Whether the email has been verified',
    example: false,
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
    example: '2026-06-09T17:00:00.000Z',
  })
  @Expose()
  lastSeenAt?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-06-09T16:30:00.000Z',
  })
  @Expose()
  createdAt!: Date;
}
