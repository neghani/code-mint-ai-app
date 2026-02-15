import { prisma } from "@/lib/db";
import type { ItemType, ItemVisibility } from "@prisma/client";

export type CreateItemInput = {
  title: string;
  content: string;
  type: ItemType;
  metadata?: object;
  visibility: ItemVisibility;
  orgId: string | null;
  createdBy: string;
  tagIds?: string[];
  slug?: string | null;
  catalogId?: string | null;
  catalogVersion?: string | null;
};

export type UpdateItemInput = Partial<{
  title: string;
  content: string;
  type: ItemType;
  metadata: object;
  visibility: ItemVisibility;
  orgId: string | null;
  tagIds: string[];
  slug: string | null;
  catalogId: string | null;
  catalogVersion: string | null;
}>;

export const itemRepo = {
  async create(data: CreateItemInput) {
    const { tagIds, ...rest } = data;
    const item = await prisma.item.create({
      data: {
        ...rest,
        ...(tagIds?.length
          ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } }
          : {}),
      },
      include: { tags: { include: { tag: true } } },
    });
    return item;
  },

  async findById(id: string) {
    return prisma.item.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
  },

  async update(id: string, data: UpdateItemInput) {
    const { tagIds, ...rest } = data;
    if (tagIds !== undefined) {
      await prisma.itemTag.deleteMany({ where: { itemId: id } });
      if (tagIds.length > 0) {
        await prisma.itemTag.createMany({
          data: tagIds.map((tagId) => ({ itemId: id, tagId })),
        });
      }
    }
    return prisma.item.update({
      where: { id },
      data: rest,
      include: { tags: { include: { tag: true } } },
    });
  },

  async delete(id: string) {
    return prisma.item.delete({ where: { id } });
  },

  async findByTypeAndSlug(type: ItemType, slug: string) {
    return prisma.item.findFirst({
      where: { type, slug },
      include: { tags: { include: { tag: true } } },
    });
  },

  async findByCatalogId(catalogId: string, version?: string | null) {
    return prisma.item.findFirst({
      where: version
        ? { catalogId, catalogVersion: version }
        : { catalogId },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
    });
  },

  async findManyByCatalogIds(catalogIds: string[]) {
    if (catalogIds.length === 0) return [];
    return prisma.item.findMany({
      where: { catalogId: { in: catalogIds }, visibility: "public" },
      include: { tags: { include: { tag: true } } },
      orderBy: { catalogVersion: "desc" },
    });
  },

  async incrementDownloadCount(id: string) {
    await prisma.item.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  },

  async incrementCopyCount(id: string) {
    await prisma.item.update({
      where: { id },
      data: { copyCount: { increment: 1 } },
    });
  },
};
