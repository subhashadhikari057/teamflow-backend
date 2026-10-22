import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UploadImageFileNameParamDto {
  @ApiProperty({
    description: 'Stored image file name',
    example: '0d6f9e5a-f7f1-4c5e-9192-2d5c7b5d2d23.webp',
  })
  @IsString()
  @MinLength(1)
  fileName: string;
}
