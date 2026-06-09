import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

export class SearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by relevant text fields',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
