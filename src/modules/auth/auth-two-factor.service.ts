import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { AppException } from '../../common/exceptions/app.exception';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { authConfig } from '../../config/auth.config';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AUTH_ERROR_CODES } from './auth.types';
import { AuthActionResponseDto } from './dto/auth-action-response.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthTwoFactorBackupCodesResponseDto } from './dto/auth-two-factor-backup-codes-response.dto';
import { AuthTwoFactorEnableResponseDto } from './dto/auth-two-factor-enable-response.dto';
import { ConfirmTwoFactorDto } from './dto/confirm-two-factor.dto';
import { DisableTwoFactorDto } from './dto/disable-two-factor.dto';
import { RegenerateBackupCodesDto } from './dto/regenerate-backup-codes.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { AuthRepository } from './repositories/auth.repository';
import { AuthSessionsService } from './auth-sessions.service';
import type { SessionMetadata } from './interfaces/auth.interface';

type TwoFactorChallengePayload = {
  sub: string;
  type: 'two_factor_challenge';
};

const BACKUP_CODES_REDIS_PREFIX = 'auth:2fa:backup-codes';

@Injectable()
export class AuthTwoFactorService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authSessionsService: AuthSessionsService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async enable(user: AuthUser): Promise<AuthTwoFactorEnableResponseDto> {
    const dbUser = await this.getActiveUserOrThrow(user.id);

    if (dbUser.twoFactorEnabled) {
      throw new AppException(
        AUTH_ERROR_CODES.TWO_FACTOR_ALREADY_ENABLED,
        'Two-factor authentication is already enabled',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const secret = this.generateBase32Secret();
    const otpauthUrl = this.createOtpAuthUrl(dbUser.email, secret);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(otpauthUrl)}`;

    await this.authRepository.updateUser(dbUser.id, {
      twoFactorSecret: secret,
      twoFactorEnabled: false,
    });

    return plainToInstance(
      AuthTwoFactorEnableResponseDto,
      { secret, otpauthUrl, qrCodeUrl },
      { excludeExtraneousValues: true },
    );
  }

  async confirm(
    user: AuthUser,
    dto: ConfirmTwoFactorDto,
  ): Promise<AuthTwoFactorBackupCodesResponseDto> {
    const dbUser = await this.getActiveUserOrThrow(user.id);

    if (!dbUser.twoFactorSecret) {
      throw new AppException(
        AUTH_ERROR_CODES.TWO_FACTOR_NOT_SETUP,
        'Two-factor authentication setup has not been started',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!this.verifyTotpCode(dbUser.twoFactorSecret, dto.code)) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_TWO_FACTOR_CODE,
        'Invalid two-factor authentication code',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const codes = await this.replaceBackupCodes(dbUser.id);

    await this.authRepository.updateUser(dbUser.id, {
      twoFactorEnabled: true,
    });

    return plainToInstance(
      AuthTwoFactorBackupCodesResponseDto,
      { codes },
      { excludeExtraneousValues: true },
    );
  }

  async disable(
    user: AuthUser,
    dto: DisableTwoFactorDto,
  ): Promise<AuthActionResponseDto> {
    const dbUser = await this.getActiveUserOrThrow(user.id);

    if (!dbUser.twoFactorEnabled) {
      throw new AppException(
        AUTH_ERROR_CODES.TWO_FACTOR_NOT_ENABLED,
        'Two-factor authentication is not enabled',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!dbUser.passwordHash) {
      throw new AppException(
        AUTH_ERROR_CODES.PASSWORD_LOGIN_NOT_ENABLED,
        'Password login is not enabled for this account',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, dbUser.passwordHash);

    if (!passwordMatches) {
      throw new AppException(
        AUTH_ERROR_CODES.CURRENT_PASSWORD_INVALID,
        'Current password is incorrect',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    await this.authRepository.updateUser(dbUser.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
    await this.authRepository.deleteTwoFactorBackupCodesForUser(dbUser.id);
    await this.clearBackupCodesCache(dbUser.id);

    return plainToInstance(
      AuthActionResponseDto,
      { message: 'Two-factor authentication disabled successfully' },
      { excludeExtraneousValues: true },
    );
  }

  async verify(
    dto: VerifyTwoFactorDto,
    sessionMetadata?: SessionMetadata,
  ): Promise<AuthLoginResponseDto> {
    const payload = await this.verifyChallengeToken(dto.challengeToken);
    const user = await this.getActiveUserOrThrow(payload.sub);

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppException(
        AUTH_ERROR_CODES.TWO_FACTOR_NOT_ENABLED,
        'Two-factor authentication is not enabled',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    let passed = false;

    if (dto.code) {
      passed = this.verifyTotpCode(user.twoFactorSecret, dto.code);
    } else if (dto.backupCode) {
      const codeHash = this.hashToken(this.normalizeBackupCode(dto.backupCode));
      const backupCode = await this.authRepository.findUnusedBackupCodeByHash(
        user.id,
        codeHash,
      );

      if (backupCode) {
        await this.authRepository.markBackupCodeUsed(backupCode.id);
        passed = true;
      }
    }

    if (!passed) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_TWO_FACTOR_CODE,
        'Invalid two-factor authentication code',
        { status: HttpStatus.BAD_REQUEST },
      );
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

  async getBackupCodes(user: AuthUser): Promise<AuthTwoFactorBackupCodesResponseDto> {
    const dbUser = await this.getActiveUserOrThrow(user.id);

    if (!dbUser.twoFactorEnabled) {
      throw new AppException(
        AUTH_ERROR_CODES.TWO_FACTOR_NOT_ENABLED,
        'Two-factor authentication is not enabled',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const codes = await this.getCachedBackupCodes(dbUser.id);

    if (!codes.length) {
      throw new AppException(
        AUTH_ERROR_CODES.BACKUP_CODES_NOT_AVAILABLE,
        'Backup codes are only shown when they are generated or regenerated',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    return plainToInstance(
      AuthTwoFactorBackupCodesResponseDto,
      { codes },
      { excludeExtraneousValues: true },
    );
  }

  async regenerateBackupCodes(
    user: AuthUser,
    dto: RegenerateBackupCodesDto,
  ): Promise<AuthTwoFactorBackupCodesResponseDto> {
    const dbUser = await this.getActiveUserOrThrow(user.id);

    if (!dbUser.twoFactorEnabled) {
      throw new AppException(
        AUTH_ERROR_CODES.TWO_FACTOR_NOT_ENABLED,
        'Two-factor authentication is not enabled',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!dbUser.passwordHash) {
      throw new AppException(
        AUTH_ERROR_CODES.PASSWORD_LOGIN_NOT_ENABLED,
        'Password login is not enabled for this account',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, dbUser.passwordHash);

    if (!passwordMatches) {
      throw new AppException(
        AUTH_ERROR_CODES.CURRENT_PASSWORD_INVALID,
        'Current password is incorrect',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const codes = await this.replaceBackupCodes(dbUser.id);

    return plainToInstance(
      AuthTwoFactorBackupCodesResponseDto,
      { codes },
      { excludeExtraneousValues: true },
    );
  }

  async createLoginChallenge(user: User): Promise<AuthLoginResponseDto> {
    const challengeToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'two_factor_challenge' satisfies TwoFactorChallengePayload['type'] },
      {
        secret: authConfig.jwtSecret,
        expiresIn: 10 * 60,
      },
    );

    return plainToInstance(
      AuthLoginResponseDto,
      {
        requiresTwoFactor: true,
        challengeToken,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async replaceBackupCodes(userId: string) {
    const codes = Array.from({ length: 10 }, () => this.generateBackupCode());

    await this.authRepository.deleteTwoFactorBackupCodesForUser(userId);
    await this.authRepository.createTwoFactorBackupCodes(
      codes.map((code) => ({
        userId,
        codeHash: this.hashToken(this.normalizeBackupCode(code)),
      })),
    );
    await this.cacheBackupCodes(userId, codes);

    return codes;
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

  private async verifyChallengeToken(challengeToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<TwoFactorChallengePayload>(
        challengeToken,
        { secret: authConfig.jwtSecret },
      );

      if (payload.type !== 'two_factor_challenge') {
        throw new Error('invalid');
      }

      return payload;
    } catch {
      throw new AppException(
        AUTH_ERROR_CODES.TWO_FACTOR_CHALLENGE_INVALID,
        'Two-factor challenge is invalid or expired',
        { status: HttpStatus.BAD_REQUEST },
      );
    }
  }

  private createOtpAuthUrl(email: string, secret: string) {
    const issuer = 'Teamflow';
    const label = `${issuer}:${email}`;

    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  }

  private generateBase32Secret() {
    return this.base32Encode(randomBytes(20));
  }

  private generateBackupCode() {
    return randomBytes(5).toString('hex').toUpperCase();
  }

  private verifyTotpCode(secret: string, code: string) {
    const normalizedCode = code.trim();

    for (let offset = -1; offset <= 1; offset += 1) {
      if (this.generateTotp(secret, offset) === normalizedCode) {
        return true;
      }
    }

    return false;
  }

  private generateTotp(secret: string, offset = 0) {
    const step = 30;
    const counter = Math.floor(Date.now() / 1000 / step) + offset;
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));
    const hmac = createHmac('sha1', this.base32Decode(secret)).update(buffer).digest();
    const position = hmac[hmac.length - 1] & 0x0f;
    const value =
      ((hmac[position] & 0x7f) << 24) |
      ((hmac[position + 1] & 0xff) << 16) |
      ((hmac[position + 2] & 0xff) << 8) |
      (hmac[position + 3] & 0xff);

    return String(value % 1_000_000).padStart(6, '0');
  }

  private base32Encode(buffer: Buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(value: string) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let current = 0;
    const output: number[] = [];

    for (const character of value.replace(/=+$/u, '').toUpperCase()) {
      const index = alphabet.indexOf(character);

      if (index === -1) {
        continue;
      }

      current = (current << 5) | index;
      bits += 5;

      if (bits >= 8) {
        output.push((current >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }

  private normalizeBackupCode(code: string) {
    return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async cacheBackupCodes(userId: string, codes: string[]) {
    await this.redisService.getClient().set(
      `${BACKUP_CODES_REDIS_PREFIX}:${userId}`,
      JSON.stringify(codes),
      { EX: 60 * 15 },
    );
  }

  private async getCachedBackupCodes(userId: string) {
    const value = await this.redisService
      .getClient()
      .get(`${BACKUP_CODES_REDIS_PREFIX}:${userId}`);

    return value ? (JSON.parse(value) as string[]) : [];
  }

  private async clearBackupCodesCache(userId: string) {
    await this.redisService.getClient().del(`${BACKUP_CODES_REDIS_PREFIX}:${userId}`);
  }
}
