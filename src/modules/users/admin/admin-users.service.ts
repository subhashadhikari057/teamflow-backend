import { HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AppException } from '../../../common/exceptions/app.exception';
import type { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { AdminUserActionResponseDto } from './dto/admin-user-action-response.dto';
import { AdminUsersListResponseDto } from './dto/admin-users-list-response.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';
import { USERS_ERROR_CODES } from '../users.types';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class AdminUsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async listUsers(
    query: AdminListUsersQueryDto,
  ): Promise<AdminUsersListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.usersRepository.findMany({
      page,
      limit,
      search: query.search,
    });

    return plainToInstance(
      AdminUsersListResponseDto,
      {
        items: result.items,
        total: result.total,
        page,
        limit,
      },
      { excludeExtraneousValues: true },
    );
  }

  async getUserById(id: string): Promise<AdminUserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new AppException(USERS_ERROR_CODES.USER_NOT_FOUND, 'User not found', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    return plainToInstance(AdminUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async activateUser(id: string): Promise<AdminUserActionResponseDto> {
    const user = await this.getExistingUserOrThrow(id);

    if (user.deletedAt) {
      throw new AppException(
        USERS_ERROR_CODES.USER_ALREADY_DELETED,
        'Deleted users cannot be activated',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const updatedUser = await this.usersRepository.update(id, {
      isActive: true,
    });

    return plainToInstance(
      AdminUserActionResponseDto,
      {
        message: 'User activated successfully',
        userId: updatedUser.id,
        isActive: updatedUser.isActive,
        deletedAt: updatedUser.deletedAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  async deactivateUser(id: string): Promise<AdminUserActionResponseDto> {
    const user = await this.getExistingUserOrThrow(id);

    if (user.deletedAt) {
      throw new AppException(
        USERS_ERROR_CODES.USER_ALREADY_DELETED,
        'Deleted users cannot be deactivated',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const updatedUser = await this.usersRepository.update(id, {
      isActive: false,
    });

    return plainToInstance(
      AdminUserActionResponseDto,
      {
        message: 'User deactivated successfully',
        userId: updatedUser.id,
        isActive: updatedUser.isActive,
        deletedAt: updatedUser.deletedAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  async softDeleteUser(
    currentUser: AuthUser,
    id: string,
  ): Promise<AdminUserActionResponseDto> {
    const user = await this.getExistingUserOrThrow(id);

    if (user.deletedAt) {
      throw new AppException(
        USERS_ERROR_CODES.USER_ALREADY_DELETED,
        'User is already deleted',
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const updatedUser = await this.usersRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });

    return plainToInstance(
      AdminUserActionResponseDto,
      {
        message:
          currentUser.id === id
            ? 'User soft deleted successfully. Current session will stop working after re-login'
            : 'User soft deleted successfully',
        userId: updatedUser.id,
        isActive: updatedUser.isActive,
        deletedAt: updatedUser.deletedAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async getExistingUserOrThrow(id: string) {
    const user = await this.usersRepository.findByIdIncludingDeleted(id);

    if (!user) {
      throw new AppException(USERS_ERROR_CODES.USER_NOT_FOUND, 'User not found', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    return user;
  }
}
