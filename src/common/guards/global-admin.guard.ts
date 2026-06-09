import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GlobalRole } from '@prisma/client';
import type { Request } from 'express';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class GlobalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    if (!request.user) {
      throw new ForbiddenException('Authenticated user context is missing');
    }

    if (request.user.role !== GlobalRole.ADMIN) {
      throw new ForbiddenException(
        'Only global admins can access this resource',
      );
    }

    return true;
  }
}
