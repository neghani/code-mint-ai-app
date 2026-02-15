import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const path = join(process.cwd(), "scripts", "install-cli.sh");
  const body = readFileSync(path, "utf8");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/x-sh",
      "Cache-Control": "public, max-age=300",
    },
  });
}
