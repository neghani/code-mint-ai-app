import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-min-32-characters-long"
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-32-characters"
);

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
const COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", sameSite: "lax" as const };

export type TokenPayload = { sub: string; email: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ACCESS_TTL)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(REFRESH_TTL)
    .setIssuedAt()
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function setAuthCookies(access: string, refresh: string): Promise<void> {
  const c = await cookies();
  c.set("access_token", access, { ...COOKIE_OPTIONS, maxAge: 15 * 60 });
  c.set("refresh_token", refresh, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 });
}

export async function clearAuthCookies(): Promise<void> {
  const c = await cookies();
  c.delete("access_token");
  c.delete("refresh_token");
}

export async function getAccessTokenFromCookie(): Promise<string | undefined> {
  const c = await cookies();
  return c.get("access_token")?.value;
}

export async function getRefreshTokenFromCookie(): Promise<string | undefined> {
  const c = await cookies();
  return c.get("refresh_token")?.value;
}

export async function getSession(): Promise<{ userId: string; email: string } | null> {
  const access = await getAccessTokenFromCookie();
  if (!access) return null;
  const payload = await verifyAccessToken(access);
  return payload ? { userId: payload.sub, email: payload.email } : null;
}

/**
 * Get session from either cookie (JWT) or Authorization: Bearer <api-token>.
 * Use this in API routes when the CLI might send a Bearer token.
 */
export async function getSessionFromRequest(
  req: Request
): Promise<{ userId: string; email: string } | null> {
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (bearer) {
    const { verifyApiToken } = await import("./api-token");
    const apiSession = await verifyApiToken(bearer);
    if (apiSession) return apiSession;
  }
  return getSession();
}
