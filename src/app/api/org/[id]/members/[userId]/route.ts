import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/middleware/requireAuth";
import { requireOrgAdmin } from "@/middleware/requireOrg";
import { orgRepo } from "@/repositories/org.repo";
import { apiError } from "@/lib/api-error";

const bodySchema = z.object({ role: z.enum(["admin", "member", "viewer"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id: orgId, userId } = await params;
  const orgCtx = await requireOrgAdmin(orgId, auth.userId);
  if (orgCtx instanceof NextResponse) return orgCtx;
  try {
    const body = await req.json();
    const { role } = bodySchema.parse(body);
    await orgRepo.updateMemberRole(orgId, userId, role);
    const org = await orgRepo.findById(orgId);
    const member = org?.members.find((m) => m.userId === userId);
    return NextResponse.json(member ?? { role });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return apiError("invalid_request", "Invalid JSON", 400);
    }
    if (e instanceof z.ZodError) {
      return apiError("validation_error", "Validation failed", 400);
    }
    return apiError("internal_error", "Failed to update role", 500);
  }
}
