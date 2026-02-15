"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";

type Org = {
  id: string;
  name: string;
  createdAt: string;
  members?: { id: string; role: string }[];
};

export default function OrgPage() {
  const queryClient = useQueryClient();
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");

  const { data: orgs, isLoading, error } = useQuery<Org[]>({
    queryKey: ["org", "my"],
    queryFn: async () => {
      const res = await fetch("/api/org/my", { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to load orgs");
      return res.json();
    },
  });

  const createOrg = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error?.message || d.error || "Failed to create org");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "my"] });
      setCreateName("");
      setCreateError("");
    },
    onError: (e: Error) => {
      setCreateError(e.message);
    },
  });

  // Redirect to login if unauthenticated (handled by showing message + link)
  if (error instanceof Error && error.message === "Unauthorized") {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-12 text-center">
          <p className="text-gray-400">You need to be logged in to view your organizations.</p>
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-white">My organizations</h1>
        <p className="mt-1 text-gray-400">
          Create an organization to invite teammates and scope items to a workspace.
        </p>

        {/* Create org */}
        <div className="mt-8 rounded-lg border border-charcoal-700 bg-charcoal-800/50 p-6">
          <h2 className="text-lg font-medium text-white">Create organization</h2>
          <form
            className="mt-4 flex flex-wrap items-end gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const name = createName.trim();
              if (!name) {
                setCreateError("Name is required");
                return;
              }
              createOrg.mutate(name);
            }}
          >
            <div className="min-w-[200px]">
              <label htmlFor="org-name" className="block text-sm text-gray-400">
                Organization name
              </label>
              <input
                id="org-name"
                type="text"
                value={createName}
                onChange={(e) => {
                  setCreateName(e.target.value);
                  setCreateError("");
                }}
                className="input-field mt-1"
                placeholder="e.g. Acme Team"
                disabled={createOrg.isPending}
              />
            </div>
            <button type="submit" className="btn-mint" disabled={createOrg.isPending}>
              {createOrg.isPending ? "Creating…" : "Create organization"}
            </button>
          </form>
          {createError && <p className="mt-2 text-sm text-red-400">{createError}</p>}
        </div>

        {/* List orgs */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-white">Your organizations</h2>
          {isLoading && <p className="mt-4 text-gray-500">Loading…</p>}
          {orgs?.length === 0 && !isLoading && (
            <p className="mt-4 text-gray-500">You are not in any organization yet. Create one above.</p>
          )}
          {orgs && orgs.length > 0 && (
            <ul className="mt-4 space-y-3">
              {orgs.map((org) => (
                <li
                  key={org.id}
                  className="flex items-center justify-between rounded-lg border border-charcoal-700 bg-charcoal-800/30 px-4 py-3"
                >
                  <div>
                    <span className="font-medium text-white">{org.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {org.members?.length ?? 0} member{(org.members?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/org/${org.id}`}
                      className="text-sm text-mint-400 hover:underline"
                    >
                      Manage
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
