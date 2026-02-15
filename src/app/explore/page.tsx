"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  type ExpandedState,
} from "@tanstack/react-table";

type ItemType = "rule" | "prompt" | "skill";
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

function buildSearchUrl(params: {
  q?: string;
  type?: ItemType;
  tags?: string[];
  visibility?: "public" | "org" | "all";
  org?: string;
  page?: number;
  limit?: number;
  sort?: "popular" | "createdAt";
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
    // best-effort
  }
}

const columnHelper = createColumnHelper<SearchItem>();

const columns = [
  columnHelper.display({
    id: "expand",
    cell: ({ row }) => (
      <button
        onClick={() => row.toggleExpanded()}
        className="text-gray-500 hover:text-mint-400"
      >
        {row.getIsExpanded() ? "▼" : "▶"}
      </button>
    ),
  }),
  columnHelper.accessor("title", {
    header: "Title",
    cell: (c) => (
      <span className="font-medium text-white">{c.getValue()}</span>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: (c) => (
      <span className="rounded bg-charcoal-600 px-2 py-0.5 text-xs text-mint-400">
        {c.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("tags", {
    header: "Tags",
    cell: (c) => {
      const tags = c.getValue() ?? [];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className="rounded bg-charcoal-700 px-2 py-0.5 text-xs text-gray-400"
            >
              {t.name}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-500">+{tags.length - 3}</span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("visibility", {
    header: "Scope",
    cell: (c) => (
      <span
        className={
          c.getValue() === "public"
            ? "text-xs text-gray-400"
            : "text-xs text-mint-400"
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
      const d = row.original.downloadCount ?? 0;
      const c = row.original.copyCount ?? 0;
      const total = d + c;
      return (
        <span className="text-xs text-gray-400" title={`${d} downloads, ${c} copies`}>
          {total}
        </span>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (c) => {
      const v = c.getValue();
      if (!v) return "—";
      const d = new Date(v);
      return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(row.original.content ?? "").catch(() => {});
          trackCopy(row.original.id);
        }}
        className="text-sm text-mint-400 hover:underline"
      >
        Copy Safe Prompt
      </button>
    ),
  }),
];

const TAB_TYPES: { value: ItemType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "rule", label: "Rules" },
  { value: "prompt", label: "Prompts" },
  { value: "skill", label: "Skills" },
];

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<ItemType | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "org" | "all">("public");
  const [sort, setSort] = useState<"popular" | "createdAt">("popular");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<ExpandedState>({});

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
    queryKey: ["items", "search", q, type || undefined, tags, visibility, sort, page],
    queryFn: async () => {
      const url = buildSearchUrl({
        q: q || undefined,
        type: type || undefined,
        tags: tags.length ? tags : undefined,
        visibility: isLoggedIn ? visibility : "public",
        sort,
        page,
        limit: 25,
      });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-white">Explore</h1>
        <p className="mt-1 text-gray-400">
          Search and browse rules, prompts, and skills.
        </p>

        {/* Tabs: Rules | Prompts | Skills */}
        <div className="mt-6 flex gap-1 rounded-lg border border-charcoal-700 bg-charcoal-800/50 p-1">
          {TAB_TYPES.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              onClick={() => {
                setType(tab.value);
                setPage(1);
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                type === tab.value
                  ? "bg-mint-500 text-charcoal-900"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input
            type="search"
            placeholder="Search..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="input-field max-w-xs"
          />
          {tagsData && tagsData.length > 0 && (
            <select
              value={tags[0] ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setTags(v ? [v] : []);
                setPage(1);
              }}
              className="input-field max-w-[140px]"
            >
              <option value="">All tags</option>
              {tagsData.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {isLoggedIn && (
            <select
              value={visibility}
              onChange={(e) => {
                setVisibility(e.target.value as "public" | "org" | "all");
                setPage(1);
              }}
              className="input-field max-w-[140px]"
            >
              <option value="public">Public only</option>
              <option value="all">Public + my orgs</option>
              <option value="org">My orgs only</option>
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "popular" | "createdAt");
              setPage(1);
            }}
            className="input-field max-w-[140px]"
          >
            <option value="popular">Sort: Most used</option>
            <option value="createdAt">Sort: Newest</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-charcoal-700">
          {isLoading && (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          )}
          {error && (
            <div className="p-8 text-center text-red-400">Failed to load items.</div>
          )}
          {data && !isLoading && (
            <>
              <table className="w-full min-w-[800px]">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-charcoal-700 bg-charcoal-800/50">
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr className="border-b border-charcoal-800 hover:bg-charcoal-800/30">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr className="bg-charcoal-800/50">
                          <td colSpan={columns.length} className="px-4 py-3">
                            <div className="space-y-4">
                              {(row.original.type === "rule" || row.original.type === "skill") &&
                                row.original.slug && (
                                  <div className="rounded border border-charcoal-700 bg-charcoal-900 p-4">
                                    <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                                      CLI add command
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <code className="flex-1 rounded bg-charcoal-800 px-3 py-2 font-mono text-sm text-mint-400">
                                        codemint add @{row.original.type}/{row.original.slug}
                                      </code>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard?.writeText(
                                            `codemint add @${row.original.type}/${row.original.slug}`
                                          ).catch(() => {});
                                          trackCopy(row.original.id);
                                        }}
                                        className="rounded border border-charcoal-600 px-3 py-2 text-sm text-gray-400 hover:border-mint-500 hover:text-mint-400"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  </div>
                                )}
                              <div className="rounded border border-charcoal-700 bg-charcoal-900 p-4">
                                <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                                  Content
                                </p>
                                <div className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                                  {row.original.snippet || (row.original.content ?? "").slice(0, 500)}
                                  {(row.original.content?.length ?? 0) > 500 && "…"}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-charcoal-700 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Total: {data.total} • Page {data.page} of{" "}
                  {Math.ceil(data.total / data.pageSize) || 1}
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
                    disabled={page >= Math.ceil(data.total / data.pageSize)}
                    className="btn-outline disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {data?.data.length === 0 && !isLoading && (
          <p className="mt-8 text-center text-gray-500">
            Nothing minted yet — add your first clean prompt or try different filters.
          </p>
        )}
      </main>
    </div>
  );
}
