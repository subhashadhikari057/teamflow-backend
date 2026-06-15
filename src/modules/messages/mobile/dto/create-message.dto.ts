import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MessageAttachmentInputDto } from './message-attachment-input.dto';

export class CreateMessageDto {
  @ApiPropertyOptional({
    description: 'Message content',
    example: 'Hey team, standup starts in 10 minutes.',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  @Expose()
  content?: string;

  @ApiPropertyOptional({
    description: 'Uploaded file attachments for this message',
    type: [MessageAttachmentInputDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentInputDto)
  @Expose()
  attachments?: MessageAttachmentInputDto[];
}
