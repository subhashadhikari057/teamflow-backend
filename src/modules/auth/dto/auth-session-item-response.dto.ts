import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthSessionItemResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  isCurrent!: boolean;

  @ApiPropertyOptional()
  @Expose()
  deviceToken?: string | null;

  @ApiPropertyOptional()
  @Expose()
  deviceType?: string | null;

  @ApiPropertyOptional()
  @Expose()
  deviceName?: string | null;

  @ApiPropertyOptional()
  @Expose()
  ipAddress?: string | null;

  @ApiPropertyOptional()
  @Expose()
  userAgent?: string | null;

  @ApiPropertyOptional()
  @Expose()
  location?: string | null;

  @ApiProperty()
  @Expose()
  lastActiveAt!: Date;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  expiresAt!: Date;
}
