import type { GlobalRole, OAuthProvider } from '@prisma/client';

export interface AccessTokenPayload {
  email: string;
  role: GlobalRole;
  sub: string;
  type: 'access';
  username: string;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
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
