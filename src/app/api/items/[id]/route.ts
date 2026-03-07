import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, getOptionalAuth } from "@/middleware/requireAuth";
import { itemService } from "@/services/item.service";
import { getUserOrgIds } from "@/lib/request-context";
import { logError } from "@/lib/logger";
import { apiError } from "@/lib/api-error";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  type: z.enum(["rule", "prompt", "skill"]).optional(),
  metadata: z.record(z.unknown()).optional(),
  visibility: z.enum(["public", "org"]).optional(),
  orgId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  slug: z.string().min(1).nullable().optional(),
  catalogId: z.string().min(1).nullable().optional(),
  catalogVersion: z.string().min(1).nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getOptionalAuth(req);
  const userId = auth?.userId ?? null;
  const userOrgIds = auth ? await getUserOrgIds(auth.userId) : [];
  const { id } = await params;
  const item = await itemService.getById(id, userId, userOrgIds);
  if (!item) {
    return apiError("not_found", "Not found", 404);
  }
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userOrgIds = await getUserOrgIds(auth.userId);
  const { id } = await params;
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const item = await itemService.update(id, data, auth.userId, userOrgIds);
    return NextResponse.json(item);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return apiError("validation_error", "Validation failed", 400);
    }
    if (e instanceof Error && (e.message === "Forbidden" || e.message === "Item not found")) {
      return apiError(e.message === "Item not found" ? "not_found" : "forbidden", e.message, e.message === "Item not found" ? 404 : 403);
    }
    return apiError("internal_error", "Failed to update", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const userOrgIds = await getUserOrgIds(auth.userId);
  const { id } = await params;
  try {
    await itemService.delete(id, auth.userId, userOrgIds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && (e.message === "Forbidden" || e.message === "Item not found")) {
      return apiError(e.message === "Item not found" ? "not_found" : "forbidden", e.message, e.message === "Item not found" ? 404 : 403);
    }
    logError("items/DELETE", e);
    return apiError("internal_error", "Failed to delete", 500);
  }
}
