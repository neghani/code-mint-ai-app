import { itemRepo } from "@/repositories/item.repo";
import type { CreateItemInput, UpdateItemInput } from "@/repositories/item.repo";
import { orgRepo } from "@/repositories/org.repo";

export type ItemAccess = "read" | "write";

function canAccessOrg(orgId: string | null, userId: string, userOrgIds: string[]): boolean {
  if (!orgId) return true;
  return userOrgIds.includes(orgId);
}

export const itemService = {
  async create(data: CreateItemInput, userId: string) {
    if (data.orgId) {
      const member = await orgRepo.getMember(data.orgId, userId);
      if (!member) throw new Error("Not a member of this organization");
    }
    if (data.catalogId && data.catalogVersion) {
      const existing = await itemRepo.findByCatalogId(data.catalogId, data.catalogVersion);
      if (existing) throw new Error("An item with this catalogId and catalogVersion already exists");
    }
    return itemRepo.create(data);
  },

  async getById(id: string, userId: string | null, userOrgIds: string[]) {
    const item = await itemRepo.findById(id);
    if (!item) return null;
    if (item.visibility === "public") return item;
    if (!item.orgId) return item;
    if (userId && userOrgIds.includes(item.orgId)) return item;
    return null;
  },

  async update(id: string, data: UpdateItemInput, userId: string, userOrgIds: string[]) {
    const item = await itemRepo.findById(id);
    if (!item) throw new Error("Item not found");
    if (!canAccessOrg(item.orgId, userId, userOrgIds)) throw new Error("Forbidden");
    const member = item.orgId ? await orgRepo.getMember(item.orgId, userId) : null;
    const isAdmin = member?.role === "admin";
    if (item.createdBy !== userId && !isAdmin) throw new Error("Forbidden");
    return itemRepo.update(id, data);
  },

  async delete(id: string, userId: string, userOrgIds: string[]) {
    const item = await itemRepo.findById(id);
    if (!item) throw new Error("Item not found");
    if (!canAccessOrg(item.orgId, userId, userOrgIds)) throw new Error("Forbidden");
    const member = item.orgId ? await orgRepo.getMember(item.orgId, userId) : null;
    const isAdmin = member?.role === "admin";
    if (item.createdBy !== userId && !isAdmin) throw new Error("Forbidden");
    return itemRepo.delete(id);
  },
};
