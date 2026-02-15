import { NextRequest, NextResponse } from "next/server";
import { searchService } from "@/services/search.service";
import { getOptionalAuth } from "@/middleware/requireAuth";
import { getUserOrgIds } from "@/lib/request-context";

const VALID_TYPES = ["rule", "prompt", "skill"] as const;

export async function GET(req: NextRequest) {
  const auth = await getOptionalAuth(req);
  const userId = auth?.userId ?? null;
  const userOrgIds = userId ? await getUserOrgIds(userId) : [];

  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const typeParam = req.nextUrl.searchParams.get("type");
  const type = typeParam && VALID_TYPES.includes(typeParam as (typeof VALID_TYPES)[number])
    ? (typeParam as "rule" | "prompt" | "skill")
    : undefined;
  const tagsParam = req.nextUrl.searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
  const org = req.nextUrl.searchParams.get("org") ?? undefined;
  const visibility = req.nextUrl.searchParams.get("visibility") as "public" | "org" | "all" | undefined;
  const pageParam = req.nextUrl.searchParams.get("page");
  const limitParam = req.nextUrl.searchParams.get("limit");
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : undefined;
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10) || 25)) : undefined;

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
      },
      userId,
      userOrgIds
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error("[items/search]", e);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
