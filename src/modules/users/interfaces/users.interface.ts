import type { Prisma, User } from '@prisma/client';
import type { SearchQueryDto } from '../../../common/dto/search-query.dto';

export interface ListUsersInput extends SearchQueryDto {}

export interface ListUsersResult {
  items: User[];
  total: number;
}

export interface UpdateUserInput extends Prisma.UserUpdateInput {}
