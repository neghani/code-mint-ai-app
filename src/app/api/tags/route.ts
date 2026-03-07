import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/middleware/requireAuth";
import { tagRepo } from "@/repositories/tag.repo";
import { apiError } from "@/lib/api-error";

const createSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["tech", "job", "domain", "tool"]).optional(),
});

const VALID_CATEGORIES = ["tech", "job", "domain", "tool"] as const;

export async function GET(req: NextRequest) {
  const categoryParam = req.nextUrl.searchParams.get("category");
  const category =
    categoryParam && VALID_CATEGORIES.includes(categoryParam as (typeof VALID_CATEGORIES)[number])
      ? (categoryParam as (typeof VALID_CATEGORIES)[number])
      : undefined;
  const tags = await tagRepo.list(category);
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const { name, category } = createSchema.parse(body);
    const tag = await tagRepo.create(name, category ?? "tech");
    return NextResponse.json(tag);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return apiError("validation_error", "Validation failed", 400);
    }
    return apiError("internal_error", "Failed to create tag", 500);
  }
}
