import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalAuth } from "@/middleware/requireAuth";
import { itemRepo } from "@/repositories/item.repo";

const bodySchema = z.object({
  catalogIds: z.array(z.string().min(1)).max(100),
});

/**
 * POST /api/catalog/sync
 * Body: { catalogIds: string[] }
 * Returns for each catalogId the latest catalog item (id, catalogId, catalogVersion, checksum, content or snippet).
 * Used by CLI to compare installed vs server and plan updates.
 */
export async function POST(req: NextRequest) {
  const auth = await getOptionalAuth(req);
  try {
    const body = await req.json();
    const { catalogIds } = bodySchema.parse(body);
    const items = await itemRepo.findManyByCatalogIds(catalogIds);
    const byCatalogId = new Map(
      items.map((item) => {
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
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
