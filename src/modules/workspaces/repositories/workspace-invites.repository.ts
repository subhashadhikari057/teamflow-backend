import { Injectable } from '@nestjs/common';
import type { Prisma, WorkspaceInvite } from '@prisma/client';
import { InviteStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { WorkspaceInviteWithInviter } from '../interfaces/workspaces.interface';

const inviteWithInviterInclude = {
  inviter: {
    select: {
      id: true,
      name: true,
      username: true,
    },
  },
} satisfies Prisma.WorkspaceInviteInclude;

@Injectable()
export class WorkspaceInvitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.WorkspaceInviteUncheckedCreateInput,
  ): Promise<WorkspaceInvite> {
    return this.prisma.workspaceInvite.create({ data });
  }

  findById(id: string): Promise<WorkspaceInviteWithInviter | null> {
    return this.prisma.workspaceInvite.findUnique({
      where: { id },
      include: inviteWithInviterInclude,
    }) as Promise<WorkspaceInviteWithInviter | null>;
  }

  findByToken(token: string): Promise<WorkspaceInviteWithInviter | null> {
    return this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: inviteWithInviterInclude,
    }) as Promise<WorkspaceInviteWithInviter | null>;
  }

  findPendingByEmail(
    workspaceId: string,
    email: string,
  ): Promise<WorkspaceInvite | null> {
    return this.prisma.workspaceInvite.findFirst({
      where: { workspaceId, email, status: InviteStatus.PENDING },
    });
  }

  findByWorkspaceAndEmail(
    workspaceId: string,
    email: string,
  ): Promise<WorkspaceInvite | null> {
    return this.prisma.workspaceInvite.findFirst({
      where: { workspaceId, email },
    });
  }

  findPendingByWorkspace(
    workspaceId: string,
  ): Promise<WorkspaceInviteWithInviter[]> {
    return this.prisma.workspaceInvite.findMany({
      where: { workspaceId, status: InviteStatus.PENDING },
      include: inviteWithInviterInclude,
      orderBy: { createdAt: 'desc' },
    }) as Promise<WorkspaceInviteWithInviter[]>;
  }

  update(
    id: string,
    data: Prisma.WorkspaceInviteUpdateInput,
  ): Promise<WorkspaceInvite> {
    return this.prisma.workspaceInvite.update({ where: { id }, data });
  }

  resetForReinvite(
    id: string,
    data: {
      expiresAt: Date;
      invitedBy: string;
      role: WorkspaceInvite['role'];
      token: string;
    },
  ): Promise<WorkspaceInvite> {
    return this.prisma.workspaceInvite.update({
      where: { id },
      data: {
        acceptedAt: null,
        declinedAt: null,
        expiresAt: data.expiresAt,
        invitedBy: data.invitedBy,
        lastResentAt: null,
        resendCount: 0,
        revokedAt: null,
        revokedBy: null,
        role: data.role,
        status: InviteStatus.PENDING,
        token: data.token,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workspaceInvite.delete({ where: { id } });
  }
}
