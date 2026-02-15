import { NextResponse } from "next/server";
import { z } from "zod";
import { userRepo } from "@/repositories/user.repo";
import { hashPassword, createAccessToken, createRefreshToken, setAuthCookies } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = bodySchema.parse(body);
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    const user = await userRepo.create({ email, passwordHash, name });
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
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
