import type { GlobalRole, OAuthProvider } from '@prisma/client';

export interface AccessTokenPayload {
  email: string;
  role: GlobalRole;
  sessionId: string;
  sub: string;
  type: 'access';
  username: string;
}

export interface RefreshTokenPayload {
  sessionId: string;
  sub: string;
  type: 'refresh';
}

export interface SessionMetadata {
  deviceName?: string | null;
  deviceToken?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  userAgent?: string | null;
}

export interface OAuthProfile {
  avatarUrl?: string;
  email: string;
  emailVerified: boolean;
  name: string;
  provider: OAuthProvider;
  providerAccessToken?: string;
  providerAccountId: string;
  providerRefreshToken?: string;
  providerTokenExpiresAt?: Date;
}
