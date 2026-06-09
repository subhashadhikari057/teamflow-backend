import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AUTH_ERROR_CODES } from '../../modules/auth/auth.types';
import { authConfig } from '../../config/auth.config';
import { AppException } from '../exceptions/app.exception';
import type { AuthUser } from '../interfaces/auth-user.interface';

type AccessTokenPayload = {
  sub: string;
  email: string;
  username: string;
  role: AuthUser['role'];
  sessionId: string;
  type: 'access';
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new AppException(
        AUTH_ERROR_CODES.ACCESS_TOKEN_MISSING,
        'Access token is missing',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: authConfig.jwtSecret,
      });

      if (payload.type !== 'access') {
        throw new AppException(
          AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID,
          'Invalid access token',
          { status: HttpStatus.UNAUTHORIZED },
        );
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        sessionId: payload.sessionId,
        username: payload.username,
        role: payload.role,
      };
      return true;
    } catch {
      throw new AppException(
        AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID,
        'Access token is invalid or expired',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
