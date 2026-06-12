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
import { ChannelMemberRole, WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { WorkspaceRoles } from '../../../common/decorators/workspace-roles.decorator';
import { ChannelMemberGuard } from '../../../common/guards/channel-member.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../../../common/guards/workspace-role.guard';
import type { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { WorkspaceIdParamDto } from '../../workspaces/mobile/dto/workspace-id-param.dto';
import { MobileChannelsService } from './mobile-channels.service';
import { AddChannelMemberDto } from './dto/add-channel-member.dto';
import { ChannelDetailQueryDto } from './dto/channel-detail-query.dto';
import { ChannelActionResponseDto } from './dto/channel-action-response.dto';
import { ChannelIdParamDto } from './dto/channel-id-param.dto';
import { ChannelMemberParamDto } from './dto/channel-member-param.dto';
import { ChannelMemberResponseDto } from './dto/channel-member-response.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelMemberRoleDto } from './dto/update-channel-member-role.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@ApiTags('Mobile — Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/workspaces/:workspaceId/channels')
export class MobileChannelsController {
  constructor(private readonly mobileChannelsService: MobileChannelsService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a channel in the workspace' })
  @ApiResponse({ status: 201, type: ChannelResponseDto })
  createChannel(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceIdParamDto,
    @Body() dto: CreateChannelDto,
  ): Promise<ChannelResponseDto> {
    return this.mobileChannelsService.createChannel(user.id, params.workspaceId, dto);
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'List channels in the workspace' })
  @ApiResponse({ status: 200, type: [ChannelResponseDto] })
  listChannels(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceIdParamDto,
  ): Promise<ChannelResponseDto[]> {
    return this.mobileChannelsService.listChannels(user.id, params.workspaceId);
  }

  @Get(':channelId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'Get a channel detail' })
  @ApiResponse({ status: 200, type: ChannelResponseDto })
  getChannel(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
    @Query() query: ChannelDetailQueryDto,
  ): Promise<ChannelResponseDto> {
    return this.mobileChannelsService.getChannel(
      user.id,
      params.workspaceId,
      params.channelId,
      query,
    );
  }

  @Patch(':channelId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update a channel' })
  @ApiResponse({ status: 200, type: ChannelResponseDto })
  updateChannel(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
    @Body() dto: UpdateChannelDto,
  ): Promise<ChannelResponseDto> {
    return this.mobileChannelsService.updateChannel(user.id, params.workspaceId, params.channelId, dto);
  }

  @Delete(':channelId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a channel' })
  @ApiResponse({ status: 200, type: ChannelActionResponseDto })
  deleteChannel(
    @Param() params: ChannelIdParamDto,
  ): Promise<ChannelActionResponseDto> {
    return this.mobileChannelsService.deleteChannel(params.workspaceId, params.channelId);
  }

  @Patch(':channelId/archive')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Toggle channel archive state' })
  @ApiResponse({ status: 200, type: ChannelResponseDto })
  archiveChannel(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
  ): Promise<ChannelResponseDto> {
    return this.mobileChannelsService.toggleArchive(user.id, params.workspaceId, params.channelId);
  }

  @Post(':channelId/join')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a public channel' })
  @ApiResponse({ status: 200, type: ChannelMemberResponseDto })
  joinChannel(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
  ): Promise<ChannelMemberResponseDto> {
    return this.mobileChannelsService.joinChannel(user.id, params.workspaceId, params.channelId);
  }

  @Post(':channelId/leave')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a channel' })
  @ApiResponse({ status: 200, type: ChannelActionResponseDto })
  leaveChannel(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
  ): Promise<ChannelActionResponseDto> {
    return this.mobileChannelsService.leaveChannel(user.id, params.workspaceId, params.channelId);
  }

  @Post(':channelId/members')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a member to a private channel' })
  @ApiResponse({ status: 200, type: ChannelMemberResponseDto })
  addMember(
    @Param() params: ChannelIdParamDto,
    @Body() dto: AddChannelMemberDto,
  ): Promise<ChannelMemberResponseDto> {
    return this.mobileChannelsService.addMember(params.workspaceId, params.channelId, dto);
  }

  @Get(':channelId/members')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'List channel members' })
  @ApiResponse({ status: 200, type: [ChannelMemberResponseDto] })
  listMembers(
    @Param() params: ChannelIdParamDto,
  ): Promise<ChannelMemberResponseDto[]> {
    return this.mobileChannelsService.listMembers(params.workspaceId, params.channelId);
  }

  @Patch(':channelId/members/:userId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update a channel member role' })
  @ApiResponse({ status: 200, type: ChannelMemberResponseDto })
  updateMemberRole(
    @Param() params: ChannelMemberParamDto,
    @Body() dto: UpdateChannelMemberRoleDto,
  ): Promise<ChannelMemberResponseDto> {
    return this.mobileChannelsService.updateMemberRole(
      params.workspaceId,
      params.channelId,
      params.userId,
      dto,
    );
  }

  @Delete(':channelId/members/:userId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from a channel' })
  @ApiResponse({ status: 200, type: ChannelActionResponseDto })
  removeMember(
    @Param() params: ChannelMemberParamDto,
  ): Promise<ChannelActionResponseDto> {
    return this.mobileChannelsService.removeMember(
      params.workspaceId,
      params.channelId,
      params.userId,
    );
  }

  @Patch(':channelId/members/me/archive')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'Toggle current user archive state for a channel' })
  @ApiResponse({ status: 200, type: ChannelActionResponseDto })
  archiveForMe(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
  ): Promise<ChannelActionResponseDto> {
    return this.mobileChannelsService.toggleArchivedForMe(
      user.id,
      params.workspaceId,
      params.channelId,
    );
  }

  @Patch(':channelId/read')
  @UseGuards(WorkspaceRoleGuard, ChannelMemberGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'Mark a channel as read' })
  @ApiResponse({ status: 200, type: ChannelActionResponseDto })
  markRead(
    @CurrentUser() user: AuthUser,
    @Param() params: ChannelIdParamDto,
  ): Promise<ChannelActionResponseDto> {
    return this.mobileChannelsService.markRead(user.id, params.workspaceId, params.channelId);
  }
}
