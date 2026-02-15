import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/middleware/requireAuth";
import { inviteService } from "@/services/invite.service";

const bodySchema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const { token } = bodySchema.parse(body);
    const org = await inviteService.accept(token, auth.userId);
    return NextResponse.json(org);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    if (e instanceof Error) {
      const isBadRequest =
        e.message.includes("expired") ||
        e.message.includes("Invalid") ||
        e.message.includes("already used");
      return NextResponse.json(
        { error: e.message },
        { status: isBadRequest ? 400 : 500 }
      );
    }
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
