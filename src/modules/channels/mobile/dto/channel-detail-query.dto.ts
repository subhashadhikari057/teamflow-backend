import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ChannelDetailQueryDto {
  @ApiPropertyOptional({
    description: 'Include channel members in the response when true',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === '' || value === 'true')
  @IsBoolean()
  member?: boolean = false;
}
