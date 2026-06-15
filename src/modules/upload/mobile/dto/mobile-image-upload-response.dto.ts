import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MobileImageUploadResponseDto {
  @ApiProperty({
    description: 'Stored file name',
    example: '0d6f9e5a-f7f1-4c5e-9192-2d5c7b5d2d23.webp',
  })
  @Expose()
  fileName: string;

  @ApiProperty({
    description: 'Original uploaded file name',
    example: 'avatar.png',
  })
  @Expose()
  originalName: string;

  @ApiProperty({
    description: 'Stored file relative path',
    example: 'images/0d6f9e5a-f7f1-4c5e-9192-2d5c7b5d2d23.webp',
  })
  @Expose()
  relativePath: string;

  @ApiProperty({
    description: 'Stored content type',
    example: 'image/webp',
  })
  @Expose()
  contentType: string;

  @ApiProperty({
    description: 'Original file content type',
    example: 'image/png',
  })
  @Expose()
  mimeType: string;

  @ApiProperty({
    description: 'Saved file size in bytes',
    example: 28412,
  })
  @Expose()
  size: number;

  @ApiProperty({
    description: 'Whether image optimization was applied',
    example: true,
  })
  @Expose()
  optimized: boolean;
}
