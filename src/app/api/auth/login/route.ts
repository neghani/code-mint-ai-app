import { NextResponse } from "next/server";
import { z } from "zod";
import { userRepo } from "@/repositories/user.repo";
import {
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { apiError } from "@/lib/api-error";

const AUTH_RATE_LIMIT = 10; // req/min per IP

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`auth:login:ip:${ip}`, AUTH_RATE_LIMIT)) {
    return apiError("rate_limited", "Too many requests", 429);
  }
  try {
    const body = await req.json();
    const { email, password } = bodySchema.parse(body);
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return apiError("invalid_credentials", "Invalid email or password", 401);
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return apiError("invalid_credentials", "Invalid email or password", 401);
    }
    const payload = { sub: user.id, email: user.email };
    const [access, refresh] = await Promise.all([
      createAccessToken(payload),
      createRefreshToken(payload),
    ]);
    await setAuthCookies(access, refresh);
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return apiError("invalid_request", "Invalid JSON", 400);
    }
    if (e instanceof z.ZodError) {
      return apiError("validation_error", "Validation failed", 400);
    }
    return apiError("login_failed", "Login failed", 500);
  }
}
