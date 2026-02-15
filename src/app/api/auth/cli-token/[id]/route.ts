import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/requireAuth";
import { deleteApiToken } from "@/lib/api-token";

/**
 * DELETE /api/auth/cli-token/:id
 * Revoke an API token. Token must belong to the authenticated user.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const deleted = await deleteApiToken(id, auth.userId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
