import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/requireAuth";
import { createApiToken, listApiTokens } from "@/lib/api-token";

/**
 * GET /api/auth/cli-token
 * List API tokens for the authenticated user (cookie or Bearer).
 * Returns: { tokens: { id, name, lastUsedAt, createdAt }[] } — no raw token.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const tokens = await listApiTokens(auth.userId);
  return NextResponse.json({ tokens });
}

/**
 * POST /api/auth/cli-token
 * Creates a new API token for the authenticated user (cookie or Bearer).
 * Body: { name?: string }
 * Returns: { token: string } — the raw token, only returned once. CLI should store it.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "CLI";
    const { rawToken } = await createApiToken(auth.userId, name);
    return NextResponse.json({ token: rawToken });
  } catch {
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
