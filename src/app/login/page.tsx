"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") ?? undefined;
  const nextUrl = searchParams.get("next") ?? undefined;
  const decoded = nextUrl ? decodeURIComponent(nextUrl) : "";
  const redirectTo = decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : "/explore";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          router.replace(redirectTo);
          return;
        }
        setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
  }, [router, redirectTo]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { email, password, name };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.error || "Request failed");
        setLoading(false);
        return;
      }
      if (inviteToken) {
        const acceptRes = await fetch("/api/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken }),
          credentials: "include",
        });
        if (!acceptRes.ok) {
          const err = await acceptRes.json();
          setError(err.error || "Invite accept failed");
          setLoading(false);
          return;
        }
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-charcoal-700 bg-charcoal-800/80 p-8 shadow-xl">
        <div className="text-center">
          <Link href="/" className="text-xl font-semibold text-mint-400">
            CodeMintAI
          </Link>
          <p className="mt-1 text-sm text-gray-500">Build Smart. Build Safe.</p>
        </div>
        <h1 className="mt-6 text-lg font-semibold text-white">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>
        {inviteToken && (
          <p className="mt-2 text-sm text-mint-400">You&apos;re joining via invite link.</p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1"
              required
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="block text-sm text-gray-400">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field mt-1"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field mt-1"
              required
              minLength={mode === "register" ? 8 : 1}
            />
            {mode === "register" && (
              <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
            )}
          </div>
          {error && (
            <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <button type="submit" className="btn-mint w-full" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError("");
          }}
          className="mt-4 w-full text-center text-sm text-mint-400 hover:underline"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
      <Link href="/" className="mt-6 text-sm text-gray-500 hover:text-gray-400">
        ← Back to home
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
