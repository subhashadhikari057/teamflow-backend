import { GlobalRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: GlobalRole;
}
