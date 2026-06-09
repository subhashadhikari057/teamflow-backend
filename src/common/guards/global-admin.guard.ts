import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { GlobalRole } from '@prisma/client';
import type { Request } from 'express';
import { USERS_ERROR_CODES } from '../../modules/users/users.types';
import { AppException } from '../exceptions/app.exception';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class GlobalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    if (!request.user) {
      throw new AppException(
        USERS_ERROR_CODES.GLOBAL_ADMIN_REQUIRED,
        'Authenticated user context is missing',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    if (request.user.role !== GlobalRole.ADMIN) {
      throw new AppException(
        USERS_ERROR_CODES.GLOBAL_ADMIN_REQUIRED,
        'Only global admins can access this resource',
        { status: HttpStatus.FORBIDDEN },
      );
    }

    return true;
  }
}
