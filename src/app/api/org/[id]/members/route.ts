import { NextResponse } from "next/server";
import { requireAuth } from "@/middleware/requireAuth";
import { requireOrgMember } from "@/middleware/requireOrg";
import { orgRepo } from "@/repositories/org.repo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id: orgId } = await params;
  const orgCtx = await requireOrgMember(orgId, auth.userId);
  if (orgCtx instanceof NextResponse) return orgCtx;
  const org = await orgRepo.findById(orgId);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const members = org.members
    .filter((m) => m.status === "active")
    .map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      email: m.user.email,
      name: m.user.name,
    }));
  return NextResponse.json(members);
}
