import { HttpStatus, Injectable } from '@nestjs/common';
import { InviteStatus, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'node:crypto';
import { appConfig } from '../../../config/app.config';
import { AppException } from '../../../common/exceptions/app.exception';
import { EmailService } from '../../../infrastructure/email/email.service';
import type {
  WorkspaceInviteWithInviter,
  WorkspaceMemberWithUser,
  WorkspaceWithCounts,
} from '../interfaces/workspaces.interface';
import { WorkspaceInvitesRepository } from '../repositories/workspace-invites.repository';
import { WorkspaceMembersRepository } from '../repositories/workspace-members.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { PLAN_MAX_MEMBERS, WORKSPACES_ERROR_CODES } from '../workspaces.types';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { DeclineInviteDto } from './dto/decline-invite.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
import { WorkspaceInviteResponseDto } from './dto/invite-response.dto';
import { WorkspaceMemberActionResponseDto } from './dto/workspace-member-action-response.dto';
import { WorkspaceMemberResponseDto } from './dto/member-response.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

@Injectable()
export class MobileWorkspacesService {
  constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly membersRepository: WorkspaceMembersRepository,
    private readonly invitesRepository: WorkspaceInvitesRepository,
    private readonly emailService: EmailService,
  ) {}

  // ─── Workspaces ──────────────────────────────────────────────────────────────

  async createWorkspace(
    userId: string,
    dto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const slug = await this.generateUniqueSlug(dto.name);

    const workspace = await this.workspacesRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      logoUrl: dto.logoUrl ?? null,
      plan: WorkspacePlan.FREE,
      maxMembers: PLAN_MAX_MEMBERS.FREE,
      isActive: true,
      isVerified: false,
      creator: { connect: { id: userId } },
    });

    await this.membersRepository.create({
      workspaceId: workspace.id,
      userId,
      role: WorkspaceRole.OWNER,
      isActive: true,
    });

    // TODO: When channels module is implemented, auto-create #general channel and add creator

    const created = await this.workspacesRepository.findById(workspace.id);
    if (!created) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found after creation',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapWorkspaceResponse(created);
  }

  async listWorkspaces(userId: string): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.workspacesRepository.findAllByUserId(userId);
    return workspaces.map((w) => this.mapWorkspaceResponse(w));
  }

  getSuggestedChannels(): string[] {
    return [
      'general',
      'marketing',
      'engineering',
      'design',
      'product',
      'random',
    ];
  }

  async getWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const member = await this.membersRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'You are not a member of this workspace',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    return this.mapWorkspaceResponse(workspace);
  }

  async updateWorkspace(
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const existing = await this.workspacesRepository.findById(workspaceId);
    if (!existing) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const updated = await this.workspacesRepository.update(workspaceId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.allowedEmailDomain !== undefined && {
        allowedEmailDomain: dto.allowedEmailDomain,
      }),
    });

    return this.mapWorkspaceResponse(updated);
  }

  async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const count = await this.membersRepository.countActiveMembers(workspaceId);
    if (count > 1) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.ACTIVE_MEMBERS_EXIST,
        'Remove all members before deleting the workspace',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    await this.workspacesRepository.softDelete(workspaceId);
  }

  // ─── Invites ─────────────────────────────────────────────────────────────────

  async inviteMembers(
    userId: string,
    workspaceId: string,
    dto: InviteMembersDto,
  ): Promise<WorkspaceInviteResponseDto[]> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const currentMember = await this.membersRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!currentMember) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'You are not a member of this workspace',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const { activeMembers, pendingInvites } =
      await this.membersRepository.countActiveAndPendingInvites(workspaceId);
    const newCount = dto.emails.length;
    if (activeMembers + pendingInvites + newCount > workspace.maxMembers) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_LIMIT_REACHED,
        `Workspace member limit of ${workspace.maxMembers} would be exceeded`,
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const createdInvites: WorkspaceInviteWithInviter[] = [];

    for (const email of dto.emails) {
      const existingInvite = await this.invitesRepository.findPendingByEmail(
        workspaceId,
        email,
      );
      if (existingInvite) {
        await this.invitesRepository.delete(existingInvite.id);
      }

      const invite = await this.invitesRepository.create({
        workspaceId,
        email,
        role: dto.role,
        token: randomUUID(),
        invitedBy: userId,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      await this.emailService.send({
        to: email,
        subject: `You've been invited to join ${workspace.name} on Teamflow`,
        text: [
          `${currentMember.user.name} invited you to join ${workspace.name}.`,
          ``,
          `Accept Invite: ${appConfig.frontendBaseUrl}/invite?token=${invite.token}`,
          ``,
          `This invite expires in 3 days.`,
          `If you don't have an account, you'll be asked to create one.`,
        ].join('\n'),
      });

      const withInviter = await this.invitesRepository.findById(invite.id);
      if (withInviter) {
        createdInvites.push(withInviter);
      }
    }

    return createdInvites.map((invite) => this.mapInviteResponse(invite));
  }

  async listInvites(
    workspaceId: string,
  ): Promise<WorkspaceInviteResponseDto[]> {
    const invites =
      await this.invitesRepository.findPendingByWorkspace(workspaceId);
    return invites.map((invite) => this.mapInviteResponse(invite));
  }

  async revokeInvite(
    userId: string,
    workspaceId: string,
    inviteId: string,
  ): Promise<void> {
    const invite = await this.invitesRepository.findById(inviteId);
    if (!invite) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (invite.workspaceId !== workspaceId) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_ALREADY_PROCESSED,
        'This invite has already been processed',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    await this.invitesRepository.update(inviteId, {
      status: InviteStatus.REVOKED,
      revokedAt: new Date(),
      revoker: { connect: { id: userId } },
    });
  }

  async resendInvite(
    userId: string,
    workspaceId: string,
    inviteId: string,
  ): Promise<WorkspaceInviteResponseDto> {
    const invite = await this.invitesRepository.findById(inviteId);
    if (!invite) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (invite.workspaceId !== workspaceId) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_ALREADY_PROCESSED,
        'This invite has already been processed',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const currentMember = await this.membersRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!currentMember) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'You are not a member of this workspace',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    await this.invitesRepository.update(inviteId, {
      resendCount: { increment: 1 },
      lastResentAt: new Date(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    await this.emailService.send({
      to: invite.email,
      subject: `You've been invited to join ${workspace.name} on Teamflow`,
      text: [
        `${currentMember.user.name} invited you to join ${workspace.name}.`,
        ``,
        `Accept Invite: ${appConfig.frontendBaseUrl}/invite?token=${invite.token}`,
        ``,
        `This invite expires in 3 days.`,
        `If you don't have an account, you'll be asked to create one.`,
      ].join('\n'),
    });

    const updated = await this.invitesRepository.findById(inviteId);
    if (!updated) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found after update',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapInviteResponse(updated);
  }

  async acceptInvite(
    userId: string,
    userEmail: string,
    dto: AcceptInviteDto,
  ): Promise<WorkspaceResponseDto> {
    const invite = await this.invitesRepository.findByToken(dto.token);
    if (!invite) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (invite.status === InviteStatus.REVOKED) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_ALREADY_PROCESSED,
        'This invite has been revoked',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_ALREADY_PROCESSED,
        'This invite has already been accepted',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    if (invite.status === InviteStatus.DECLINED) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_ALREADY_PROCESSED,
        'This invite has been declined',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    if (invite.expiresAt <= new Date()) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_EXPIRED,
        'This invite has expired',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const workspace = await this.workspacesRepository.findById(
      invite.workspaceId,
    );
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const existingMember = await this.membersRepository.findByWorkspaceAndUser(
      invite.workspaceId,
      userId,
    );
    if (existingMember) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_ALREADY_PROCESSED,
        'You are already a member of this workspace',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    await this.membersRepository.create({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      isActive: true,
    });

    await this.invitesRepository.update(invite.id, {
      status: InviteStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    // TODO: Auto-add user to #general channel when channels module is implemented

    const updated = await this.workspacesRepository.findById(invite.workspaceId);
    if (!updated) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapWorkspaceResponse(updated);
  }

  async declineInvite(
    userId: string,
    userEmail: string,
    dto: DeclineInviteDto,
  ): Promise<{ message: string }> {
    const invite = await this.invitesRepository.findByToken(dto.token);
    if (!invite) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_NOT_FOUND,
        'Invite not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_ALREADY_PROCESSED,
        'This invite has already been processed',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    if (invite.expiresAt <= new Date()) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.INVITE_EXPIRED,
        'This invite has expired',
        { status: HttpStatus.UNPROCESSABLE_ENTITY },
      );
    }

    await this.invitesRepository.update(invite.id, {
      status: InviteStatus.DECLINED,
      declinedAt: new Date(),
    });

    return { message: 'Invite declined' };
  }

  // ─── Members ─────────────────────────────────────────────────────────────────

  async listMembers(
    workspaceId: string,
  ): Promise<WorkspaceMemberResponseDto[]> {
    const members =
      await this.membersRepository.findAllByWorkspace(workspaceId);
    return members.map((member) => this.mapMemberResponse(member));
  }

  async updateOwnMembership(
    userId: string,
    workspaceId: string,
    dto: UpdateMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    const member = await this.membersRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'Membership not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const updated = await this.membersRepository.update(member.id, {
      ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
      ...(dto.department !== undefined && { department: dto.department }),
    });

    return this.mapMemberResponse(updated);
  }

  async updateMember(
    currentUserId: string,
    workspaceId: string,
    targetUserId: string,
    dto: UpdateMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    if (currentUserId === targetUserId) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.CANNOT_UPDATE_SELF,
        'Use the update own membership endpoint to update your own membership',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const currentMember = await this.membersRepository.findByWorkspaceAndUser(
      workspaceId,
      currentUserId,
    );
    if (!currentMember) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'Membership not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const targetMember = await this.membersRepository.findByWorkspaceAndUser(
      workspaceId,
      targetUserId,
    );
    if (!targetMember) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'Target member not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (
      targetMember.role === WorkspaceRole.OWNER &&
      dto.role !== undefined
    ) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.CANNOT_REMOVE_OWNER,
        'Cannot change the role of a workspace owner',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    if (dto.role === WorkspaceRole.OWNER) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.CANNOT_REMOVE_OWNER,
        'Cannot assign OWNER role directly',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const roleHierarchy: Record<WorkspaceRole, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      GUEST: 1,
    };

    if (currentMember.role === WorkspaceRole.ADMIN) {
      const targetLevel = roleHierarchy[targetMember.role];
      if (targetLevel >= roleHierarchy[WorkspaceRole.ADMIN]) {
        throw new AppException(
          WORKSPACES_ERROR_CODES.INSUFFICIENT_ROLE,
          'Admins can only update members and guests',
          { status: HttpStatus.FORBIDDEN },
        );
      }
    }

    const updated = await this.membersRepository.update(targetMember.id, {
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
      ...(dto.department !== undefined && { department: dto.department }),
    });

    return this.mapMemberResponse(updated);
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
  ): Promise<WorkspaceMemberActionResponseDto> {
    const targetMember = await this.membersRepository.findByWorkspaceAndUser(
      workspaceId,
      targetUserId,
    );
    if (!targetMember) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'Member not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (targetMember.role === WorkspaceRole.OWNER) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.CANNOT_REMOVE_OWNER,
        'Cannot remove the workspace owner',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    await this.membersRepository.deactivate(targetMember.id);

    return { message: 'Member removed successfully.' };
  }

  async leaveWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMemberActionResponseDto> {
    const member = await this.membersRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'You are not a member of this workspace',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (member.role === WorkspaceRole.ADMIN) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.ADMIN_CANNOT_LEAVE,
        'Admins cannot leave the workspace. Ask an owner to remove you or change your role first.',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    if (member.role === WorkspaceRole.OWNER) {
      const ownerCount = await this.membersRepository.countOwners(workspaceId);
      if (ownerCount === 1) {
        throw new AppException(
          WORKSPACES_ERROR_CODES.ONLY_OWNER,
          'Transfer ownership before leaving',
          { status: HttpStatus.UNPROCESSABLE_ENTITY },
        );
      }
    }

    await this.membersRepository.deactivate(member.id);

    return { message: 'Left workspace successfully.' };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private mapWorkspaceResponse(
    workspace: WorkspaceWithCounts,
  ): WorkspaceResponseDto {
    return plainToInstance(
      WorkspaceResponseDto,
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logoUrl: workspace.logoUrl,
        description: workspace.description,
        plan: workspace.plan,
        isVerified: workspace.isVerified,
        memberCount: workspace._count.members,
        createdAt: workspace.createdAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  private mapMemberResponse(
    member: WorkspaceMemberWithUser,
  ): WorkspaceMemberResponseDto {
    return plainToInstance(
      WorkspaceMemberResponseDto,
      {
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        username: member.user.username,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        jobTitle: member.jobTitle,
        department: member.department,
        joinedAt: member.joinedAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  private mapInviteResponse(
    invite: WorkspaceInviteWithInviter,
  ): WorkspaceInviteResponseDto {
    return plainToInstance(
      WorkspaceInviteResponseDto,
      {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        invitedBy: {
          id: invite.inviter.id,
          name: invite.inviter.name,
          username: invite.inviter.username,
        },
        expiresAt: invite.expiresAt,
        resendCount: invite.resendCount,
        createdAt: invite.createdAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let candidate = base;
    let counter = 1;

    while (await this.workspacesRepository.findBySlug(candidate)) {
      candidate = `${base}-${counter}`;
      counter++;
    }

    return candidate;
  }
}
