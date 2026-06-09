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
} as const;
