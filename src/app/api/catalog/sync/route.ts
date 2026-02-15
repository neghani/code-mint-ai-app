import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalAuth } from "@/middleware/requireAuth";
import { itemRepo } from "@/repositories/item.repo";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { apiError } from "@/lib/api-error";
import { logError } from "@/lib/logger";

const bodySchema = z.object({
  catalogIds: z.array(z.string().min(1)).max(100),
});

const RATE_LIMIT_ANON = 30; // fewer bulk calls per min
const RATE_LIMIT_AUTH = 60;

/**
 * POST /api/catalog/sync
 * Body: { catalogIds: string[] }
 * Returns for each catalogId the latest catalog item (id, catalogId, catalogVersion, checksum, content or snippet).
 * Used by CLI to compare installed vs server and plan updates.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const auth = await getOptionalAuth(req);
  const rateKey = auth ? `sync:${auth.userId}` : `sync:ip:${ip}`;
  const limitPerMin = auth ? RATE_LIMIT_AUTH : RATE_LIMIT_ANON;
  if (!checkRateLimit(rateKey, limitPerMin)) {
    return apiError("rate_limited", "Too many requests", 429);
  }
  try {
    const body = await req.json();
    const { catalogIds } = bodySchema.parse(body);
    const items = await itemRepo.findManyByCatalogIds(catalogIds);
    type ItemRow = (Awaited<ReturnType<typeof itemRepo.findManyByCatalogIds>>)[number];
    const byCatalogId = new Map(
      items.map((item: ItemRow) => {
        const meta = (item.metadata as Record<string, unknown>) ?? {};
        return [
          item.catalogId!,
          {
            id: item.id,
            catalogId: item.catalogId,
            catalogVersion: item.catalogVersion,
            slug: item.slug,
            checksum: (meta.checksum as string) ?? null,
            deprecated: (meta.deprecated as boolean) ?? false,
            content: item.content,
            title: item.title,
          },
        ];
      })
    );
    const result = catalogIds.map((id) => byCatalogId.get(id) ?? null);
    return NextResponse.json({ items: result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    logError("catalog/sync", e);
    return apiError("sync_failed", "Sync failed", 500);
  }
}
