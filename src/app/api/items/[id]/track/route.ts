import { NextRequest, NextResponse } from "next/server";
import { itemRepo } from "@/repositories/item.repo";
import { getOptionalAuth } from "@/middleware/requireAuth";
import { getUserOrgIds } from "@/lib/request-context";

const VALID_ACTIONS = ["copy"] as const;

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
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body?.action;
  if (!action || !VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number])) {
    return NextResponse.json({ error: "action must be 'copy'" }, { status: 400 });
  }

  const item = await itemRepo.findById(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (item.visibility === "org" && item.orgId) {
    const auth = await getOptionalAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const userOrgIds = await getUserOrgIds(auth.userId);
    if (!userOrgIds.includes(item.orgId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  await itemRepo.incrementCopyCount(id);
  return NextResponse.json({ ok: true });
}
