"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";

type User = { id: string; email: string; name: string | null } | null;

function useAuth() {
  const { data, isLoading } = useQuery<{ user: User }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
    staleTime: 60 * 1000,
  });
  return { user: data?.user ?? null, isLoading };
}

function HeroCTA() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    return (
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/explore" className="btn-mint">
          Go to Explore
        </Link>
        <Link href="/mint" className="btn-outline">
          Mint New Item
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      <Link href="/explore" className="btn-mint">
        Explore Catalog
      </Link>
      <Link href="/login" className="btn-outline">
        Sign Up Free
      </Link>
    </div>
  );
}

function BottomCTA() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    return (
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/explore" className="btn-mint">
          Browse Rules & Skills
        </Link>
        <Link href="/org" className="btn-outline">
          Manage Orgs
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-8 flex justify-center gap-4">
      <Link href="/explore" className="btn-mint">
        Explore Public Library
      </Link>
      <Link href="/login" className="btn-outline">
        Create Account
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header variant="minimal" />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-mint-400">
            Open Catalog for AI Coding
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Build Smart. Build Safe.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
            Create, share, and sync AI rules, prompts, and coding skills across Cursor, Cline,
            Copilot, Claude, and more. One catalog for your team — install into any repo with the
            CLI or VS Code extension.
          </p>
          <HeroCTA />
          <p className="mt-6 text-sm text-gray-500">
            Free to use &middot; CLI &amp; extension ready &middot; Multi-tool support
          </p>
        </section>

        {/* CLI — priority: try it right after the hook */}
        <section className="border-t border-charcoal-800 bg-charcoal-800/50 py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-semibold text-white">
              Your Repo Knows What Rules It Needs
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-gray-400">
              The CLI scans your project, detects your tech stack, and asks the CodeMint catalog
              for matching rules and skills. Then you install the ones you want — in one command.
            </p>

            <div className="mt-10 space-y-4 rounded-xl border border-charcoal-700 bg-charcoal-900 p-6 font-mono text-sm">
              <p className="text-gray-500"># macOS / Linux — one-line install</p>
              <p className="text-gray-200 break-all">
                curl -fsSL https://github.com/neghani/code-mint-cli/releases/latest/download/install.sh | sh
              </p>

              <p className="mt-3 text-gray-500"># Or download directly (v0.1.0)</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://github.com/neghani/code-mint-cli/releases/download/v0.1.0/codemint_0.1.0_windows_amd64.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-charcoal-600 bg-charcoal-800 px-3 py-1.5 text-xs text-mint-400 hover:border-mint-500 hover:bg-charcoal-700"
                >
                  Windows (amd64)
                </a>
                <a
                  href="https://github.com/neghani/code-mint-cli/releases/download/v0.1.0/codemint_0.1.0_darwin_arm64.tar.gz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-charcoal-600 bg-charcoal-800 px-3 py-1.5 text-xs text-mint-400 hover:border-mint-500 hover:bg-charcoal-700"
                >
                  macOS Apple Silicon (arm64)
                </a>
                <a
                  href="https://github.com/neghani/code-mint-cli/releases/download/v0.1.0/codemint_0.1.0_darwin_amd64.tar.gz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-charcoal-600 bg-charcoal-800 px-3 py-1.5 text-xs text-mint-400 hover:border-mint-500 hover:bg-charcoal-700"
                >
                  macOS Intel (amd64)
                </a>
              </div>

              <div className="my-3 border-t border-charcoal-800" />

              <p className="text-gray-500"># 1. Log in — opens browser, stores token locally</p>
              <p className="text-mint-400">codemint auth login</p>

              <p className="mt-3 text-gray-500"># 2. Set your AI tool (once per repo)</p>
              <p className="text-mint-400">codemint tool set cursor</p>

              <p className="mt-3 text-gray-500"># 3. Scan repo and get rule suggestions from catalog</p>
              <p className="text-mint-400">codemint suggest .</p>
              <div className="mt-1 rounded border border-charcoal-700 bg-charcoal-800 px-3 py-2 text-xs text-gray-400">
                <p>Detected: lang:typescript, tech:nextjs, tool:prisma</p>
                <p className="mt-1">Recommendation &nbsp; Reason</p>
                <p>@rule/nextjs-api-safety &nbsp; Matched 2 detected tags</p>
                <p>@rule/prisma-best-practices &nbsp; Matched 1 detected tag</p>
                <p>@skill/typescript-patterns &nbsp; Matched 2 detected tags</p>
              </div>

              <p className="mt-3 text-gray-500"># 4. Install a rule — written to .cursor/rules/ automatically</p>
              <p className="text-mint-400">codemint add @rule/nextjs-api-safety</p>

              <p className="mt-3 text-gray-500"># 5. Keep rules up to date</p>
              <p className="text-mint-400">codemint sync</p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="https://github.com/neghani/code-mint-cli/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-sm"
              >
                Latest release
              </a>
              <a
                href="https://github.com/neghani/code-mint-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-sm"
              >
                CLI repo
              </a>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-t border-charcoal-800 bg-charcoal-800/50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-semibold text-white">
              AI Coding Is Fast — But Rules Are Scattered
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-charcoal-700 bg-charcoal-900 p-6">
                <h3 className="font-medium text-mint-400">Scattered Prompts</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Rules live in chats, docs, and threads. Hard to find, harder to trust.
                </p>
              </div>
              <div className="rounded-xl border border-charcoal-700 bg-charcoal-900 p-6">
                <h3 className="font-medium text-mint-400">No Standard Format</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Each AI tool has its own rules format. Cursor uses .mdc, Copilot uses
                  .instructions.md, Claude uses CLAUDE.md.
                </p>
              </div>
              <div className="rounded-xl border border-charcoal-700 bg-charcoal-900 p-6">
                <h3 className="font-medium text-mint-400">No Team Memory</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Teams repeat the same prompt experiments. Best practices stay in one
                  person&apos;s head.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-semibold text-white">
              One Catalog. Every Tool. Every Team.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-mint-500/30 bg-charcoal-800/50 p-6">
                <h3 className="font-medium text-mint-400">Rules &amp; Skills Catalog</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Publish versioned rules and skills with slugs. Full-text search, tags, and
                  visibility controls.
                </p>
              </div>
              <div className="rounded-xl border border-mint-500/30 bg-charcoal-800/50 p-6">
                <h3 className="font-medium text-mint-400">Multi-Tool Sync</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Install once — files are written in the right format for Cursor, Cline, Copilot,
                  Windsurf, Claude, or Codex.
                </p>
              </div>
              <div className="rounded-xl border border-mint-500/30 bg-charcoal-800/50 p-6">
                <h3 className="font-medium text-mint-400">CLI &amp; Extension</h3>
                <p className="mt-2 text-sm text-gray-400">
                  <code className="text-mint-400">codemint add @rule/slug</code> — pull rules and
                  skills into any repo from the terminal or VS Code.
                </p>
              </div>
              <div className="rounded-xl border border-mint-500/30 bg-charcoal-800/50 p-6">
                <h3 className="font-medium text-mint-400">Team Orgs</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Share within your org or publish to the public catalog. Role-based access for
                  admins, members, and viewers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl font-semibold text-white">
              Start Building Your AI Coding Standards
            </h2>
            <p className="mt-2 text-gray-400">
              Your team&apos;s AI coding memory — clean, safe, searchable, and portable.
            </p>
            <BottomCTA />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-charcoal-800 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div>
              <span className="text-lg font-semibold text-mint-400">CodeMintAI</span>
              <p className="mt-1 text-sm text-gray-500">Build Smart. Build Safe.</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <a
                href="https://github.com/neghani/code-mint-cli/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                CLI releases
              </a>
              <a
                href="https://github.com/neghani/code-mint-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                GitHub
              </a>
              <a
                href="https://discord.gg/bfnPkdwt"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                Discord
              </a>
              <a
                href="https://www.linkedin.com/in/ganeshpilli/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                LinkedIn
              </a>
              <Link href="/explore" className="hover:text-white">
                Explore
              </Link>
              <Link href="/login" className="hover:text-white">
                Sign In
              </Link>
            </div>
          </div>
          <div className="mt-6 border-t border-charcoal-800 pt-4 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} CodeMintAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
