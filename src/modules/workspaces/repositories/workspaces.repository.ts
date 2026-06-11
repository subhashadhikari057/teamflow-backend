import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  Workspace,
  WorkspacePlan,
  WorkspaceRole,
} from '@prisma/client';
import { InviteStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  WorkspaceInviteWithInviter,
  WorkspaceOnboardingResult,
  WorkspaceWithCounts,
} from '../interfaces/workspaces.interface';

const workspaceInclude = {
  _count: {
    select: {
      members: { where: { isActive: true } },
      invites: { where: { status: InviteStatus.PENDING } },
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  },
} satisfies Prisma.WorkspaceInclude;

const inviteWithInviterInclude = {
  inviter: {
    select: {
      id: true,
      name: true,
      username: true,
    },
  },
} satisfies Prisma.WorkspaceInviteInclude;

interface CreateWorkspaceOnboardingInput {
  creatorId: string;
  description: string | null;
  inviteEmails: string[];
  inviteRole: WorkspaceRole;
  logoUrl: string | null;
  maxMembers: number;
  name: string;
  slug: string;
  workspacePlan: WorkspacePlan;
}

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.WorkspaceCreateInput): Promise<Workspace> {
    return this.prisma.workspace.create({ data });
  }

  async createWorkspaceOnboarding(
    input: CreateWorkspaceOnboardingInput,
  ): Promise<WorkspaceOnboardingResult> {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          logoUrl: input.logoUrl,
          plan: input.workspacePlan,
          maxMembers: input.maxMembers,
          isActive: true,
          isVerified: false,
          creator: { connect: { id: input.creatorId } },
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: input.creatorId,
          role: 'OWNER' as WorkspaceRole,
          isActive: true,
        },
      });

      const inviteIds: string[] = [];

      for (const email of input.inviteEmails) {
        const invite = await tx.workspaceInvite.create({
          data: {
            workspaceId: workspace.id,
            email,
            role: input.inviteRole,
            token: randomUUID(),
            invitedBy: input.creatorId,
            status: InviteStatus.PENDING,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        });

        inviteIds.push(invite.id);
      }

      const workspaceWithCounts = await tx.workspace.findFirst({
        where: { id: workspace.id, deletedAt: null },
        include: workspaceInclude,
      });

      const invites = await tx.workspaceInvite.findMany({
        where: { id: { in: inviteIds } },
        include: inviteWithInviterInclude,
        orderBy: { createdAt: 'desc' },
      });

      return {
        workspace: workspaceWithCounts as WorkspaceWithCounts,
        invites: invites as WorkspaceInviteWithInviter[],
      };
    });
  }

  findById(id: string): Promise<WorkspaceWithCounts | null> {
    return this.prisma.workspace.findFirst({
      where: { id, deletedAt: null },
      include: workspaceInclude,
    }) as Promise<WorkspaceWithCounts | null>;
  }

  findBySlug(slug: string): Promise<Workspace | null> {
    return this.prisma.workspace.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  findAllByUserId(userId: string): Promise<WorkspaceWithCounts[]> {
    return this.prisma.workspace.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        members: {
          some: { userId, isActive: true },
        },
      },
      include: workspaceInclude,
      orderBy: { createdAt: 'desc' },
    }) as Promise<WorkspaceWithCounts[]>;
  }

  findAllCursor(input: {
    cursor?: string;
    limit: number;
    plan?: WorkspacePlan;
    isActive?: boolean;
    isVerified?: boolean;
  }): Promise<WorkspaceWithCounts[]> {
    const { cursor, limit, plan, isActive, isVerified } = input;

    const where: Prisma.WorkspaceWhereInput = {
      ...(plan !== undefined ? { plan } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isVerified !== undefined ? { isVerified } : {}),
    };

    return this.prisma.workspace.findMany({
      where,
      include: workspaceInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    }) as Promise<WorkspaceWithCounts[]>;
  }

  update(
    id: string,
    data: Prisma.WorkspaceUpdateInput,
  ): Promise<WorkspaceWithCounts> {
    return this.prisma.workspace.update({
      where: { id },
      data,
      include: workspaceInclude,
    }) as Promise<WorkspaceWithCounts>;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.workspace.delete({ where: { id } });
  }
}
