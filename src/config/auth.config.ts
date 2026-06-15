import './env.config';

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET?.trim() || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET?.trim() || '',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN?.trim() || '30d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  emailVerificationExpiryMinutes:
    Number(process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES) || 60,
  passwordResetExpiryMinutes:
    Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES) || 30,
  oauthStateExpirySeconds: Number(process.env.OAUTH_STATE_EXPIRY_SECONDS) || 600,
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL?.trim() || '',
  githubClientId: process.env.GITHUB_CLIENT_ID?.trim() || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET?.trim() || '',
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL?.trim() || '',
  rateLimitPublicMaxRequests:
    Number(process.env.AUTH_RATE_LIMIT_PUBLIC_MAX_REQUESTS) || 60,
  rateLimitPublicWindowSeconds:
    Number(process.env.AUTH_RATE_LIMIT_PUBLIC_WINDOW_SECONDS) || 900,
  rateLimitRegisterIpMaxRequests:
    Number(process.env.AUTH_RATE_LIMIT_REGISTER_IP_MAX_REQUESTS) || 5,
  rateLimitRegisterEmailIpMaxRequests:
    Number(process.env.AUTH_RATE_LIMIT_REGISTER_EMAIL_IP_MAX_REQUESTS) || 2,
  rateLimitRegisterWindowSeconds:
    Number(process.env.AUTH_RATE_LIMIT_REGISTER_WINDOW_SECONDS) || 3600,
  rateLimitLoginIpMaxAttempts:
    Number(process.env.AUTH_RATE_LIMIT_LOGIN_IP_MAX_ATTEMPTS) || 20,
  rateLimitLoginIdentifierIpMaxAttempts:
    Number(process.env.AUTH_RATE_LIMIT_LOGIN_IDENTIFIER_IP_MAX_ATTEMPTS) || 5,
  rateLimitLoginWindowSeconds:
    Number(process.env.AUTH_RATE_LIMIT_LOGIN_WINDOW_SECONDS) || 900,
  rateLimitRefreshTokenIpMaxRequests:
    Number(process.env.AUTH_RATE_LIMIT_REFRESH_TOKEN_IP_MAX_REQUESTS) || 30,
  rateLimitRefreshWindowSeconds:
    Number(process.env.AUTH_RATE_LIMIT_REFRESH_WINDOW_SECONDS) || 300,
  rateLimitForgotPasswordEmailIpMaxRequests:
    Number(process.env.AUTH_RATE_LIMIT_FORGOT_PASSWORD_EMAIL_IP_MAX_REQUESTS) || 3,
  rateLimitForgotPasswordWindowSeconds:
    Number(process.env.AUTH_RATE_LIMIT_FORGOT_PASSWORD_WINDOW_SECONDS) || 900,
  rateLimitResendVerificationEmailIpMaxRequests:
    Number(process.env.AUTH_RATE_LIMIT_RESEND_VERIFICATION_EMAIL_IP_MAX_REQUESTS) || 3,
  rateLimitResendVerificationWindowSeconds:
    Number(process.env.AUTH_RATE_LIMIT_RESEND_VERIFICATION_WINDOW_SECONDS) || 900,
  rateLimitOauthIpMaxRequests:
    Number(process.env.AUTH_RATE_LIMIT_OAUTH_IP_MAX_REQUESTS) || 20,
  rateLimitOauthWindowSeconds:
    Number(process.env.AUTH_RATE_LIMIT_OAUTH_WINDOW_SECONDS) || 900,
  rateLimitTwoFactorVerifyIpMaxAttempts:
    Number(process.env.AUTH_RATE_LIMIT_TWO_FACTOR_VERIFY_IP_MAX_ATTEMPTS) || 10,
  rateLimitTwoFactorVerifyChallengeIpMaxAttempts:
    Number(process.env.AUTH_RATE_LIMIT_TWO_FACTOR_VERIFY_CHALLENGE_IP_MAX_ATTEMPTS) || 5,
  rateLimitTwoFactorVerifyWindowSeconds:
    Number(process.env.AUTH_RATE_LIMIT_TWO_FACTOR_VERIFY_WINDOW_SECONDS) || 600,
} as const;
