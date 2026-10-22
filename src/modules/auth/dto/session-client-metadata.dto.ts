import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SessionClientMetadataDto {
  @ApiPropertyOptional({
    description: 'Client platform type for the session',
    example: 'web',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'Friendly device name shown in active session lists',
    example: 'Chrome on macOS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;

  @ApiPropertyOptional({
    description: 'Push notification token for the device, if available',
    example: 'fcm_device_token_123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  deviceToken?: string;
}
