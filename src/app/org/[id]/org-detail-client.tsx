"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";

const INVITE_MESSAGE_TEMPLATE = `Hi,

You're invited to join CodeMintAI — Build Smart. Build Safe.

We maintain a shared workspace of clean AI prompts, rules, and coding skills for safer and smarter development.

Join using this link:
{{INVITE_LINK}}

Steps:
1. Open the link
2. Sign up or log in
3. You'll be added automatically

If the link expires, request a new one.

Thanks,
{{SENDER_NAME}}`;

type Member = { id: string; userId: string; role: string; email: string; name: string | null };

export function OrgDetailClient({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const { data: me } = useQuery<{ user: { id: string; name: string | null; email: string } | null }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
  });
  const senderName = me?.user?.name || me?.user?.email || "Your teammate";
  const currentUserId = me?.user?.id ?? null;

  const { data: members, isLoading, error } = useQuery<Member[]>({
    queryKey: ["org", orgId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/org/${orgId}/members`, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (res.status === 404) throw new Error("Not found");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const createInvite = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(`/api/org/${orgId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error?.message || d.error || "Failed to create invite");
      }
      return res.json() as Promise<{ inviteLink: string }>;
    },
    onSuccess: (data) => {
      setLastInviteLink(data.inviteLink);
      setInviteEmail("");
      setInviteError("");
    },
    onError: (e: Error) => setInviteError(e.message),
  });

  function copyInviteMessage(link: string) {
    const text = INVITE_MESSAGE_TEMPLATE.replace("{{INVITE_LINK}}", link).replace(
      "{{SENDER_NAME}}",
      senderName
    );
    navigator.clipboard.writeText(text);
  }

  const isAdmin = members?.find((m) => m.userId === currentUserId)?.role === "admin";

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/org/${orgId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId, "members"] });
    },
  });

  const { data: orgItems } = useQuery<{ data: { id: string; title: string; type: string }[] }>({
    queryKey: ["items", "search", orgId, "org"],
    queryFn: async () => {
      const res = await fetch(
        `/api/items/search?org=${encodeURIComponent(orgId)}&visibility=org&limit=20`,
        { credentials: "include" }
      );
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-gray-400">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Link href="/org" className="btn-outline mt-4 inline-block">
            ← Back to My orgs
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/org" className="text-sm text-gray-500 hover:text-gray-400">
          ← My orgs
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Organization</h1>
        <p className="mt-1 text-gray-400">Members and invites.</p>

        {/* Invite generator */}
        <div className="mt-8 rounded-lg border border-charcoal-700 bg-charcoal-800/50 p-6">
          <h2 className="text-lg font-medium text-white">Invite member</h2>
          <form
            className="mt-4 flex flex-wrap items-end gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const email = inviteEmail.trim();
              if (!email) {
                setInviteError("Email is required");
                return;
              }
              createInvite.mutate(email);
            }}
          >
            <div className="min-w-[200px]">
              <label htmlFor="invite-email" className="block text-sm text-gray-400">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError("");
                }}
                className="input-field mt-1"
                placeholder="teammate@example.com"
                disabled={createInvite.isPending}
              />
            </div>
            <button type="submit" className="btn-mint" disabled={createInvite.isPending}>
              {createInvite.isPending ? "Creating…" : "Create invite"}
            </button>
          </form>
          {inviteError && <p className="mt-2 text-sm text-red-400">{inviteError}</p>}
          {lastInviteLink && (
            <div className="mt-4">
              <p className="text-sm text-gray-400">Invite link created. Copy the message to share:</p>
              <button
                type="button"
                onClick={() => copyInviteMessage(lastInviteLink)}
                className="btn-outline mt-2"
              >
                Copy Invite Message
              </button>
            </div>
          )}
        </div>

        {isLoading && <p className="mt-6 text-gray-500">Loading members…</p>}
        {members && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-white">Members</h2>
            <ul className="mt-3 space-y-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-4 rounded border border-charcoal-700 px-4 py-2"
                >
                  <span className="text-gray-300">{m.email}</span>
                  {isAdmin ? (
                    <select
                      value={m.role}
                      onChange={(e) =>
                        updateRole.mutate({ userId: m.userId, role: e.target.value })
                      }
                      className="input-field max-w-[120px] py-1 text-sm"
                    >
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                      <option value="viewer">viewer</option>
                    </select>
                  ) : (
                    <span className="rounded bg-charcoal-600 px-2 py-0.5 text-xs text-mint-400">
                      {m.role}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {orgItems && orgItems.data.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-white">Org items</h2>
            <p className="mt-1 text-sm text-gray-500">
              Items scoped to this organization (visibility: org).
            </p>
            <ul className="mt-3 space-y-2">
              {orgItems.data.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded border border-charcoal-700 px-4 py-2"
                >
                  <span className="text-gray-300">{item.title}</span>
                  <span className="rounded bg-charcoal-600 px-2 py-0.5 text-xs text-mint-400">
                    {item.type}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href={`/explore?visibility=org&org=${orgId}`}
              className="mt-2 inline-block text-sm text-mint-400 hover:underline"
            >
              View all in Explore →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
