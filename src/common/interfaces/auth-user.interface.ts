import { GlobalRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  currentWorkspaceId?: string | null;
  email: string;
  sessionId: string;
  username: string;
  role: GlobalRole;
}
