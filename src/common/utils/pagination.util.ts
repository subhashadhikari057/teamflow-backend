import type { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface PaginationParams {
  limit: number;
  page: number;
  skip: number;
}

export function resolvePaginationParams(
  query: PaginationQueryDto,
): PaginationParams {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
