# CodeMintAI

**A shared catalog for AI coding rules and skills — so your team and your tools stay in sync.**

CodeMintAI is a web app that lets you create, organize, and reuse prompts, rules, and skills across Cursor, Cline, Copilot, Claude, and other AI coding tools. Search by tech stack, share via organizations, and pull rules and skills into any repo with the CLI or VS Code extension.

---

## What it does

- **Catalog** — Publish and version rules and skills with slugs (`@rule/react-best-practices`, `@skill/prisma-patterns`). Full-text search, tags, and visibility (public or org-only).
- **Teams** — Organizations with roles (admin, member, viewer). Invite by email, keep rules and skills scoped to your org.
- **CLI & extension** — Install from the catalog into your project. The [CodeMint CLI](docs/cli-integration.md) and VS Code extension resolve refs, write files in the right format per tool (e.g. `.cursor/rules/*.mdc`, `.cline/skills/`), and keep a manifest for sync.
- **API** — REST API with session or API-token auth. Use it from scripts, CI, or your own tools.

---

## Who it’s for

- **Developers** — One place to store and discover rules and skills; install into any repo in one command.
- **Teams** — Shared org catalog, consistent rules across the team, and control over who can edit.
- **Tool-agnostic** — Same catalog works with Cursor, Cline, Windsurf, Continue, GitHub Copilot, Claude, and Codex. Install once, target the tools you use.

---

## How it works

1. **Create** rules and skills in the app (or via API). Add tags (e.g. `tech:react`, `tool:prisma`) and set visibility.
2. **Search** in the app or via API. Filter by type, tags, and org.
3. **Install** with the CLI (`codemint add @rule/<slug>`) or the VS Code extension. The tool writes files into the correct paths for your chosen AI tool.
4. **Sync** to pull updates. The CLI and extension use `.codemint/manifest.json` to track installed items and compare with the catalog.

CLI authentication uses a browser-based flow: you sign in at `/cli-auth`, authorize the CLI, and the app redirects back with a token. See [CLI integration](docs/cli-integration.md) for API details.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [CLI integration](docs/cli-integration.md) | Auth flow, catalog and items API, identifier format. |
| [CLI gaps](docs/CLI_GAPS.md) | Known gaps and fixes for the CodeMint CLI. |
| [Extension spec](docs/EXTENSION_SPEC.md) | VS Code / Cursor extension behavior and design. |

---

## Tech stack

Next.js 15 (App Router), TypeScript, Tailwind CSS, PostgreSQL (Prisma). Auth: JWT in httpOnly cookies; CLI/API: Bearer tokens. Full-text search via PostgreSQL.

---

## Development and self-hosting

**Local run** — Use an existing Postgres instance. Set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `NEXT_PUBLIC_APP_URL` in `.env`, then:

```bash
npm install && npx prisma db push && npx prisma db seed && npm run dev
```

**Deploy** — Netlify (see `netlify.toml`), or any Node host. Set the same env vars; for production DB use a managed Postgres (e.g. Neon, Supabase).

**Docker** — Build with `NEXT_STANDALONE=true` and run the standalone output with `DATABASE_URL` and JWT secrets set.

**Scripts** — `npm run dev` | `build` | `start`; `npx prisma db push` | `db seed` | `db studio`; `npm run cli:auth` to test the CLI auth flow against the running app.

---

CodeMintAI — Build smart. Build safe.
