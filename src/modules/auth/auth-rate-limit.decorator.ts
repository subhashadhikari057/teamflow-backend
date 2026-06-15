import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMIT_POLICY_KEY = 'authRateLimitPolicy';

export type AuthRateLimitPolicy =
  | 'forgotPassword'
  | 'githubOauth'
  | 'googleOauth'
  | 'login'
  | 'refresh'
  | 'register'
  | 'resendVerification'
  | 'twoFactorVerify';

export const AuthRateLimit = (policy: AuthRateLimitPolicy) =>
  SetMetadata(AUTH_RATE_LIMIT_POLICY_KEY, policy);
