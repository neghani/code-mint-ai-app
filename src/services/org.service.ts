import { orgRepo } from "@/repositories/org.repo";

export const orgService = {
  async create(name: string, userId: string) {
    return orgRepo.create(name, userId);
  },

  async getMyOrgs(userId: string) {
    return orgRepo.findMyOrgs(userId);
  },

  async getOrgWithMembers(orgId: string, userId: string) {
    const org = await orgRepo.findById(orgId);
    if (!org) return null;
    const member = await orgRepo.getMember(orgId, userId);
    if (!member) return null;
    return org;
  },

  async getOrgMemberIds(orgId: string): Promise<string[]> {
    const org = await orgRepo.findById(orgId);
    if (!org) return [];
    return org.members.filter((m) => m.status === "active").map((m) => m.userId);
  },
};
