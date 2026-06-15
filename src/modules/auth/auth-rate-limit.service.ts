import { HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { createHash } from 'node:crypto';
import { authConfig } from '../../config/auth.config';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AppException } from '../../common/exceptions/app.exception';
import { AUTH_ERROR_CODES } from './auth.types';
import type { AuthRateLimitPolicy } from './auth-rate-limit.decorator';

type RateLimitBucket = {
  key: string;
  limit: number;
  windowSeconds: number;
};

@Injectable()
export class AuthRateLimitService {
  constructor(private readonly redisService: RedisService) {}

  async assertAllowed(policy: AuthRateLimitPolicy, request: Request): Promise<void> {
    const buckets = this.buildBuckets(policy, request);
    let retryAfterSeconds = 0;

    for (const bucket of buckets) {
      const result = await this.redisService.increment(bucket.key, bucket.windowSeconds);

      if (result.count > bucket.limit) {
        retryAfterSeconds = Math.max(retryAfterSeconds, result.ttlSeconds);
      }
    }

    if (retryAfterSeconds > 0) {
      throw new AppException(
        AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many authentication attempts. Please try again later',
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          details: { retryAfterSeconds },
        },
      );
    }
  }

  private buildBuckets(policy: AuthRateLimitPolicy, request: Request): RateLimitBucket[] {
    const ipHash = this.hashValue(this.extractClientIp(request));
    const buckets: RateLimitBucket[] = [
      {
        key: `auth:rate-limit:public:ip:${ipHash}`,
        limit: authConfig.rateLimitPublicMaxRequests,
        windowSeconds: authConfig.rateLimitPublicWindowSeconds,
      },
    ];

    switch (policy) {
      case 'register': {
        const emailHash = this.hashValue(this.extractBodyString(request, 'email'));
        buckets.push({
          key: this.composeKey(policy, 'ip', ipHash),
          limit: authConfig.rateLimitRegisterIpMaxRequests,
          windowSeconds: authConfig.rateLimitRegisterWindowSeconds,
        });
        buckets.push({
          key: this.composeKey(policy, 'email-ip', `${emailHash}:${ipHash}`),
          limit: authConfig.rateLimitRegisterEmailIpMaxRequests,
          windowSeconds: authConfig.rateLimitRegisterWindowSeconds,
        });
        break;
      }
      case 'login': {
        const identifierHash = this.hashValue(
          this.normalizeIdentifier(this.extractBodyString(request, 'identifier')),
        );
        buckets.push({
          key: this.composeKey(policy, 'ip', ipHash),
          limit: authConfig.rateLimitLoginIpMaxAttempts,
          windowSeconds: authConfig.rateLimitLoginWindowSeconds,
        });
        buckets.push({
          key: this.composeKey(policy, 'identifier-ip', `${identifierHash}:${ipHash}`),
          limit: authConfig.rateLimitLoginIdentifierIpMaxAttempts,
          windowSeconds: authConfig.rateLimitLoginWindowSeconds,
        });
        break;
      }
      case 'refresh': {
        const refreshTokenHash = this.hashValue(
          this.extractCookie(request, 'refresh_token') ?? 'missing',
        );
        buckets.push({
          key: this.composeKey(policy, 'token-ip', `${refreshTokenHash}:${ipHash}`),
          limit: authConfig.rateLimitRefreshTokenIpMaxRequests,
          windowSeconds: authConfig.rateLimitRefreshWindowSeconds,
        });
        break;
      }
      case 'forgotPassword': {
        const emailHash = this.hashValue(this.extractBodyString(request, 'email'));
        buckets.push({
          key: this.composeKey(policy, 'email-ip', `${emailHash}:${ipHash}`),
          limit: authConfig.rateLimitForgotPasswordEmailIpMaxRequests,
          windowSeconds: authConfig.rateLimitForgotPasswordWindowSeconds,
        });
        break;
      }
      case 'resendVerification': {
        const emailHash = this.hashValue(this.extractBodyString(request, 'email'));
        buckets.push({
          key: this.composeKey(policy, 'email-ip', `${emailHash}:${ipHash}`),
          limit: authConfig.rateLimitResendVerificationEmailIpMaxRequests,
          windowSeconds: authConfig.rateLimitResendVerificationWindowSeconds,
        });
        break;
      }
      case 'googleOauth':
      case 'githubOauth': {
        buckets.push({
          key: this.composeKey(policy, 'ip', ipHash),
          limit: authConfig.rateLimitOauthIpMaxRequests,
          windowSeconds: authConfig.rateLimitOauthWindowSeconds,
        });
        break;
      }
      case 'twoFactorVerify': {
        const challengeTokenHash = this.hashValue(
          this.extractBodyString(request, 'challengeToken'),
        );
        buckets.push({
          key: this.composeKey(policy, 'ip', ipHash),
          limit: authConfig.rateLimitTwoFactorVerifyIpMaxAttempts,
          windowSeconds: authConfig.rateLimitTwoFactorVerifyWindowSeconds,
        });
        buckets.push({
          key: this.composeKey(policy, 'challenge-ip', `${challengeTokenHash}:${ipHash}`),
          limit: authConfig.rateLimitTwoFactorVerifyChallengeIpMaxAttempts,
          windowSeconds: authConfig.rateLimitTwoFactorVerifyWindowSeconds,
        });
        break;
      }
    }

    return buckets;
  }

  private composeKey(policy: AuthRateLimitPolicy, dimension: string, value: string) {
    return `auth:rate-limit:${policy}:${dimension}:${value}`;
  }

  private extractBodyString(request: Request, key: string) {
    const value = request.body?.[key];
    return typeof value === 'string' ? value.trim() : 'unknown';
  }

  private extractCookie(request: Request, key: string) {
    const value = (request as Request & { cookies?: Record<string, unknown> }).cookies?.[key];
    return typeof value === 'string' ? value : undefined;
  }

  private extractClientIp(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return this.normalizeIp(forwardedFor.split(',')[0]?.trim() ?? forwardedFor);
    }

    return this.normalizeIp(request.ip || request.socket.remoteAddress || 'unknown');
  }

  private hashValue(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private normalizeIdentifier(identifier: string) {
    return identifier.trim().toLowerCase();
  }

  private normalizeIp(ipAddress: string) {
    return ipAddress.replace(/^::ffff:/, '');
  }
}
