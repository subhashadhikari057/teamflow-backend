import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { WorkspaceRoles } from '../../../common/decorators/workspace-roles.decorator';
import { ChannelMemberGuard } from '../../../common/guards/channel-member.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../../../common/guards/workspace-role.guard';
import type { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { ChannelIdParamDto } from '../../channels/mobile/dto/channel-id-param.dto';
import { MessageIdParamDto } from './dto/message-id-param.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { MobileMessagesService } from './mobile-messages.service';

@ApiTags('Mobile — Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/workspaces/:workspaceId/channels/:channelId')
export class MobileChannelPinsController {
  constructor(private readonly mobileMessagesService: MobileMessagesService) {}

  @Post('messages/:messageId/pin')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pin a channel message' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a channel member' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 422, description: 'Channel archived' })
  pinMessage(
    @CurrentUser() user: AuthUser,
    @Param() params: MessageIdParamDto,
  ): Promise<MessageResponseDto> {
    return this.mobileMessagesService.pinMessage(
      user.id,
      params.workspaceId,
      params.channelId,
      params.messageId,
    );
  }

  @Delete('messages/:messageId/pin')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpin a channel message' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a channel member' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 422, description: 'Channel archived' })
  unpinMessage(
    @CurrentUser() user: AuthUser,
    @Param() params: MessageIdParamDto,
  ): Promise<MessageResponseDto> {
    return this.mobileMessagesService.unpinMessage(
      user.id,
      params.workspaceId,
      params.channelId,
      params.messageId,
    );
  }

  @Get('pins')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'List pinned messages for a channel' })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a channel member' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  listPinnedMessages(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
  ): Promise<MessageResponseDto[]> {
    return this.mobileMessagesService.listPinnedMessages(
      user.id,
      params.workspaceId,
      params.channelId,
    );
  }
}
