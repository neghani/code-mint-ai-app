import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/middleware/requireAuth";
import { itemService } from "@/services/item.service";

const createSchema = z
  .object({
    title: z.string().min(1),
    content: z.string(),
    type: z.enum(["rule", "prompt", "skill"]),
    metadata: z.record(z.unknown()).optional(),
    visibility: z.enum(["public", "org"]),
    orgId: z.string().nullable().optional(),
    tagIds: z.array(z.string()).optional(),
    slug: z.string().min(1).nullable().optional(),
    catalogId: z.string().min(1).nullable().optional(),
    catalogVersion: z.string().min(1).nullable().optional(),
  })
  .refine((data) => data.visibility !== "org" || data.orgId != null, {
    message: "orgId is required when visibility is org",
    path: ["orgId"],
  })
  .refine(
    (data) =>
      data.type === "prompt" ||
      !data.catalogId ||
      (data.slug != null && data.slug !== "" && data.catalogVersion != null && data.catalogVersion !== ""),
    { message: "For catalog items (rule/skill), slug and catalogVersion are required when catalogId is set", path: ["slug"] }
  );

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const item = await itemService.create(
      {
        ...data,
        orgId: data.orgId ?? null,
        createdBy: auth.userId,
        slug: data.slug ?? undefined,
        catalogId: data.catalogId ?? undefined,
        catalogVersion: data.catalogVersion ?? undefined,
      },
      auth.userId
    );
    return NextResponse.json(item);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Not a member of this organization") {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
