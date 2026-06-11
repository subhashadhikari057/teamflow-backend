import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({
    description: 'Channel name; it will be normalized to lowercase hyphen format',
    example: 'engineering-team',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'Channel description',
    example: 'Engineering team updates',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'Channel topic',
    example: 'Platform updates and discussion',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Expose()
  topic?: string;

  @ApiProperty({
    description: 'Channel visibility type',
    enum: ChannelType,
    example: ChannelType.PUBLIC,
  })
  @IsEnum(ChannelType)
  @Expose()
  type!: ChannelType;

  @ApiPropertyOptional({
    description: 'Whether only admins can post in the channel',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  isReadOnly?: boolean;
}
