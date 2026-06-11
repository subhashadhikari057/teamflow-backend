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
import { Public } from '../../../common/decorators/public.decorator';
import { WorkspaceRoles } from '../../../common/decorators/workspace-roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../../../common/guards/workspace-role.guard';
import type { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { DeclineInviteDto } from './dto/decline-invite.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
import { WorkspaceInviteResponseDto } from './dto/invite-response.dto';
import { WorkspaceMemberResponseDto } from './dto/member-response.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceIdParamDto } from './dto/workspace-id-param.dto';
import { WorkspaceInviteParamDto } from './dto/workspace-invite-param.dto';
import { WorkspaceMemberParamDto } from './dto/workspace-member-param.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { MobileWorkspacesService } from './mobile-workspaces.service';

@ApiTags('Mobile — Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/workspaces')
export class MobileWorkspacesController {
  constructor(private readonly mobileWorkspacesService: MobileWorkspacesService) {}

  // ─── Static routes (must come before parameterized) ──────────────────────────

  @Get('suggested-channels')
  @Public()
  @ApiOperation({ summary: 'Get suggested channel names for new workspaces' })
  @ApiResponse({ status: 200, type: [String] })
  getSuggestedChannels(): string[] {
    return this.mobileWorkspacesService.getSuggestedChannels();
  }

  @Post('invites/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a workspace invite' })
  @ApiResponse({ status: 200, type: WorkspaceResponseDto, description: 'Invite accepted, workspace returned' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 422, description: 'Invite already processed / expired / email mismatch' })
  acceptInvite(
    @CurrentUser() user: AuthUser,
    @Body() dto: AcceptInviteDto,
  ): Promise<WorkspaceResponseDto> {
    return this.mobileWorkspacesService.acceptInvite(user.id, user.email, dto);
  }

  @Post('invites/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a workspace invite' })
  @ApiResponse({ status: 200, description: 'Invite declined' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 422, description: 'Invite already processed / expired' })
  declineInvite(
    @CurrentUser() user: AuthUser,
    @Body() dto: DeclineInviteDto,
  ): Promise<{ message: string }> {
    return this.mobileWorkspacesService.declineInvite(user.id, user.email, dto);
  }

  // ─── Workspace CRUD ───────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, type: WorkspaceResponseDto, description: 'Workspace created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createWorkspace(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.mobileWorkspacesService.createWorkspace(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List workspaces the current user is a member of' })
  @ApiResponse({ status: 200, type: [WorkspaceResponseDto], description: 'List of workspaces' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listWorkspaces(@CurrentUser() user: AuthUser): Promise<WorkspaceResponseDto[]> {
    return this.mobileWorkspacesService.listWorkspaces(user.id);
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'Get a single workspace by ID' })
  @ApiResponse({ status: 200, type: WorkspaceResponseDto, description: 'Workspace details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  getWorkspace(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceIdParamDto,
  ): Promise<WorkspaceResponseDto> {
    return this.mobileWorkspacesService.getWorkspace(user.id, params.workspaceId);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update workspace details' })
  @ApiResponse({ status: 200, type: WorkspaceResponseDto, description: 'Updated workspace' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  updateWorkspace(
    @Param() params: WorkspaceIdParamDto,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.mobileWorkspacesService.updateWorkspace(params.workspaceId, dto);
  }

  @Delete(':workspaceId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workspace (owner only)' })
  @ApiResponse({ status: 204, description: 'Workspace deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 422, description: 'Active members exist' })
  deleteWorkspace(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceIdParamDto,
  ): Promise<void> {
    return this.mobileWorkspacesService.deleteWorkspace(user.id, params.workspaceId);
  }

  // ─── Invites ─────────────────────────────────────────────────────────────────

  @Post(':workspaceId/invites')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Invite members to the workspace' })
  @ApiResponse({ status: 201, type: [WorkspaceInviteResponseDto], description: 'Invites created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 422, description: 'Member limit reached' })
  inviteMembers(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceIdParamDto,
    @Body() dto: InviteMembersDto,
  ): Promise<WorkspaceInviteResponseDto[]> {
    return this.mobileWorkspacesService.inviteMembers(user.id, params.workspaceId, dto);
  }

  @Get(':workspaceId/invites')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'List pending invites for a workspace' })
  @ApiResponse({ status: 200, type: [WorkspaceInviteResponseDto], description: 'List of pending invites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  listInvites(
    @Param() params: WorkspaceIdParamDto,
  ): Promise<WorkspaceInviteResponseDto[]> {
    return this.mobileWorkspacesService.listInvites(params.workspaceId);
  }

  @Delete(':workspaceId/invites/:inviteId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a pending invite' })
  @ApiResponse({ status: 204, description: 'Invite revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 422, description: 'Invite already processed' })
  revokeInvite(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceInviteParamDto,
  ): Promise<void> {
    return this.mobileWorkspacesService.revokeInvite(user.id, params.workspaceId, params.inviteId);
  }

  @Post(':workspaceId/invites/:inviteId/resend')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend a pending invite' })
  @ApiResponse({ status: 200, type: WorkspaceInviteResponseDto, description: 'Invite resent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 422, description: 'Invite already processed' })
  resendInvite(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceInviteParamDto,
  ): Promise<WorkspaceInviteResponseDto> {
    return this.mobileWorkspacesService.resendInvite(user.id, params.workspaceId, params.inviteId);
  }

  // ─── Members ─────────────────────────────────────────────────────────────────

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'List members of a workspace' })
  @ApiResponse({ status: 200, type: [WorkspaceMemberResponseDto], description: 'List of members' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this workspace' })
  listMembers(
    @Param() params: WorkspaceIdParamDto,
  ): Promise<WorkspaceMemberResponseDto[]> {
    return this.mobileWorkspacesService.listMembers(params.workspaceId);
  }

  @Patch(':workspaceId/members/me')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @ApiOperation({ summary: 'Update own workspace membership profile' })
  @ApiResponse({ status: 200, type: WorkspaceMemberResponseDto, description: 'Updated membership' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this workspace' })
  @ApiResponse({ status: 404, description: 'Membership not found' })
  updateOwnMembership(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceIdParamDto,
    @Body() dto: UpdateMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.mobileWorkspacesService.updateOwnMembership(user.id, params.workspaceId, dto);
  }

  @Patch(':workspaceId/members/:userId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update a workspace member (admin only)' })
  @ApiResponse({ status: 200, type: WorkspaceMemberResponseDto, description: 'Updated member' })
  @ApiResponse({ status: 400, description: 'Validation error or cannot update self' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceMemberParamDto,
    @Body() dto: UpdateMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.mobileWorkspacesService.updateMember(user.id, params.workspaceId, params.userId, dto);
  }

  @Delete(':workspaceId/members/:userId')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a workspace (admin only)' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient role or cannot remove owner' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  removeMember(
    @Param() params: WorkspaceMemberParamDto,
  ): Promise<void> {
    return this.mobileWorkspacesService.removeMember(params.workspaceId, params.userId);
  }

  @Post(':workspaceId/members/leave')
  @UseGuards(WorkspaceRoleGuard)
  @WorkspaceRoles(WorkspaceRole.GUEST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a workspace' })
  @ApiResponse({ status: 200, description: 'Left workspace' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this workspace' })
  @ApiResponse({ status: 404, description: 'Membership not found' })
  @ApiResponse({ status: 422, description: 'Last owner cannot leave without transferring ownership' })
  async leaveWorkspace(
    @CurrentUser() user: AuthUser,
    @Param() params: WorkspaceIdParamDto,
  ): Promise<{ message: string }> {
    await this.mobileWorkspacesService.leaveWorkspace(user.id, params.workspaceId);
    return { message: 'Left workspace' };
  }
}
