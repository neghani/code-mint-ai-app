import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";

const TOKEN_BYTES = 32;

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export async function createApiToken(
  userId: string,
  name: string = "CLI"
): Promise<{ rawToken: string; id: string }> {
  if (typeof (prisma as { apiToken?: unknown }).apiToken === "undefined") {
    throw new Error(
      "Prisma client missing ApiToken model. Run: npx prisma generate && npx prisma db push, then restart the dev server."
    );
  }
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const record = await prisma.apiToken.create({
    data: { userId, name, tokenHash },
  });
  return { rawToken, id: record.id };
}

export async function verifyApiToken(rawToken: string): Promise<{
  userId: string;
  email: string;
} | null> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.apiToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!record) return null;
  await prisma.apiToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });
  return { userId: record.userId, email: record.user.email };
}

export async function listApiTokens(userId: string) {
  return prisma.apiToken.findMany({
    where: { userId },
    select: { id: true, name: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteApiToken(id: string, userId: string): Promise<boolean> {
  const deleted = await prisma.apiToken.deleteMany({
    where: { id, userId },
  });
  return deleted.count > 0;
}
