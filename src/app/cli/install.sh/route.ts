import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = join(process.cwd(), "scripts", "install-cli.sh");
  try {
    const body = readFileSync(filePath, "utf8");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/x-sh",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "not_found", message: "Install script not found" } },
      { status: 404 }
    );
  }
}
