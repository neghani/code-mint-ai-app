"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Header } from "@/components/header";

type ItemType = "rule" | "prompt" | "skill";
type Visibility = "public" | "org" | "all";
type SortBy = "popular" | "createdAt";

type SearchItem = {
  id: string;
  title: string;
  content: string;
  type: ItemType;
  visibility: string;
  createdAt: string;
  slug: string | null;
  downloadCount: number;
  copyCount: number;
  tags: { id: string; name: string; category: string }[];
  snippet?: string;
};

type SearchResponse = {
  data: SearchItem[];
  total: number;
  page: number;
  pageSize: number;
};

type CatalogExplorerProps = {
  section: "all" | "skills" | "rules" | "prompts";
  title: string;
  description: string;
  fixedType?: ItemType;
};

type SectionLink = {
  key: CatalogExplorerProps["section"];
  href: string;
  label: string;
};

const SECTIONS: SectionLink[] = [
  { key: "skills", href: "/explore/skills", label: "Skills" },
  { key: "rules", href: "/explore/rules", label: "Rules" },
  { key: "prompts", href: "/explore/prompts", label: "Prompts" },
  { key: "all", href: "/explore/all", label: "All" },
];

const columnHelper = createColumnHelper<SearchItem>();

function buildSearchUrl(params: {
  q?: string;
  type?: ItemType;
  tags?: string[];
  visibility?: Visibility;
  org?: string;
  page?: number;
  limit?: number;
  sort?: SortBy;
}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.type) sp.set("type", params.type);
  if (params.tags?.length) sp.set("tags", params.tags.join(","));
  if (params.visibility) sp.set("visibility", params.visibility);
  if (params.org) sp.set("org", params.org);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.sort) sp.set("sort", params.sort);
  return `/api/items/search?${sp.toString()}`;
}

async function trackCopy(itemId: string) {
  try {
    await fetch(`/api/items/${itemId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "copy" }),
    });
  } catch {
    // best-effort only
  }
}

export function CatalogExplorer({
  section,
  title,
  description,
  fixedType,
}: CatalogExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [tags, setTags] = useState<string[]>(() => {
    const tagsParam = searchParams.get("tags");
    if (!tagsParam) return [];
    return tagsParam
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 1);
  });
  const [visibility, setVisibility] = useState<Visibility>(() => {
    const value = searchParams.get("visibility");
    if (value === "org" || value === "all" || value === "public") return value;
    return "public";
  });
  const [orgFilter] = useState(() => searchParams.get("org") ?? "");
  const [sort, setSort] = useState<SortBy>(() => {
    const value = searchParams.get("sort");
    return value === "createdAt" ? "createdAt" : "popular";
  });
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get("page"));
    return Number.isFinite(value) && value > 0 ? value : 1;
  });

  const { data: authData } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
  });
  const isLoggedIn = !!authData?.user;

  const { data: tagsData } = useQuery<{ id: string; name: string; category: string }[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tags");
      return res.json();
    },
  });

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: [
      "items",
      "search",
      q,
      fixedType ?? "all",
      tags,
      visibility,
      orgFilter || undefined,
      sort,
      page,
    ],
    queryFn: async () => {
      const url = buildSearchUrl({
        q: q || undefined,
        type: fixedType,
        tags: tags.length ? tags : undefined,
        visibility: isLoggedIn ? visibility : "public",
        org: orgFilter || undefined,
        sort,
        page,
        limit: 25,
      });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const showTypeColumn = !fixedType;

  const columns = useMemo(() => {
    const typeColumn = columnHelper.accessor("type", {
      header: "Type",
      cell: (c) => (
        <span className="rounded bg-charcoal-600 px-2 py-0.5 text-xs text-mint-400">
          {c.getValue()}
        </span>
      ),
    });

    const baseColumns = [
      columnHelper.accessor("title", {
        header: "Title",
        cell: (c) => (
          <span className="font-medium text-white">
            {c.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("tags", {
        header: "Tags",
        cell: (c) => {
          const itemTags = c.getValue() ?? [];
          return (
            <div className="flex flex-wrap gap-1">
              {itemTags.slice(0, 3).map((t, index) => (
                <span
                  key={t.id || `tag-${index}-${t.name}`}
                  className="rounded bg-charcoal-700 px-2 py-0.5 text-xs text-gray-400"
                >
                  {t.name}
                </span>
              ))}
              {itemTags.length > 3 && (
                <span className="text-xs text-gray-500">+{itemTags.length - 3}</span>
              )}
            </div>
          );
        },
      }),
    ];

    const restColumns = [
      columnHelper.accessor("visibility", {
        header: "Scope",
        cell: (c) => (
          <span
            className={
              c.getValue() === "public" ? "text-xs text-gray-400" : "text-xs text-mint-400"
            }
          >
            {c.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "uses",
        header: "Uses",
        cell: ({ row }) => {
          const downloads = row.original.downloadCount ?? 0;
          const copies = row.original.copyCount ?? 0;
          return (
            <span
              className="text-xs text-gray-400"
              title={`${downloads} downloads, ${copies} copies`}
            >
              {downloads + copies}
            </span>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (c) => {
          const value = c.getValue();
          if (!value) return "—";
          const date = new Date(value);
          return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard?.writeText(row.original.content ?? "").catch(() => {});
              trackCopy(row.original.id);
            }}
            className="text-sm text-mint-400 hover:underline"
          >
            Copy
          </button>
        ),
      }),
    ];

    return showTypeColumn
      ? [...baseColumns, typeColumn, ...restColumns]
      : [...baseColumns, ...restColumns];
  }, [router, section, showTypeColumn]);

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-gray-400">{description}</p>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-charcoal-700 pb-4">
          {SECTIONS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-md border px-4 py-2 text-sm transition ${
                item.key === section
                  ? "border-mint-500 bg-mint-500/15 text-mint-300"
                  : "border-charcoal-700 bg-charcoal-800/70 text-gray-300 hover:border-charcoal-500 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder={`Search ${section === "all" ? "catalog" : section}...`}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="input-field min-w-[220px] flex-1"
            />

            {tagsData && tagsData.length > 0 && (
              <select
                value={tags[0] ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setTags(value ? [value] : []);
                  setPage(1);
                }}
                className="input-field w-[180px]"
              >
                <option value="">All tags</option>
                {tagsData.map((tag) => (
                  <option key={tag.id} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
            )}

            {isLoggedIn && (
              <select
                value={visibility}
                onChange={(e) => {
                  setVisibility(e.target.value as Visibility);
                  setPage(1);
                }}
                className="input-field w-[190px]"
              >
                <option value="public">Public only</option>
                <option value="all">Public + my orgs</option>
                <option value="org">My orgs only</option>
              </select>
            )}

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortBy);
                setPage(1);
              }}
              className="input-field w-[170px]"
            >
              <option value="popular">Sort: Most used</option>
              <option value="createdAt">Sort: Newest</option>
            </select>
          </div>

          {orgFilter && (
            <p className="mt-3 text-xs text-gray-500">
              Scoped to org: <span className="text-mint-400">{orgFilter}</span>
            </p>
          )}
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal-700">
          {isLoading && <div className="p-8 text-center text-gray-500">Loading...</div>}
          {error && <div className="p-8 text-center text-red-400">Failed to load items.</div>}
          {data && !isLoading && (
            <>
              <table className="w-full min-w-[920px]">
                <thead>
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id} className="border-b border-charcoal-700 bg-charcoal-800/70">
                      {group.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/explore/items/${row.original.id}?from=${section}`)}
                      className="cursor-pointer border-b border-charcoal-800 transition-colors hover:bg-charcoal-800/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm"
                          onClick={(e) => {
                            // Prevent navigation when clicking on buttons/action elements
                            const target = e.target as HTMLElement;
                            if (
                              target.tagName === "BUTTON" ||
                              target.closest("button") ||
                              target.closest("code")
                            ) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-charcoal-700 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Total: {data.total} • Page {data.page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-outline disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="btn-outline disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {data && data.data.length === 0 && !isLoading && (
          <p className="mt-8 text-center text-gray-500">
            No results yet. Try another keyword, tag, or scope.
          </p>
        )}
      </main>
    </div>
  );
}
