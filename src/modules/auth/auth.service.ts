import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  GlobalRole,
  OAuthProvider,
  type OAuthAccount,
  type PasswordReset,
  type User,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { createHash, randomBytes } from 'node:crypto';
import { AppException } from '../../common/exceptions/app.exception';
import { appConfig } from '../../config/app.config';
import { authConfig } from '../../config/auth.config';
import { EmailService } from '../../infrastructure/email/email.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AUTH_ERROR_CODES, AUTH_OAUTH_STATE_PREFIX } from './auth.types';
import type { OAuthProfile, RefreshTokenPayload } from './interfaces/auth.interface';
import { AuthRepository } from './repositories/auth.repository';
import { AuthActionResponseDto } from './dto/auth-action-response.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthRedirectResponseDto } from './dto/oauth-redirect-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetCurrentWorkspaceDto } from './dto/set-current-workspace.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthSessionsService } from './auth-sessions.service';
import { AuthTwoFactorService } from './auth-two-factor.service';
import { buildPasswordResetEmail } from './emails/build-password-reset-email';
import { buildVerificationEmail } from './emails/build-verification-email';
import type { SessionMetadata } from './interfaces/auth.interface';
import { WorkspaceMembersRepository } from '../workspaces/repositories/workspace-members.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly authSessionsService: AuthSessionsService,
    private readonly authTwoFactorService: AuthTwoFactorService,
    private readonly workspaceMembersRepository: WorkspaceMembersRepository,
  ) {}

  async register(dto: RegisterDto): Promise<AuthActionResponseDto> {
    await this.ensureRegisterInputsAvailable(dto);

    const passwordHash = await bcrypt.hash(
      dto.password,
      authConfig.bcryptSaltRounds,
    );
    const verificationToken = this.generateOpaqueToken();
    const verificationTokenHash = this.hashToken(verificationToken);
    const verificationExpiry = this.futureDateInMinutes(
      authConfig.emailVerificationExpiryMinutes,
    );

    const user = await this.authRepository.createUser({
      email: dto.email.toLowerCase(),
      username: dto.username,
      passwordHash,
      name: dto.name,
      phone: dto.phone ?? null,
      verificationToken: verificationTokenHash,
      verificationExpiry,
    });

    await this.sendVerificationEmail(user, verificationToken);

    return plainToInstance(
      AuthActionResponseDto,
      {
        message:
          'Registration successful. Please check your email to verify your account before logging in',
      },
      { excludeExtraneousValues: true },
    );
  }

  async login(
    dto: LoginDto,
    sessionMetadata?: SessionMetadata,
  ): Promise<AuthLoginResponseDto> {
    const user = dto.identifier.includes('@')
      ? await this.authRepository.findUserByEmail(dto.identifier.toLowerCase())
      : await this.authRepository.findUserByUsername(dto.identifier);

    if (!user || !user.passwordHash) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid credentials',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid credentials',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    if (!user.isActive || user.deletedAt) {
      throw new AppException(
        AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
        'Account is inactive',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    if (!user.isEmailVerified) {
      throw new AppException(
        AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED,
        'Please verify your email before logging in',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    await this.authRepository.updateUser(user.id, { lastSeenAt: new Date() });

    if (user.twoFactorEnabled) {
      return this.authTwoFactorService.createLoginChallenge(user);
    }

    const session = await this.authSessionsService.issueSessionResponse(
      user,
      sessionMetadata,
    );

    return plainToInstance(
      AuthLoginResponseDto,
      {
        requiresTwoFactor: false,
        session,
      },
      { excludeExtraneousValues: true },
    );
  }

  async logout(user: AuthUser, refreshToken: string | undefined): Promise<AuthActionResponseDto> {
    if (!refreshToken) {
      throw new AppException(
        AUTH_ERROR_CODES.REFRESH_TOKEN_NOT_FOUND,
        'Refresh token not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }
    const refreshTokenHash = this.hashToken(refreshToken);
    const session = await this.authRepository.findSessionByHash(refreshTokenHash);

    if (!session || session.userId !== user.id) {
      throw new AppException(
        AUTH_ERROR_CODES.REFRESH_TOKEN_NOT_FOUND,
        'Refresh token not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    await this.authRepository.revokeSession(session.id);

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'Logged out successfully' },
      { excludeExtraneousValues: true },
    );
  }

  async refresh(
    refreshToken: string | undefined,
    sessionMetadata?: SessionMetadata,
  ): Promise<AuthSessionResponseDto> {
    if (!refreshToken) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Refresh token is missing',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        { secret: authConfig.jwtRefreshSecret },
      );
    } catch {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Refresh token is invalid or expired',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    if (payload.type !== 'refresh') {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Invalid refresh token',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const refreshTokenHash = this.hashToken(refreshToken);
    const session = await this.authRepository.findSessionByHash(refreshTokenHash);

    if (
      !session ||
      session.id !== payload.sessionId ||
      session.isRevoked ||
      session.expiresAt <= new Date()
    ) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Refresh token is invalid or revoked',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    await this.authRepository.revokeSession(session.id);
    return this.authSessionsService.issueSessionResponse(session.user, {
      currentWorkspaceId:
        sessionMetadata?.currentWorkspaceId ?? session.currentWorkspaceId,
      deviceToken: sessionMetadata?.deviceToken ?? session.deviceToken,
      deviceType: sessionMetadata?.deviceType ?? session.deviceType,
      deviceName: sessionMetadata?.deviceName ?? session.deviceName,
      ipAddress: sessionMetadata?.ipAddress ?? session.ipAddress,
      userAgent: sessionMetadata?.userAgent ?? session.userAgent,
      location: sessionMetadata?.location ?? session.location,
    });
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const verificationTokenHash = this.hashToken(dto.token);
    const user =
      await this.authRepository.findUserByVerificationToken(verificationTokenHash);

    if (!user || !user.verificationExpiry || user.verificationExpiry <= new Date()) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_VERIFICATION_TOKEN,
        'Verification token is invalid or expired',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    await this.authRepository.updateUser(user.id, {
      isEmailVerified: true,
      verificationToken: null,
      verificationExpiry: null,
    });

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'Email verified successfully' },
      { excludeExtraneousValues: true },
    );
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.authRepository.findUserByEmail(dto.email.toLowerCase());

    if (user && !user.isEmailVerified && user.isActive && !user.deletedAt) {
      const verificationToken = this.generateOpaqueToken();
      const verificationTokenHash = this.hashToken(verificationToken);

      await this.authRepository.updateUser(user.id, {
        verificationToken: verificationTokenHash,
        verificationExpiry: this.futureDateInMinutes(
          authConfig.emailVerificationExpiryMinutes,
        ),
      });

      await this.sendVerificationEmail(user, verificationToken);
    }

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'If the account exists, a verification email has been sent' },
      { excludeExtraneousValues: true },
    );
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.authRepository.findUserByEmail(dto.email.toLowerCase());

    if (user && user.isActive && !user.deletedAt) {
      const resetToken = this.generateOpaqueToken();
      const tokenHash = this.hashToken(resetToken);

      await this.authRepository.createPasswordReset({
        userId: user.id,
        tokenHash,
        expiresAt: this.futureDateInMinutes(
          authConfig.passwordResetExpiryMinutes,
        ),
      });

      const resetLink = new URL('/reset-password', appConfig.frontendBaseUrl);
      resetLink.searchParams.set('token', resetToken);
      const email = buildPasswordResetEmail({
        resetLink: resetLink.toString(),
        token: resetToken,
      });

      await this.emailService.send({
        to: user.email,
        subject: email.subject,
        text: email.text,
      });
    }

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'If the account exists, a password reset email has been sent' },
      { excludeExtraneousValues: true },
    );
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const reset = await this.authRepository.findPasswordResetByHash(tokenHash);

    if (
      !reset ||
      reset.usedAt ||
      reset.expiresAt <= new Date() ||
      !reset.user.isActive ||
      reset.user.deletedAt
    ) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_RESET_TOKEN,
        'Password reset token is invalid or expired',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      authConfig.bcryptSaltRounds,
    );

    await this.authRepository.updateUser(reset.userId, { passwordHash });
    await this.authRepository.markPasswordResetUsed(reset.id);
    await this.authRepository.revokeAllSessionsForUser(reset.userId);

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'Password reset successfully' },
      { excludeExtraneousValues: true },
    );
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    const dbUser = await this.getActiveUserOrThrow(user.id);

    if (!dbUser.passwordHash) {
      throw new AppException(
        AUTH_ERROR_CODES.PASSWORD_LOGIN_NOT_ENABLED,
        'Password login is not enabled for this account',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      dbUser.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppException(
        AUTH_ERROR_CODES.CURRENT_PASSWORD_INVALID,
        'Current password is incorrect',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.newPassword,
      authConfig.bcryptSaltRounds,
    );

    await this.authRepository.updateUser(dbUser.id, { passwordHash });
    await this.authRepository.revokeAllSessionsForUser(dbUser.id);

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'Password changed successfully' },
      { excludeExtraneousValues: true },
    );
  }

  async me(user: AuthUser) {
    const session = await this.authRepository.findSessionContextById(user.sessionId);

    if (!session || session.userId !== user.id || session.isRevoked) {
      throw new AppException(AUTH_ERROR_CODES.USER_NOT_FOUND, 'User not found', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    if (!session.user.isActive || session.user.deletedAt) {
      throw new AppException(AUTH_ERROR_CODES.USER_NOT_FOUND, 'User not found', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const currentWorkspace = await this.resolveCurrentWorkspaceForUser(
      user.id,
      session.currentWorkspaceId,
    );

    return this.mapUserResponse(session.user, currentWorkspace);
  }

  async updateProfile(user: AuthUser, dto: UpdateProfileDto) {
    await this.getActiveUserOrThrow(user.id);
    const updated = await this.authRepository.updateUser(user.id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.timezone !== undefined && { timezone: dto.timezone }),
    });
    const session = await this.authRepository.findSessionContextById(user.sessionId);
    const currentWorkspace = await this.resolveCurrentWorkspaceForUser(
      user.id,
      session?.currentWorkspaceId ?? null,
    );
    return this.mapUserResponse(updated, currentWorkspace);
  }

  async setCurrentWorkspace(
    user: AuthUser,
    dto: SetCurrentWorkspaceDto,
  ): Promise<AuthUserResponseDto> {
    const session = await this.authRepository.findSessionContextById(user.sessionId);

    if (!session || session.userId !== user.id || session.isRevoked) {
      throw new AppException(AUTH_ERROR_CODES.USER_NOT_FOUND, 'User not found', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const membership = await this.workspaceMembersRepository.findByWorkspaceAndUserRaw(
      dto.workspaceId,
      user.id,
    );

    if (!membership || !membership.isActive) {
      throw new AppException(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        'You are not an active member of this workspace',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    const updatedSession = await this.authRepository.updateSession(user.sessionId, {
      currentWorkspaceId: dto.workspaceId,
    });

    return this.mapUserResponse(
      updatedSession.user,
      updatedSession.currentWorkspace ?? null,
    );
  }

  async getGoogleAuthorizationUrl(redirectUri?: string, clientState?: string) {
    this.ensureGoogleOauthConfigured();

    const state = await this.createOAuthState('google', redirectUri, clientState);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', authConfig.googleClientId);
    url.searchParams.set('redirect_uri', authConfig.googleCallbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

    return plainToInstance(
      OAuthRedirectResponseDto,
      { url: url.toString() },
      { excludeExtraneousValues: true },
    );
  }

  async getGithubAuthorizationUrl(redirectUri?: string, clientState?: string) {
    this.ensureGithubOauthConfigured();

    const state = await this.createOAuthState('github', redirectUri, clientState);
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', authConfig.githubClientId);
    url.searchParams.set('redirect_uri', authConfig.githubCallbackUrl);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', state);

    return plainToInstance(
      OAuthRedirectResponseDto,
      { url: url.toString() },
      { excludeExtraneousValues: true },
    );
  }

  async handleGoogleCallback(
    code: string,
    state: string,
    sessionMetadata?: SessionMetadata,
  ) {
    this.ensureGoogleOauthConfigured();
    const { redirectUri } = await this.consumeOAuthState('google', state);

    const tokenResponse = await this.fetchJson<{
      access_token: string;
      expires_in?: number;
      refresh_token?: string;
      token_type: string;
    }>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: authConfig.googleClientId,
        client_secret: authConfig.googleClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: authConfig.googleCallbackUrl,
      }),
    });

    const profile = await this.fetchJson<{
      email: string;
      email_verified: boolean;
      name: string;
      picture?: string;
      sub: string;
    }>('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });

    const loginResult = await this.handleOAuthLogin(
      {
      avatarUrl: profile.picture,
      email: profile.email,
      emailVerified: profile.email_verified,
      name: profile.name,
      provider: OAuthProvider.GOOGLE,
      providerAccessToken: tokenResponse.access_token,
      providerAccountId: profile.sub,
      providerRefreshToken: tokenResponse.refresh_token,
      providerTokenExpiresAt: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : undefined,
      },
      sessionMetadata,
    );

    return { loginResult, redirectUri };
  }

  async handleGithubCallback(
    code: string,
    state: string,
    sessionMetadata?: SessionMetadata,
  ) {
    this.ensureGithubOauthConfigured();
    const { redirectUri } = await this.consumeOAuthState('github', state);

    const tokenResponse = await this.fetchJson<{
      access_token: string;
      refresh_token?: string;
    }>('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: authConfig.githubClientId,
        client_secret: authConfig.githubClientSecret,
        code,
        redirect_uri: authConfig.githubCallbackUrl,
      }),
    });

    const profile = await this.fetchJson<{
      avatar_url?: string;
      email?: string;
      id: number;
      name?: string;
      login: string;
    }>('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });

    let email = profile.email;
    let emailVerified = false;

    if (!email) {
      const emails = await this.fetchJson<
        Array<{ email: string; primary: boolean; verified: boolean }>
      >('https://api.github.com/user/emails', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      const primaryEmail =
        emails.find((item) => item.primary) ?? emails.find((item) => item.verified);

      if (!primaryEmail) {
        throw new AppException(
          AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          'GitHub account does not provide a usable email address',
          { status: HttpStatus.BAD_REQUEST },
        );
      }

      email = primaryEmail.email;
      emailVerified = primaryEmail.verified;
    }

    const loginResult = await this.handleOAuthLogin(
      {
      avatarUrl: profile.avatar_url,
      email,
      emailVerified,
      name: profile.name || profile.login,
      provider: OAuthProvider.GITHUB,
      providerAccessToken: tokenResponse.access_token,
      providerAccountId: String(profile.id),
      providerRefreshToken: tokenResponse.refresh_token,
      },
      sessionMetadata,
    );

    return { loginResult, redirectUri };
  }

  private async ensureRegisterInputsAvailable(dto: RegisterDto) {
    const existingEmail = await this.authRepository.findUserByEmail(
      dto.email.toLowerCase(),
    );
    if (existingEmail) {
      throw new AppException(
        AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED,
        'Email is already registered',
        { status: HttpStatus.CONFLICT },
      );
    }

    const existingUsername = await this.authRepository.findUserByUsername(dto.username);
    if (existingUsername) {
      throw new AppException(
        AUTH_ERROR_CODES.USERNAME_ALREADY_TAKEN,
        'Username is already taken',
        { status: HttpStatus.CONFLICT },
      );
    }
  }

  private mapUserResponse(
    user: User,
    currentWorkspace?: { id: string; slug: string; name: string } | null,
  ) {
    return plainToInstance(AuthUserResponseDto, {
      ...user,
      currentWorkspace: currentWorkspace ?? null,
    }, {
      excludeExtraneousValues: true,
    });
  }

  private async resolveCurrentWorkspaceForUser(
    userId: string,
    workspaceId: string | null | undefined,
  ) {
    if (!workspaceId) {
      return null;
    }

    const membership = await this.workspaceMembersRepository.findByWorkspaceAndUserRaw(
      workspaceId,
      userId,
    );

    if (!membership || !membership.isActive) {
      return null;
    }

    return this.authRepository.findWorkspaceSummaryById(workspaceId);
  }

  private async getActiveUserOrThrow(userId: string) {
    const user = await this.authRepository.findUserById(userId);

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppException(AUTH_ERROR_CODES.USER_NOT_FOUND, 'User not found', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    return user;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateOpaqueToken() {
    return randomBytes(32).toString('hex');
  }

  private futureDateInMinutes(minutes: number) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private async sendVerificationEmail(user: User, token: string) {
    const verificationLink = new URL('/verify-email', appConfig.frontendBaseUrl);
    verificationLink.searchParams.set('token', token);
    const email = buildVerificationEmail({
      verificationLink: verificationLink.toString(),
      token,
    });

    await this.emailService.send({
      to: user.email,
      subject: email.subject,
      text: email.text,
    });
  }

  private ensureGoogleOauthConfigured() {
    if (
      !authConfig.googleClientId ||
      !authConfig.googleClientSecret ||
      !authConfig.googleCallbackUrl
    ) {
      throw new AppException(
        AUTH_ERROR_CODES.GOOGLE_OAUTH_NOT_CONFIGURED,
        'Google OAuth is not configured',
        { status: HttpStatus.SERVICE_UNAVAILABLE },
      );
    }
  }

  private ensureGithubOauthConfigured() {
    if (
      !authConfig.githubClientId ||
      !authConfig.githubClientSecret ||
      !authConfig.githubCallbackUrl
    ) {
      throw new AppException(
        AUTH_ERROR_CODES.GITHUB_OAUTH_NOT_CONFIGURED,
        'GitHub OAuth is not configured',
        { status: HttpStatus.SERVICE_UNAVAILABLE },
      );
    }
  }

  private async createOAuthState(
    provider: 'google' | 'github',
    redirectUri?: string,
    clientState?: string,
  ) {
    const state = this.generateOpaqueToken();
    const key = `${AUTH_OAUTH_STATE_PREFIX}:${provider}:${state}`;
    const client = this.redisService.getClient();

    await client.set(
      key,
      JSON.stringify({ redirectUri: redirectUri ?? null, clientState: clientState ?? null }),
      { EX: authConfig.oauthStateExpirySeconds },
    );

    return state;
  }

  private async consumeOAuthState(provider: 'google' | 'github', state: string) {
    const key = `${AUTH_OAUTH_STATE_PREFIX}:${provider}:${state}`;
    const client = this.redisService.getClient();
    const value = await client.get(key);

    if (!value) {
      throw new AppException(
        AUTH_ERROR_CODES.OAUTH_STATE_INVALID,
        'OAuth state is invalid or expired',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    await client.del(key);
    return JSON.parse(value) as { clientState: string | null; redirectUri: string | null };
  }

  private async handleOAuthLogin(
    profile: OAuthProfile,
    sessionMetadata?: SessionMetadata,
  ) {
    const existingAccount = await this.authRepository.findOAuthAccount(
      profile.provider,
      profile.providerAccountId,
    );

    if (existingAccount) {
      await this.authRepository.updateOAuthAccount(existingAccount.id, {
        accessToken: profile.providerAccessToken ?? null,
        refreshToken: profile.providerRefreshToken ?? null,
        expiresAt: profile.providerTokenExpiresAt ?? null,
      });

      await this.authRepository.updateUser(existingAccount.user.id, {
        avatarUrl: profile.avatarUrl ?? existingAccount.user.avatarUrl,
        isEmailVerified:
          existingAccount.user.isEmailVerified || profile.emailVerified,
        lastSeenAt: new Date(),
        name: profile.name,
      });

      if (existingAccount.user.twoFactorEnabled) {
        return this.authTwoFactorService.createLoginChallenge(existingAccount.user);
      }

      const session = await this.authSessionsService.issueSessionResponse(
        existingAccount.user,
        sessionMetadata,
      );
      return plainToInstance(AuthLoginResponseDto, { requiresTwoFactor: false, session }, { excludeExtraneousValues: true });
    }

    let user = await this.authRepository.findUserByEmail(profile.email.toLowerCase());

    if (!user) {
      const username = await this.ensureUniqueUsername(
        this.usernameFromProfile(profile),
      );

      user = await this.authRepository.createUser({
        email: profile.email.toLowerCase(),
        username,
        name: profile.name,
        avatarUrl: profile.avatarUrl ?? null,
        isEmailVerified: profile.emailVerified,
      });
    }

    await this.authRepository.createOAuthAccount({
      userId: user.id,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      accessToken: profile.providerAccessToken ?? null,
      refreshToken: profile.providerRefreshToken ?? null,
      expiresAt: profile.providerTokenExpiresAt ?? null,
    });

    const session = await this.authSessionsService.issueSessionResponse(
      user,
      sessionMetadata,
    );
    return plainToInstance(AuthLoginResponseDto, { requiresTwoFactor: false, session }, { excludeExtraneousValues: true });
  }

  private usernameFromProfile(profile: OAuthProfile) {
    return (
      profile.email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() ||
      `user_${this.generateOpaqueToken().slice(0, 8)}`
    );
  }

  private async ensureUniqueUsername(base: string) {
    let candidate = base;
    let suffix = 1;

    while (await this.authRepository.findUserByUsername(candidate)) {
      candidate = `${base}_${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init);

    if (!response.ok) {
      throw new AppException(
        AUTH_ERROR_CODES.OAUTH_PROVIDER_REQUEST_FAILED,
        `External authentication request failed: ${response.status}`,
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    return (await response.json()) as T;
  }
}
