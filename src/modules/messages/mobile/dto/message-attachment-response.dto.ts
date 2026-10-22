import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MessageAttachmentResponseDto {
  @ApiProperty({
    description: 'Attachment ID',
    example: '550e8400-e29b-41d4-a716-446655440099',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Stored file name',
    example: '0d6f9e5a-f7f1-4c5e-9192-2d5c7b5d2d23.webp',
  })
  @Expose()
  fileName!: string;

  @ApiProperty({
    description: 'Original uploaded file name',
    example: 'design.png',
  })
  @Expose()
  originalName!: string;

  @ApiProperty({
    description: 'Relative file path',
    example: 'images/0d6f9e5a-f7f1-4c5e-9192-2d5c7b5d2d23.webp',
  })
  @Expose()
  relativePath!: string;

  @ApiProperty({
    description: 'Stored content type',
    example: 'image/webp',
  })
  @Expose()
  contentType!: string;

  @ApiProperty({
    description: 'Original mime type',
    example: 'image/png',
  })
  @Expose()
  mimeType!: string;

  @ApiProperty({
    description: 'Stored size in bytes',
    example: 28412,
  })
  @Expose()
  size!: number;

  @ApiProperty({
    description: 'Whether optimization was applied',
    example: true,
  })
  @Expose()
  optimized!: boolean;
}
