import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class MessageAttachmentInputDto {
  @ApiProperty({
    description: 'Stored file name returned by upload API',
    example: '0d6f9e5a-f7f1-4c5e-9192-2d5c7b5d2d23.webp',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[^/\\]+$/, {
    message: 'fileName must not contain path separators',
  })
  @Expose()
  fileName!: string;

  @ApiProperty({
    description: 'Original uploaded file name',
    example: 'design.png',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Expose()
  originalName!: string;

  @ApiProperty({
    description: 'Relative file path returned by upload API',
    example: 'images/0d6f9e5a-f7f1-4c5e-9192-2d5c7b5d2d23.webp',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^(images|files)\/[^/\\]+$/, {
    message: 'relativePath must start with images/ or files/',
  })
  @Expose()
  relativePath!: string;

  @ApiProperty({
    description: 'Stored content type',
    example: 'image/webp',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Expose()
  contentType!: string;

  @ApiProperty({
    description: 'Original file mime type',
    example: 'image/png',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Expose()
  mimeType!: string;

  @ApiProperty({
    description: 'Stored file size in bytes',
    example: 28412,
  })
  @IsInt()
  @Min(1)
  @Expose()
  size!: number;

  @ApiProperty({
    description: 'Whether optimization was applied during upload',
    example: true,
  })
  @IsBoolean()
  @Expose()
  optimized!: boolean;
}
