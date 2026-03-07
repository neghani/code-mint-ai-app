import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/middleware/requireAuth";
import { orgService } from "@/services/org.service";
import { apiError } from "@/lib/api-error";

const createSchema = z.object({ name: z.string().min(1) });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const { name } = createSchema.parse(body);
    const org = await orgService.create(name, auth.userId);
    return NextResponse.json(org);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return apiError("invalid_request", "Invalid JSON", 400);
    }
    if (e instanceof z.ZodError) {
      return apiError("validation_error", "Validation failed", 400);
    }
    return apiError("internal_error", "Failed to create organization", 500);
  }
}
