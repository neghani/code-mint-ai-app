import { inviteRepo } from "@/repositories/invite.repo";
import { orgRepo } from "@/repositories/org.repo";
import { prisma } from "@/lib/db";

export const inviteService = {
  async create(orgId: string, email: string, userId: string) {
    const member = await orgRepo.getMember(orgId, userId);
    if (!member || member.role !== "admin") throw new Error("Only org admins can invite");
    return inviteRepo.create(orgId, email);
  },

  async accept(token: string, userId: string) {
    const invite = await inviteRepo.findByToken(token);
    if (!invite) throw new Error("Invalid or expired invite");
    if (invite.usedAt) throw new Error("Invite already used");
    if (invite.expiresAt < new Date()) throw new Error("Invite expired");
    await prisma.$transaction(async () => {
      await inviteRepo.markUsed(invite.id);
      await orgRepo.addMember(invite.orgId, userId, "member");
    });
    return orgRepo.findById(invite.orgId);
  },

  async listByOrg(orgId: string, userId: string) {
    const member = await orgRepo.getMember(orgId, userId);
    if (!member || member.role !== "admin") throw new Error("Forbidden");
    return inviteRepo.listByOrg(orgId);
  },
};
