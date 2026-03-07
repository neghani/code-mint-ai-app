import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/middleware/requireAuth";
import { inviteService } from "@/services/invite.service";
import { apiError } from "@/lib/api-error";

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
    if (e instanceof SyntaxError) {
      return apiError("invalid_request", "Invalid JSON", 400);
    }
    if (e instanceof z.ZodError) {
      return apiError("validation_error", "Validation failed", 400);
    }
    if (e instanceof Error) {
      const isBadRequest =
        e.message.includes("expired") ||
        e.message.includes("Invalid") ||
        e.message.includes("already used");
      return apiError("invalid_request", e.message, isBadRequest ? 400 : 500);
    }
    return apiError("internal_error", "Failed to accept invite", 500);
  }
}
