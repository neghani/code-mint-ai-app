import { prisma } from "./db";
import type { ItemType } from "@prisma/client";

export type SearchFilters = {
  q?: string;
  type?: ItemType;
  tags?: string[];
  orgId?: string | null;
  visibility?: "public" | "org" | "all";
  userId?: string; // for org membership
};

export type SearchResultItem = {
  id: string;
  title: string;
  content: string;
  type: ItemType;
  metadata: object;
  visibility: "public" | "org";
  orgId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  slug: string | null;
  tags: { id: string; name: string; category: string }[];
  snippet?: string;
};

/**
 * Search items with PostgreSQL full-text (tsvector) and optional trigram.
 * Visibility: show item if visibility='public' OR (visibility='org' AND orgId in user's orgs).
 */
export async function searchItems(
  filters: SearchFilters,
  options: { skip: number; take: number }
): Promise<{ items: SearchResultItem[]; total: number }> {
  const { q, type, tags, orgId, visibility, userId } = filters;
  const { skip, take } = options;

  const conditions: string[] = ["1=1"];
  const params: (string | number | string[])[] = [];
  let paramIndex = 1;

  // Visibility: public or org-scoped for this user
  if (visibility === "public") {
    conditions.push(`i.visibility = 'public'`);
  } else if (visibility === "org" && orgId) {
    conditions.push(`(i.visibility = 'org' AND i.org_id = $${paramIndex})`);
    params.push(orgId);
    paramIndex++;
  } else if (userId) {
    // All: public OR user's orgs
    conditions.push(`(i.visibility = 'public' OR EXISTS (
      SELECT 1 FROM org_members om WHERE om.org_id = i.org_id AND om.user_id = $${paramIndex} AND om.status = 'active'
    ))`);
    params.push(userId);
    paramIndex++;
  } else {
    conditions.push(`i.visibility = 'public'`);
  }

  if (type) {
    conditions.push(`i.type = $${paramIndex}::"ItemType"`);
    params.push(type);
    paramIndex++;
  }

  if (tags && tags.length > 0) {
    conditions.push(
      `EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON t.id = it.tag_id WHERE it.item_id = i.id AND t.name = ANY($${paramIndex}::text[]))`
    );
    params.push(tags);
    paramIndex++;
  }

  let whereClause = conditions.join(" AND ");
  let orderClause = "i.created_at DESC";
  let searchSelect = "";

  if (q && q.trim()) {
    const query = q.trim();
    const tsQuery = `plainto_tsquery('english', $${paramIndex})`;
    params.push(query);
    paramIndex++;
    const tsVector = "to_tsvector('english', i.title || ' ' || i.content)";
    conditions.push(`${tsVector} @@ ${tsQuery}`);
    whereClause = conditions.join(" AND ");
    orderClause = `ts_rank(${tsVector}, ${tsQuery}) DESC, i.created_at DESC`;
    searchSelect = `, ts_headline('english', i.content, ${tsQuery}, 'MaxFragments=1, MaxWords=35') as snippet`;
  }

  const countSql = `
    SELECT COUNT(*)::int as total
    FROM "Item" i
    WHERE ${whereClause}
  `;
  const countResult = await prisma.$queryRawUnsafe<[{ total: number }]>(countSql, ...params);
  const total = countResult[0]?.total ?? 0;

  const selectColumns = `i.id, i.title, i.content, i.type, i.metadata, i.visibility, i.org_id as "orgId", i.created_by as "createdBy", i.created_at as "createdAt", i.updated_at as "updatedAt", i.slug${searchSelect}`;
  type Row = {
    id: string;
    title: string;
    content: string;
    type: ItemType;
    metadata: object;
    visibility: "public" | "org";
    orgId: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string | null;
    snippet?: string;
  };
  const dataSql = `
    SELECT ${selectColumns}
    FROM "Item" i
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(take, skip);
  const rows = await prisma.$queryRawUnsafe<Row[]>(dataSql, ...params);

  const itemIds = rows.map((r) => r.id);
  const itemTags = itemIds.length
    ? await prisma.itemTag.findMany({
        where: { itemId: { in: itemIds } },
        include: { tag: true },
      })
    : [];

  const tagMap = new Map<string, { id: string; name: string; category: string }[]>();
  for (const it of itemTags) {
    const list = tagMap.get(it.itemId) ?? [];
    list.push({ id: it.tag.id, name: it.tag.name, category: it.tag.category });
    tagMap.set(it.itemId, list);
  }

  const items: SearchResultItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    type: r.type,
    metadata: (r.metadata as object) ?? {},
    visibility: r.visibility,
    orgId: r.orgId,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    slug: r.slug ?? null,
    tags: tagMap.get(r.id) ?? [],
    ...(r.snippet != null && { snippet: r.snippet }),
  }));

  return { items, total };
}
