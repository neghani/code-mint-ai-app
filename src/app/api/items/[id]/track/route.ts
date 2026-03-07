import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { itemRepo } from "@/repositories/item.repo";
import { getOptionalAuth } from "@/middleware/requireAuth";
import { getUserOrgIds } from "@/lib/request-context";
import { apiError } from "@/lib/api-error";

const bodySchema = z.object({ action: z.enum(["copy"]) });

/**
 * POST /api/items/:id/track
 * Body: { action: "copy" }
 * Increments copy count for the item. Public items: no auth. Org items: auth + membership.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return apiError("invalid_request", "id required", 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("invalid_request", "Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalid_request", "action must be 'copy'", 400);
  }

  const item = await itemRepo.findById(id);
  if (!item) {
    return apiError("not_found", "Not found", 404);
  }

  if (item.visibility === "org" && item.orgId) {
    const auth = await getOptionalAuth(req);
    if (!auth) {
      return apiError("not_found", "Not found", 404);
    }
    const userOrgIds = await getUserOrgIds(auth.userId);
    if (!userOrgIds.includes(item.orgId)) {
      return apiError("not_found", "Not found", 404);
    }
  }

  await itemRepo.incrementCopyCount(id);
  return NextResponse.json({ ok: true });
}
