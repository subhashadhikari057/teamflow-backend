import { GlobalRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  sessionId: string;
  username: string;
  role: GlobalRole;
}
