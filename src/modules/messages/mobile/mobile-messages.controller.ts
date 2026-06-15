import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageActionResponseDto } from './dto/message-action-response.dto';
import { MessageIdParamDto } from './dto/message-id-param.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MobileMessagesService } from './mobile-messages.service';

@ApiTags('Mobile — Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/workspaces/:workspaceId/channels/:channelId/messages')
export class MobileMessagesController {
  constructor(private readonly mobileMessagesService: MobileMessagesService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Not allowed to send to this channel',
  })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @ApiResponse({ status: 422, description: 'Channel archived' })
  createMessage(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.mobileMessagesService.createMessage(
      user.id,
      params.workspaceId,
      params.channelId,
      dto,
    );
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'List channel messages in oldest-first order' })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a channel member' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @ApiResponse({ status: 422, description: 'Channel archived' })
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
    @Query() query: MessageQueryDto,
  ): Promise<MessageResponseDto[]> {
    return this.mobileMessagesService.listMessages(
      user.id,
      params.workspaceId,
      params.channelId,
      query,
    );
  }

  @Patch(':messageId')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'Edit your own channel message' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot edit this message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 422, description: 'Channel archived' })
  updateMessage(
    @CurrentUser() user: AuthUser,
    @Param() params: MessageIdParamDto,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.mobileMessagesService.updateMessage(
      user.id,
      params.workspaceId,
      params.channelId,
      params.messageId,
      dto,
    );
  }

  @Delete(':messageId')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete your own channel message' })
  @ApiResponse({ status: 200, type: MessageActionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot delete this message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 422, description: 'Channel archived' })
  deleteMessage(
    @CurrentUser() user: AuthUser,
    @Param() params: MessageIdParamDto,
  ): Promise<MessageActionResponseDto> {
    return this.mobileMessagesService.deleteMessage(
      user.id,
      params.workspaceId,
      params.channelId,
      params.messageId,
    );
  }
}
