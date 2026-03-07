import { prisma } from "@/lib/db";

type ItemType = "rule" | "prompt" | "skill";
type ItemVisibility = "public" | "org";

export type CreateItemInput = {
  title: string;
  content: string;
  type: ItemType;
  metadata?: object;
  visibility: ItemVisibility;
  orgId?: string | null;
  createdBy: string;
  tagIds?: string[];
  slug?: string | null;
  catalogId?: string | null;
  catalogVersion?: string | null;
  applyMode?: "always" | "auto" | "glob" | "manual";
  globs?: string | null;
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
  applyMode: "always" | "auto" | "glob" | "manual";
  globs: string | null;
}>;

const TAG_INCLUDE = { tags: { include: { tag: true } } };

export const itemRepo = {
  async create(data: CreateItemInput) {
    const { tagIds, orgId, slug, catalogId, catalogVersion, metadata, applyMode, globs, ...required } = data;
    
    const prismaData = {
      ...required,
      ...(orgId && { orgId }),
      ...(slug != null && { slug }),
      ...(catalogId && { catalogId }),
      ...(catalogVersion && { catalogVersion }),
      ...(metadata && { metadata }),
      ...(applyMode && { applyMode }),
      ...(globs != null && { globs }),
      ...(tagIds?.length && {
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      }),
    };

    return prisma.item.create({
      data: prismaData,
      include: TAG_INCLUDE,
    });
  },

  async findById(id: string) {
    return prisma.item.findUnique({
      where: { id },
      include: TAG_INCLUDE,
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

    const updateData: Parameters<typeof prisma.item.update>[0]["data"] = {};
    if (rest.title !== undefined) updateData.title = rest.title;
    if (rest.content !== undefined) updateData.content = rest.content;
    if (rest.type !== undefined) updateData.type = rest.type;
    if (rest.visibility !== undefined) updateData.visibility = rest.visibility;
    if (rest.orgId !== undefined) updateData.orgId = rest.orgId;
    if (rest.slug !== undefined) updateData.slug = rest.slug;
    if (rest.catalogId !== undefined) updateData.catalogId = rest.catalogId;
    if (rest.catalogVersion !== undefined) updateData.catalogVersion = rest.catalogVersion;
    if (rest.metadata !== undefined) updateData.metadata = rest.metadata;
    if (rest.applyMode !== undefined) updateData.applyMode = rest.applyMode;
    if (rest.globs !== undefined) updateData.globs = rest.globs;

    return prisma.item.update({
      where: { id },
      data: updateData,
      include: TAG_INCLUDE,
    });
  },

  async delete(id: string) {
    return prisma.item.delete({ where: { id } });
  },

  async findByTypeAndSlug(type: ItemType, slug: string) {
    return prisma.item.findFirst({
      where: { type, slug },
      include: TAG_INCLUDE,
    });
  },

  async findByCatalogId(catalogId: string, version?: string | null) {
    return prisma.item.findFirst({
      where: {
        catalogId,
        ...(version && { catalogVersion: version }),
      },
      include: TAG_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
  },

  async findManyByCatalogIds(catalogIds: string[]) {
    if (!catalogIds.length) return [];
    
    return prisma.item.findMany({
      where: { catalogId: { in: catalogIds }, visibility: "public" },
      include: TAG_INCLUDE,
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
