import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
} from 'class-validator';

export class InviteMembersDto {
  @ApiProperty({
    description: 'List of email addresses to invite',
    example: ['alice@example.com', 'bob@example.com'],
    type: [String],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  @Expose()
  emails: string[];

  @ApiProperty({
    description: 'Role to assign to the invited members',
    enum: WorkspaceRole,
    example: WorkspaceRole.MEMBER,
  })
  @IsEnum(WorkspaceRole)
  @Expose()
  role: WorkspaceRole;
}
