import { NextResponse } from "next/server";
import {
  getRefreshTokenFromCookie,
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export async function POST() {
  const refresh = await getRefreshTokenFromCookie();
  if (!refresh) {
    await clearAuthCookies();
    return apiError("unauthorized", "Unauthorized", 401);
  }
  const payload = await verifyRefreshToken(refresh);
  if (!payload) {
    await clearAuthCookies();
    return apiError("unauthorized", "Unauthorized", 401);
  }
  const [access, newRefresh] = await Promise.all([
    createAccessToken(payload),
    createRefreshToken(payload),
  ]);
  await setAuthCookies(access, newRefresh);
  return NextResponse.json({ ok: true });
}
