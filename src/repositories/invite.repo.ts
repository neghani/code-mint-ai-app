import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

const TOKEN_BYTES = 32;
const EXPIRY_DAYS = 7;

export const inviteRepo = {
  async create(orgId: string, email: string) {
    const token = randomBytes(TOKEN_BYTES).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);
    return prisma.invite.create({
      data: { orgId, email, token, expiresAt },
    });
  },

  async findByToken(token: string) {
    return prisma.invite.findUnique({
      where: { token },
      include: { org: true },
    });
  },

  async markUsed(id: string) {
    return prisma.invite.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  async listByOrg(orgId: string) {
    return prisma.invite.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });
  },
};
