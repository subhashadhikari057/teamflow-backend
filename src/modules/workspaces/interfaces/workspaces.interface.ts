import type {
  InviteStatus,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from '@prisma/client';

export interface WorkspaceWithCounts extends Workspace {
  _count: {
    members: number;
    invites: number;
  };
  creator?: {
    id: string;
    name: string | null;
    username: string;
    email: string;
  };
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: {
    id: string;
    name: string | null;
    username: string;
    avatarUrl: string | null;
  };
}

export interface WorkspaceInviteWithInviter extends WorkspaceInvite {
  inviter: {
    id: string;
    name: string | null;
    username: string;
  };
}

export interface WorkspaceOnboardingResult {
  invites: WorkspaceInviteWithInviter[];
  workspace: WorkspaceWithCounts;
}

export interface WorkspaceInviteCursorInput {
  cursor?: string;
  limit: number;
  plan?: import('@prisma/client').WorkspacePlan;
  isActive?: boolean;
  isVerified?: boolean;
}

// Re-export enum types for convenience
export type { InviteStatus, WorkspaceRole };
