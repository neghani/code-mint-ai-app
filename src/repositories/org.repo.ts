import { prisma } from "@/lib/db";
import type { OrgRole } from "@prisma/client";

export const orgRepo = {
  async create(name: string, createdBy: string) {
    return prisma.organization.create({
      data: {
        name,
        createdBy,
        members: {
          create: { userId: createdBy, role: "admin", status: "active" },
        },
      },
      include: { members: { include: { user: true } } },
    });
  },

  async findById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });
  },

  async findMyOrgs(userId: string) {
    return prisma.organization.findMany({
      where: { members: { some: { userId, status: "active" } } },
      include: { members: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getMember(orgId: string, userId: string) {
    return prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });
  },

  async updateMemberRole(orgId: string, userId: string, role: OrgRole) {
    return prisma.orgMember.update({
      where: { orgId_userId: { orgId, userId } },
      data: { role },
    });
  },

  async addMember(orgId: string, userId: string, role: OrgRole = "member") {
    return prisma.orgMember.upsert({
      where: { orgId_userId: { orgId, userId } },
      create: { orgId, userId, role, status: "active" },
      update: { role, status: "active" },
    });
  },
};
