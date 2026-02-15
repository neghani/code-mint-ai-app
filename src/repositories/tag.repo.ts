import { prisma } from "@/lib/db";
import type { TagCategory } from "@prisma/client";

export const tagRepo = {
  async list(category?: TagCategory) {
    return prisma.tag.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.tag.findUnique({ where: { id } });
  },

  async findByName(name: string) {
    return prisma.tag.findUnique({ where: { name: name.toLowerCase().trim() } });
  },

  async create(name: string, category: TagCategory = "tech") {
    const n = name.toLowerCase().trim();
    return prisma.tag.upsert({
      where: { name: n },
      create: { name: n, category },
      update: {},
    });
  },

  async findOrCreateMany(names: string[], category: TagCategory = "tech") {
    const result: { id: string; name: string; category: string }[] = [];
    for (const name of names) {
      const tag = await this.create(name, category);
      result.push(tag);
    }
    return result;
  },
};
