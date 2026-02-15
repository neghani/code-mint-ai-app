import { NextResponse } from "next/server";
import { z } from "zod";
import { userRepo } from "@/repositories/user.repo";
import {
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
} from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = bodySchema.parse(body);
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
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
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
