import { getSession, getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export type AuthContext = {
  userId: string;
  email: string;
};

/**
 * Require auth from cookie (JWT) or from Authorization: Bearer <api-token> when req is passed.
 * Pass the request in API routes so CLI can authenticate with Bearer token.
 */
export async function requireAuth(req?: Request): Promise<AuthContext | NextResponse> {
  const session = req ? await getSessionFromRequest(req) : await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.userId, email: session.email };
}

export async function getOptionalAuth(req?: Request): Promise<AuthContext | null> {
  const session = req ? await getSessionFromRequest(req) : await getSession();
  return session ? { userId: session.userId, email: session.email } : null;
}
