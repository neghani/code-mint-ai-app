export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function normalizePagination(params: PaginationInput): { skip: number; take: number; page: number; pageSize: number } {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.pageSize) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize, page, pageSize };
}

export function paginated<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResponse<T> {
  return { data, total, page, pageSize };
}
