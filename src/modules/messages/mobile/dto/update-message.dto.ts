import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({
    description: 'Updated message content',
    example: 'Hey team, standup starts in 5 minutes.',
    minLength: 1,
    maxLength: 4000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @Expose()
  content!: string;
}
