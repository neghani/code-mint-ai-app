import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

const BATCH_SIZE = 50;

type SeedData = {
  tags?: { name: string; category?: string }[];
  items?: {
    title: string;
    content: string;
    type: "rule" | "prompt" | "skill";
    visibility?: "public" | "org";
    slug?: string;
    tags?: string[];
  }[];
};

function loadSeedData(): SeedData | null {
  const p = path.join(process.cwd(), "prisma", "seed-data.json");
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf8");
  return JSON.parse(raw) as SeedData;
}

function loadCrawledData(): SeedData["items"] | null {
  const p = path.join(process.cwd(), "data", "crawl", "crawled.json");
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf8");
  const arr = JSON.parse(raw);
  return Array.isArray(arr) ? arr : null;
}

function loadAwesomeCursorrules(): SeedData["items"] | null {
  const p = path.join(process.cwd(), "data", "crawl", "awesome-cursorrules.json");
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf8");
  const arr = JSON.parse(raw);
  return Array.isArray(arr) ? arr : null;
}

async function ensureDemoUser(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@codemint.ai" },
    create: {
      email: "demo@codemint.ai",
      passwordHash,
      name: "Demo User",
    },
    update: {},
  });
  const org = await prisma.organization.upsert({
    where: { id: "seed-org-1" },
    create: {
      id: "seed-org-1",
      name: "Demo Org",
      createdBy: user.id,
      members: {
        create: { userId: user.id, role: "admin", status: "active" },
      },
    },
    update: {},
  });
  return { user, org };
}

async function seedFromFile(data: SeedData, createdBy: string) {
  const tagIds = new Map<string, string>();

  if (data.tags?.length) {
    for (const t of data.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: t.name.toLowerCase().trim() },
        create: { name: t.name.toLowerCase().trim(), category: (t.category as "tech" | "job" | "domain" | "tool") || "tech" },
        update: {},
      });
      tagIds.set(tag.name, tag.id);
    }
  }

  if (!data.items?.length) return;

  for (let i = 0; i < data.items.length; i += BATCH_SIZE) {
    const chunk = data.items.slice(i, i + BATCH_SIZE);
    for (const it of chunk) {
      const slug = it.slug ?? it.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const tagIdsForItem = (it.tags ?? [])
        .map((n) => tagIds.get(n.toLowerCase().trim()))
        .filter(Boolean) as string[];

      await prisma.item.upsert({
        where: { id: `seed-${slug}` },
        create: {
          id: `seed-${slug}`,
          title: it.title,
          content: it.content,
          type: it.type,
          visibility: it.visibility ?? "public",
          createdBy,
          slug: it.slug ?? slug,
          tags: tagIdsForItem.length
            ? { create: tagIdsForItem.map((tagId) => ({ tagId })) }
            : undefined,
        },
        update: { title: it.title, content: it.content },
      });
    }
  }
}

async function main() {
  const { user } = await ensureDemoUser(prisma);

  let data = loadSeedData();
  const crawled = loadCrawledData();
  const awesomeRules = loadAwesomeCursorrules();
  if (crawled?.length || awesomeRules?.length) {
    data = data ?? { items: [] };
    data.items = [...(data.items ?? []), ...(crawled ?? []), ...(awesomeRules ?? [])];
  }
  if (data?.items?.length || data?.tags?.length) {
    await seedFromFile(data, user.id);
    console.log("Seed done (demo + seed-data.json + crawled). Demo user: demo@codemint.ai / password123");
  } else {
    const tag1 = await prisma.tag.upsert({
      where: { name: "nextjs" },
      create: { name: "nextjs", category: "tech" },
      update: {},
    });
    const tag2 = await prisma.tag.upsert({
      where: { name: "react" },
      create: { name: "react", category: "tech" },
      update: {},
    });
    await prisma.item.upsert({
      where: { id: "seed-item-1" },
      create: {
        id: "seed-item-1",
        title: "Safe API route pattern",
        content: "Always validate input with Zod. Use parameterized queries. Never trust client data.",
        type: "rule",
        visibility: "public",
        createdBy: user.id,
        slug: "safe-api-route-pattern",
        tags: { create: [{ tagId: tag1.id }, { tagId: tag2.id }] },
      },
      update: { slug: "safe-api-route-pattern" },
    });
    await prisma.item.upsert({
      where: { id: "seed-item-2" },
      create: {
        id: "seed-item-2",
        title: "Code review prompt",
        content: "Review this code for security issues, readability, and adherence to our style guide.",
        type: "prompt",
        visibility: "public",
        createdBy: user.id,
        tags: { create: [{ tagId: tag1.id }] },
      },
      update: {},
    });
    console.log("Seed done (demo only). Demo user: demo@codemint.ai / password123");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
