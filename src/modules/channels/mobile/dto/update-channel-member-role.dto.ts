import { ApiProperty } from '@nestjs/swagger';
import { ChannelMemberRole } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class UpdateChannelMemberRoleDto {
  @ApiProperty({
    description: 'Updated channel member role',
    enum: ChannelMemberRole,
    example: ChannelMemberRole.ADMIN,
  })
  @IsEnum(ChannelMemberRole)
  @Expose()
  role!: ChannelMemberRole;
}
