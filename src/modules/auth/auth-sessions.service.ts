import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Session, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { createHash, randomUUID } from 'node:crypto';
import { AppException } from '../../common/exceptions/app.exception';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { authConfig } from '../../config/auth.config';
import { AUTH_ERROR_CODES } from './auth.types';
import { AuthActionResponseDto } from './dto/auth-action-response.dto';
import { AuthSessionItemResponseDto } from './dto/auth-session-item-response.dto';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { AuthSessionsListResponseDto } from './dto/auth-sessions-list-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { TokenPairResponseDto } from './dto/token-pair-response.dto';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  SessionMetadata,
} from './interfaces/auth.interface';
import { AuthRepository } from './repositories/auth.repository';

@Injectable()
export class AuthSessionsService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async issueSessionResponse(
    user: User,
    sessionMetadata?: SessionMetadata,
  ): Promise<AuthSessionResponseDto> {
    const tokens = await this.issueTokenPair(user, sessionMetadata);

    return plainToInstance(
      AuthSessionResponseDto,
      {
        user: plainToInstance(AuthUserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
        tokens,
      },
      { excludeExtraneousValues: true },
    );
  }

  async listActiveSessions(user: AuthUser): Promise<AuthSessionsListResponseDto> {
    const sessions = await this.authRepository.findActiveSessionsByUserId(user.id);

    return plainToInstance(
      AuthSessionsListResponseDto,
      {
        items: sessions.map((session) => ({
          ...session,
          isCurrent: session.id === user.sessionId,
        })),
      },
      { excludeExtraneousValues: true },
    );
  }

  async revokeSessionById(
    user: AuthUser,
    sessionId: string,
  ): Promise<AuthActionResponseDto> {
    const session = await this.authRepository.findSessionById(sessionId);

    if (!session || session.userId !== user.id) {
      throw new AppException(
        AUTH_ERROR_CODES.SESSION_NOT_FOUND,
        'Session not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (!session.isRevoked) {
      await this.authRepository.revokeSession(session.id);
    }

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'Session revoked successfully' },
      { excludeExtraneousValues: true },
    );
  }

  async revokeOtherSessions(user: AuthUser): Promise<AuthActionResponseDto> {
    await this.authRepository.revokeOtherSessionsForUser(user.id, user.sessionId);

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'All other sessions revoked successfully' },
      { excludeExtraneousValues: true },
    );
  }

  private async issueTokenPair(
    user: User,
    sessionMetadata?: SessionMetadata,
  ): Promise<TokenPairResponseDto> {
    const sessionId = randomUUID();
    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId,
      type: 'access',
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
      sessionId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: authConfig.jwtSecret,
        expiresIn: this.resolveJwtExpirySeconds(authConfig.jwtExpiresIn),
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: authConfig.jwtRefreshSecret,
        expiresIn: this.resolveJwtExpirySeconds(authConfig.jwtRefreshExpiresIn),
      }),
    ]);

    await this.authRepository.createSession({
      id: sessionId,
      userId: user.id,
      currentWorkspaceId: sessionMetadata?.currentWorkspaceId ?? null,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: this.resolveExpiryDate(authConfig.jwtRefreshExpiresIn),
      deviceToken: sessionMetadata?.deviceToken ?? null,
      deviceType: sessionMetadata?.deviceType ?? null,
      deviceName: sessionMetadata?.deviceName ?? null,
      ipAddress: sessionMetadata?.ipAddress ?? null,
      userAgent: sessionMetadata?.userAgent ?? null,
      location: sessionMetadata?.location ?? null,
    });

    return plainToInstance(
      TokenPairResponseDto,
      {
        accessToken,
        refreshToken,
        accessTokenExpiresIn: authConfig.jwtExpiresIn,
        refreshTokenExpiresIn: authConfig.jwtRefreshExpiresIn,
      },
      { excludeExtraneousValues: true },
    );
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private resolveExpiryDate(expiresIn: string) {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);

    if (!match) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multiplier =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60_000
          : unit === 'h'
            ? 3_600_000
            : 86_400_000;

    return new Date(Date.now() + value * multiplier);
  }

  private resolveJwtExpirySeconds(expiresIn: string) {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);

    if (!match) {
      return 60 * 60 * 24 * 30;
    }

    const value = Number(match[1]);
    const unit = match[2];

    if (unit === 's') {
      return value;
    }

    if (unit === 'm') {
      return value * 60;
    }

    if (unit === 'h') {
      return value * 60 * 60;
    }

    return value * 60 * 60 * 24;
  }
}
