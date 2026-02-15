import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/middleware/requireAuth";
import { orgService } from "@/services/org.service";

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
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
