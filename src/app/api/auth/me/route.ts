import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, clearAuthCookies } from "@/lib/auth";
import { userRepo } from "@/repositories/user.repo";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const hasBearer = req.headers.get("authorization")?.startsWith("Bearer ");
  const session = await getSessionFromRequest(req);
  if (!session) {
    if (hasBearer) {
      return apiError("unauthorized", "Invalid or expired token", 401);
    }
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const user = await userRepo.findById(session.userId);
  if (!user) {
    await clearAuthCookies();
    if (hasBearer) {
      return apiError("unauthorized", "User no longer exists", 401);
    }
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}
