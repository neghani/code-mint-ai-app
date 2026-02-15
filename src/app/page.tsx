import Link from "next/link";
import { Header } from "@/components/header";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header variant="minimal" />

      <main>
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Build Smart. Build Safe.
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            A clean, searchable workspace for AI prompts, rules, and coding skills — built for
            modern developer teams.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/explore" className="btn-mint">
              Explore Prompts
            </Link>
            <Link href="/login" className="btn-outline">
              Join Workspace
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Clean patterns • Safe AI usage • Team-ready prompt vault
          </p>
        </section>

        {/* Problem */}
        <section className="border-t border-charcoal-800 bg-charcoal-800/50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-semibold text-white">
              AI Coding Is Fast — But Not Always Clean or Safe
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-charcoal-700 bg-charcoal-900 p-6">
                <h3 className="text-mint-400">Scattered Prompts</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Prompts live in chats, docs, and threads — hard to find, harder to trust.
                </p>
              </div>
              <div className="rounded-xl border border-charcoal-700 bg-charcoal-900 p-6">
                <h3 className="text-mint-400">Risky AI Output</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Unsafe or low-quality prompts lead to fragile code and bad practices.
                </p>
              </div>
              <div className="rounded-xl border border-charcoal-700 bg-charcoal-900 p-6">
                <h3 className="text-mint-400">No Team Memory</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Teams repeat the same prompt experiments again and again.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-semibold text-white">
              One Minted Source of Truth for AI Coding
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-mint-500/30 bg-charcoal-800/50 p-6">
                <h3 className="font-medium text-mint-400">Prompt Vault</h3>
                <p className="mt-2 text-sm text-gray-400">
                  Store reusable AI prompts and rules in one searchable place.
                </p>
              </div>
              <div className="rounded-xl border border-mint-500/30 bg-charcoal-800/50 p-6">
                <h3 className="font-medium text-mint-400">Clean Patterns</h3>
                <p className="mt-2 text-sm text-gray-400">Capture proven, clean coding prompt patterns.</p>
              </div>
              <div className="rounded-xl border border-mint-500/30 bg-charcoal-800/50 p-6">
                <h3 className="font-medium text-mint-400">Safe Usage</h3>
                <p className="mt-2 text-sm text-gray-400">Document guardrails and safe AI practices.</p>
              </div>
              <div className="rounded-xl border border-mint-500/30 bg-charcoal-800/50 p-6">
                <h3 className="font-medium text-mint-400">Team Scope</h3>
                <p className="mt-2 text-sm text-gray-400">Share within your org or keep public collections.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-charcoal-800 bg-charcoal-800/50 py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-2xl font-semibold text-white">
              Start Minting Clean AI Prompts Today
            </h2>
            <p className="mt-2 text-gray-400">
              Your team&apos;s AI coding memory — clean, safe, searchable.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/explore" className="btn-mint">
                Explore Public Library
              </Link>
              <Link href="/login" className="btn-outline">
                Create Workspace
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-charcoal-800 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          CodeMintAI — Build Smart. Build Safe.
        </div>
      </footer>
    </div>
  );
}
