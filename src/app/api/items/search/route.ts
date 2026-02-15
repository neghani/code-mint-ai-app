import { NextRequest, NextResponse } from "next/server";
import { searchService } from "@/services/search.service";
import { getOptionalAuth } from "@/middleware/requireAuth";
import { getUserOrgIds } from "@/lib/request-context";
import { apiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";
import { getClientIp } from "@/lib/request-ip";
import type { SearchResultItem } from "@/lib/search";

const RATE_LIMIT_ANON = 60; // req/min unauthenticated
const RATE_LIMIT_AUTH = 120; // req/min authenticated
const ANON_MAX_ITEMS = 500; // max items unauthenticated can page through
const ANON_MAX_PAGE_SIZE = 25;

const VALID_TYPES = ["rule", "prompt", "skill"] as const;

/** CLI suggest contract: item shape with id, name, type, slug, catalogId, version, tags[], score */
export type SuggestItem = {
  id: string;
  name: string;
  type: string;
  slug: string;
  catalogId: string;
  version: string;
  tags: string[];
  score: number;
};

function toSuggestItem(item: SearchResultItem): SuggestItem {
  const meta = (item.metadata as Record<string, unknown>) ?? {};
  const version =
    (item.catalogVersion as string) ??
    (meta.catalogVersion as string) ??
    (meta.version as string) ??
    "0.0.0";
  const catalogId =
    item.catalogId ??
    (meta.catalogId as string) ??
    (item.slug ? `${item.type}:${item.slug}` : item.id);
  const slug = item.slug ?? item.id;
  const usage = (item.downloadCount ?? 0) + (item.copyCount ?? 0);
  const score = Math.min(100, Math.round(50 + Math.min(50, usage)));
  const tags = item.tags ?? [];
  return {
    id: item.id,
    name: item.title,
    type: item.type,
    slug,
    catalogId,
    version,
    tags: Array.isArray(tags) ? tags.map((t) => (typeof t === "object" && t && "name" in t ? t.name : String(t))) : [],
    score,
  };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const auth = await getOptionalAuth(req);
  const userId = auth?.userId ?? null;
  const rateKey = userId ? `search:${userId}` : `search:ip:${ip}`;
  const limitPerMin = userId ? RATE_LIMIT_AUTH : RATE_LIMIT_ANON;
  if (!checkRateLimit(rateKey, limitPerMin)) {
    return apiError("rate_limited", "Too many requests", 429);
  }

  const userOrgIds = userId ? await getUserOrgIds(userId) : [];

  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const typeParam = req.nextUrl.searchParams.get("type");
  if (typeParam && !VALID_TYPES.includes(typeParam as (typeof VALID_TYPES)[number])) {
    return apiError("invalid_type", "type must be rule, prompt, or skill", 422);
  }
  const type = typeParam
    ? (typeParam as "rule" | "prompt" | "skill")
    : undefined;
  const tagsParam = req.nextUrl.searchParams.get("tags");
  const tags = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;
  const org = req.nextUrl.searchParams.get("org") ?? undefined;
  const visibility = req.nextUrl.searchParams.get("visibility") as
    | "public"
    | "org"
    | "all"
    | undefined;
  const pageParam = req.nextUrl.searchParams.get("page");
  const limitParam = req.nextUrl.searchParams.get("limit");
  let page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  let limit = limitParam
    ? Math.min(100, Math.max(1, parseInt(limitParam, 10) || 25))
    : 25;

  if (!userId) {
    limit = Math.min(limit, ANON_MAX_PAGE_SIZE);
    const maxPage = Math.ceil(ANON_MAX_ITEMS / limit);
    if (page > maxPage) page = maxPage;
  }

  const sortParam = req.nextUrl.searchParams.get("sort") ?? undefined;
  const sortBy =
    sortParam === "popular" || sortParam === "createdAt" ? sortParam : "popular";

  try {
    const result = await searchService.search(
      {
        q,
        type,
        tags,
        orgId: org ?? undefined,
        visibility,
        page,
        pageSize: limit,
        sortBy,
      },
      userId,
      userOrgIds
    );
    const items: SuggestItem[] = (result.data ?? []).map(toSuggestItem);
    return NextResponse.json({
      data: result.data,
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      limit: result.pageSize,
    });
  } catch (e) {
    logError("items/search", e);
    return apiError("search_failed", "Search failed", 500);
  }
}
