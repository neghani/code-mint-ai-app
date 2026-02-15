"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";

type Tag = { id: string; name: string; category: string };
type Org = { id: string; name: string };

export default function MintPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"rule" | "prompt" | "skill">("prompt");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "org">("public");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tags");
      return res.json();
    },
  });

  const { data: me } = useQuery<{ user: unknown }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
  });
  const isLoggedIn = !!me?.user;

  const { data: orgs = [] } = useQuery<Org[]>({
    queryKey: ["org", "my"],
    queryFn: async () => {
      const res = await fetch("/api/org/my", { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((o: Org) => ({ id: o.id, name: o.name }));
    },
  });

  const createItem = useMutation({
    mutationFn: async (body: {
      title: string;
      content: string;
      type: string;
      visibility: string;
      orgId: string | null;
      tagIds: string[];
    }) => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        const msg = d.error?.message || (typeof d.error === "object" ? JSON.stringify(d.error) : d.error) || "Failed to create";
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", "search"] });
      router.push("/explore");
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const finalOrgId = visibility === "org" ? orgId : null;
    if (visibility === "org" && !finalOrgId) {
      setError("Select an organization when visibility is org");
      return;
    }
    createItem.mutate({
      title: title.trim(),
      content: content.trim(),
      type,
      visibility,
      orgId: finalOrgId,
      tagIds,
    });
  }

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <p className="text-gray-400">Log in to mint prompts, rules, and skills.</p>
          <Link href="/login" className="btn-mint mt-4 inline-block">
            Log in
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-400">
          ← Explore
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Mint New Rule</h1>
        <p className="mt-1 text-gray-400">
          Add a prompt, rule, or skill. Clean in, clean out.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-400">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field mt-1"
              placeholder="e.g. Safe API route pattern"
              required
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-400">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field mt-1 min-h-[120px]"
              placeholder="Paste or write your prompt, rule, or skill..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Type</label>
            <div className="mt-2 flex gap-4">
              {(["rule", "prompt", "skill"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="rounded border-charcoal-600 bg-charcoal-800 text-mint-500"
                  />
                  <span className="text-gray-300 capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400">Tags</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <label key={t.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={tagIds.includes(t.id)}
                      onChange={() => toggleTag(t.id)}
                      className="rounded border-charcoal-600 bg-charcoal-800 text-mint-500"
                    />
                    <span className="text-sm text-gray-300">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400">Visibility</label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="rounded border-charcoal-600 bg-charcoal-800 text-mint-500"
                />
                <span className="text-gray-300">Public</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  value="org"
                  checked={visibility === "org"}
                  onChange={() => setVisibility("org")}
                  className="rounded border-charcoal-600 bg-charcoal-800 text-mint-500"
                />
                <span className="text-gray-300">Org only</span>
              </label>
            </div>
            {visibility === "org" && orgs.length > 0 && (
              <select
                value={orgId ?? ""}
                onChange={(e) => setOrgId(e.target.value || null)}
                className="input-field mt-2 max-w-xs"
                required={visibility === "org"}
              >
                <option value="">Select organization</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-4">
            <button type="submit" className="btn-mint" disabled={createItem.isPending}>
              {createItem.isPending ? "Minting…" : "Mint"}
            </button>
            <Link href="/explore" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
