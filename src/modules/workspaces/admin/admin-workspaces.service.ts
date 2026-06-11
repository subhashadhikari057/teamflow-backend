import { HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AppException } from '../../../common/exceptions/app.exception';
import { WorkspaceMembersRepository } from '../repositories/workspace-members.repository';
import { WorkspacesRepository } from '../repositories/workspaces.repository';
import { PLAN_MAX_MEMBERS, WORKSPACES_ERROR_CODES } from '../workspaces.types';
import { AdminListWorkspacesQueryDto } from './dto/admin-list-workspaces-query.dto';
import {
  AdminUpdateWorkspacePlanDto,
  AdminWorkspaceActionResponseDto,
} from './dto/admin-update-workspace.dto';
import { AdminWorkspaceResponseDto } from './dto/admin-workspace-response.dto';
import type { WorkspaceWithCounts } from '../interfaces/workspaces.interface';

@Injectable()
export class AdminWorkspacesService {
  constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly membersRepository: WorkspaceMembersRepository,
  ) {}

  async listWorkspaces(
    query: AdminListWorkspacesQueryDto,
  ): Promise<AdminWorkspaceResponseDto[]> {
    const workspaces = await this.workspacesRepository.findAllCursor({
      cursor: query.cursor,
      limit: query.limit ?? 20,
      plan: query.plan,
      isActive: query.isActive,
      isVerified: query.isVerified,
    });

    return workspaces.map((w) => this.mapAdminWorkspaceResponse(w));
  }

  async getWorkspace(workspaceId: string): Promise<AdminWorkspaceResponseDto> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    return this.mapAdminWorkspaceResponse(workspace);
  }

  async verifyWorkspace(workspaceId: string): Promise<AdminWorkspaceResponseDto> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const updated = await this.workspacesRepository.update(workspaceId, {
      isVerified: !workspace.isVerified,
    });

    return this.mapAdminWorkspaceResponse(updated);
  }

  async updatePlan(
    workspaceId: string,
    dto: AdminUpdateWorkspacePlanDto,
  ): Promise<AdminWorkspaceResponseDto> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const maxMembers = PLAN_MAX_MEMBERS[dto.plan];
    const updated = await this.workspacesRepository.update(workspaceId, {
      plan: dto.plan,
      maxMembers,
    });

    return this.mapAdminWorkspaceResponse(updated);
  }

  async suspendWorkspace(workspaceId: string): Promise<AdminWorkspaceResponseDto> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const updated = await this.workspacesRepository.update(workspaceId, {
      isActive: false,
    });

    return this.mapAdminWorkspaceResponse(updated);
  }

  async activateWorkspace(workspaceId: string): Promise<AdminWorkspaceResponseDto> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const updated = await this.workspacesRepository.update(workspaceId, {
      isActive: true,
    });

    return this.mapAdminWorkspaceResponse(updated);
  }

  async deleteWorkspace(workspaceId: string): Promise<AdminWorkspaceActionResponseDto> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    await this.workspacesRepository.hardDelete(workspaceId);

    return plainToInstance(
      AdminWorkspaceActionResponseDto,
      { message: 'Workspace deleted' },
      { excludeExtraneousValues: true },
    );
  }

  private mapAdminWorkspaceResponse(
    workspace: WorkspaceWithCounts,
  ): AdminWorkspaceResponseDto {
    return plainToInstance(
      AdminWorkspaceResponseDto,
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        logoUrl: workspace.logoUrl,
        description: workspace.description,
        plan: workspace.plan,
        isActive: workspace.isActive,
        isVerified: workspace.isVerified,
        maxMembers: workspace.maxMembers,
        memberCount: workspace._count.members,
        inviteCount: workspace._count.invites,
        createdBy: workspace.creator ?? null,
        createdAt: workspace.createdAt,
        deletedAt: workspace.deletedAt,
      },
      { excludeExtraneousValues: true },
    );
  }
}
