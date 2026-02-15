import { orgRepo } from "@/repositories/org.repo";
import { NextResponse } from "next/server";
import type { OrgRole } from "@prisma/client";

export type OrgContext = {
  orgId: string;
  role: OrgRole;
};

export async function requireOrgMember(
  orgId: string,
  userId: string
): Promise<OrgContext | NextResponse> {
  const member = await orgRepo.getMember(orgId, userId);
  if (!member || member.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { orgId, role: member.role };
}

export async function requireOrgAdmin(
  orgId: string,
  userId: string
): Promise<OrgContext | NextResponse> {
  const ctx = await requireOrgMember(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return ctx;
}
