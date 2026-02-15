import { searchItems, type SearchFilters, type SearchResultItem } from "@/lib/search";
import { normalizePagination, paginated, type PaginatedResponse } from "@/lib/pagination";
import type { ItemType } from "@prisma/client";

export type SearchParams = SearchFilters & {
  page?: number;
  pageSize?: number;
};

export const searchService = {
  async search(
    params: SearchParams,
    userId: string | null,
    userOrgIds: string[]
  ): Promise<PaginatedResponse<SearchResultItem>> {
    const { skip, take, page, pageSize } = normalizePagination({
      page: params.page,
      pageSize: params.pageSize,
    });

    const filters: SearchFilters = {
      q: params.q,
      type: params.type as ItemType | undefined,
      tags: params.tags,
      visibility: params.visibility ?? (userId ? "all" : "public"),
      userId: userId ?? undefined,
      sortBy: params.sortBy,
    };
    if (params.orgId) filters.orgId = params.orgId;
    if (userId && userOrgIds.length > 0 && params.orgId) {
      if (!userOrgIds.includes(params.orgId)) filters.orgId = undefined;
    }

    const { items, total } = await searchItems(filters, { skip, take });
    return paginated(items, total, page, pageSize);
  },
};
