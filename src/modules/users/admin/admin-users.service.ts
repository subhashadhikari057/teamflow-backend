import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AdminUsersListResponseDto } from './dto/admin-users-list-response.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';
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
      throw new NotFoundException('User not found');
    }

    return plainToInstance(AdminUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
