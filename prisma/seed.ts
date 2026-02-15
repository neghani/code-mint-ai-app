import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

  console.log("Seed done. Demo user: demo@codemint.ai / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
