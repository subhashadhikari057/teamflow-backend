import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { WorkspaceRole } from '@prisma/client';
import type { Request } from 'express';
import { WorkspaceMembersRepository } from '../../modules/workspaces/repositories/workspace-members.repository';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';
import { AppException } from '../exceptions/app.exception';
import type { AuthUser } from '../interfaces/auth-user.interface';
import { WORKSPACES_ERROR_CODES } from '../../modules/workspaces/workspaces.types';

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  GUEST: 1,
};

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workspaceMembersRepository: WorkspaceMembersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      WorkspaceRole[] | undefined
    >(WORKSPACE_ROLES_KEY, [context.getHandler(), context.getClass()]);

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser; workspaceMember?: unknown }>();

    const user = request.user as AuthUser;
    const rawWorkspaceId = request.params['workspaceId'];
    const workspaceId = Array.isArray(rawWorkspaceId)
      ? rawWorkspaceId[0]
      : rawWorkspaceId;

    if (!workspaceId) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.WORKSPACE_NOT_FOUND,
        'Workspace ID is missing from the request',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const member =
      await this.workspaceMembersRepository.findByWorkspaceAndUserRaw(
        workspaceId,
        user.id,
      );

    if (!member || !member.isActive) {
      throw new AppException(
        WORKSPACES_ERROR_CODES.MEMBER_NOT_FOUND,
        'You are not an active member of this workspace',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const userLevel = ROLE_HIERARCHY[member.role];
      const minRequiredLevel = Math.min(
        ...requiredRoles.map((r) => ROLE_HIERARCHY[r]),
      );

      if (userLevel < minRequiredLevel) {
        throw new AppException(
          WORKSPACES_ERROR_CODES.INSUFFICIENT_ROLE,
          'You do not have the required role for this action',
          { status: HttpStatus.FORBIDDEN },
        );
      }
    }

    request['workspaceMember'] = member;
    return true;
  }
}
