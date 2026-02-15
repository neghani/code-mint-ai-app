import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/requireAuth";
import { orgService } from "@/services/org.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const orgs = await orgService.getMyOrgs(auth.userId);
  return NextResponse.json(orgs);
}
