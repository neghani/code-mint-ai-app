import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/requireAuth";
import { orgService } from "@/services/org.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const orgs = await orgService.getMyOrgs(auth.userId);
  const payload = orgs.map((org) => {
    const member = org.members.find((m) => m.userId === auth.userId);
    return {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      role: member?.role ?? "member",
      members: org.members,
    };
  });
  return NextResponse.json(payload);
}
