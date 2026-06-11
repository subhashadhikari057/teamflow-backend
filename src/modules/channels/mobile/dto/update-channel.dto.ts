import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateChannelDto {
  @ApiPropertyOptional({
    description: 'Updated channel name; it will be normalized to lowercase hyphen format',
    example: 'engineering-team',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Expose()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated channel description',
    example: 'Engineering team updates',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated channel topic',
    example: 'Platform updates and discussion',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Expose()
  topic?: string;

  @ApiPropertyOptional({
    description: 'Whether only admins can post in the channel',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  isReadOnly?: boolean;
}
