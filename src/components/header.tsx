"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type User = { id: string; email: string; name: string | null } | null;

async function fetchMe(): Promise<{ user: User }> {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  return res.json();
}

async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export function Header({ variant = "default" }: { variant?: "default" | "minimal" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 60 * 1000,
  });
  const user = data?.user ?? null;

  async function handleLogout() {
    await logout();
    queryClient.setQueryData(["auth", "me"], { user: null });
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    await queryClient.invalidateQueries({ queryKey: ["items", "search"] });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-charcoal-700 bg-charcoal-900/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold text-mint-400">
          CodeMintAI
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/explore" className="text-gray-300 hover:text-white">
            Explore
          </Link>

          {isLoading ? (
            <span className="text-gray-500">...</span>
          ) : user ? (
            <>
              <Link href="/mint" className="text-gray-300 hover:text-white">
                Mint
              </Link>
              <Link href="/org" className="text-gray-300 hover:text-white">
                My Orgs
              </Link>
              <span
                className="max-w-[120px] truncate text-gray-400"
                title={user.email}
              >
                {user.name || user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-outline text-sm"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white">
                Log in
              </Link>
              {variant === "minimal" ? (
                <Link href="/login?mode=register" className="btn-mint text-sm">
                  Sign Up
                </Link>
              ) : (
                <Link href="/login" className="btn-mint text-sm">
                  Join
                </Link>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
