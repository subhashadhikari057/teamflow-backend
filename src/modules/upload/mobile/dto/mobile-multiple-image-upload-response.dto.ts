import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MobileImageUploadResponseDto } from './mobile-image-upload-response.dto';

export class MobileMultipleImageUploadResponseDto {
  @ApiProperty({
    description: 'Uploaded file results',
    type: [MobileImageUploadResponseDto],
  })
  @Expose()
  @Type(() => MobileImageUploadResponseDto)
  items: MobileImageUploadResponseDto[];
}
