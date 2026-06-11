import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WorkspaceMemberActionResponseDto {
  @ApiProperty({
    description: 'Result message describing the outcome of the member action',
    example: 'Member removed successfully.',
  })
  @Expose()
  message: string;
}
