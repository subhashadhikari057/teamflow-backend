import { Injectable } from '@nestjs/common';
import type { Prisma, WorkspaceMember } from '@prisma/client';
import { InviteStatus, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { WorkspaceMemberWithUser } from '../interfaces/workspaces.interface';

const memberWithUserInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.WorkspaceMemberInclude;

@Injectable()
export class WorkspaceMembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.WorkspaceMemberUncheckedCreateInput,
  ): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.create({ data });
  }

  findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMemberWithUser | null> {
    return this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, isActive: true },
      include: memberWithUserInclude,
    }) as Promise<WorkspaceMemberWithUser | null>;
  }

  findByWorkspaceAndUserRaw(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
  }

  findAllByWorkspace(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId, isActive: true },
      include: memberWithUserInclude,
      orderBy: { joinedAt: 'asc' },
    }) as Promise<WorkspaceMemberWithUser[]>;
  }

  findById(id: string): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({ where: { id } });
  }

  update(
    id: string,
    data: Prisma.WorkspaceMemberUpdateInput,
  ): Promise<WorkspaceMemberWithUser> {
    return this.prisma.workspaceMember.update({
      where: { id },
      data,
      include: memberWithUserInclude,
    }) as Promise<WorkspaceMemberWithUser>;
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.workspaceMember.update({
      where: { id },
      data: { isActive: false },
    });
  }

  countOwners(workspaceId: string): Promise<number> {
    return this.prisma.workspaceMember.count({
      where: { workspaceId, role: WorkspaceRole.OWNER, isActive: true },
    });
  }

  async countActiveAndPendingInvites(
    workspaceId: string,
  ): Promise<{ activeMembers: number; pendingInvites: number }> {
    const [activeMembers, pendingInvites] = await Promise.all([
      this.prisma.workspaceMember.count({
        where: { workspaceId, isActive: true },
      }),
      this.prisma.workspaceInvite.count({
        where: { workspaceId, status: InviteStatus.PENDING },
      }),
    ]);
    return { activeMembers, pendingInvites };
  }

  countActiveMembers(workspaceId: string): Promise<number> {
    return this.prisma.workspaceMember.count({
      where: { workspaceId, isActive: true },
    });
  }
}
