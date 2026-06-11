import { Injectable } from '@nestjs/common';
import type { Prisma, Workspace, WorkspacePlan } from '@prisma/client';
import { InviteStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { WorkspaceWithCounts } from '../interfaces/workspaces.interface';

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

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.WorkspaceCreateInput): Promise<Workspace> {
    return this.prisma.workspace.create({ data });
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
