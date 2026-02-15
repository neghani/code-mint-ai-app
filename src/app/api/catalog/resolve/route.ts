import { NextRequest, NextResponse } from "next/server";
import { getOptionalAuth } from "@/middleware/requireAuth";
import { getUserOrgIds } from "@/lib/request-context";
import { itemRepo } from "@/repositories/item.repo";

/**
 * GET /api/catalog/resolve?ref=@rule/slug or @skill/slug
 * Resolves a human ref to a catalog item. Returns item with catalog fields.
 * Public items only, or org items if user is authenticated and in org.
 */
export async function GET(req: NextRequest) {
  const auth = await getOptionalAuth(req);
  const userOrgIds = auth ? await getUserOrgIds(auth.userId) : [];

  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref || !ref.startsWith("@")) {
    return NextResponse.json({ error: "ref required, e.g. ref=@rule/slug or @skill/slug" }, { status: 400 });
  }

  const match = ref.match(/^@(rule|skill)\/(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "ref must be @rule/<slug> or @skill/<slug>" }, { status: 400 });
  }
  const [, type, slug] = match;
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const item = await itemRepo.findByTypeAndSlug(type as "rule" | "skill", slug);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (item.visibility === "org" && item.orgId && !userOrgIds.includes(item.orgId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meta = (item.metadata as Record<string, unknown>) ?? {};
  return NextResponse.json({
    id: item.id,
    title: item.title,
    content: item.content,
    type: item.type,
    slug: item.slug,
    catalogId: item.catalogId,
    catalogVersion: item.catalogVersion,
    checksum: (meta.checksum as string) ?? null,
    deprecated: (meta.deprecated as boolean) ?? false,
    changelog: (meta.changelog as string) ?? null,
    tags: item.tags.map((t) => t.tag.name),
  });
}
