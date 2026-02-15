import { orgRepo } from "@/repositories/org.repo";

export async function getUserOrgIds(userId: string): Promise<string[]> {
  const orgs = await orgRepo.findMyOrgs(userId);
  return orgs.map((o) => o.id);
}
