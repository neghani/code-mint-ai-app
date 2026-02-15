import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/middleware/requireAuth";
import { requireOrgAdmin } from "@/middleware/requireOrg";
import { inviteService } from "@/services/invite.service";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id: orgId } = await params;
  const orgCtx = await requireOrgAdmin(orgId, auth.userId);
  if (orgCtx instanceof NextResponse) return orgCtx;
  try {
    const body = await req.json();
    const { email } = bodySchema.parse(body);
    const invite = await inviteService.create(orgId, email, auth.userId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite/accept?token=${invite.token}`;
    return NextResponse.json({ invite, inviteLink });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
