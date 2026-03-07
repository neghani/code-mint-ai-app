<p align="center">
  <img src="icon.png" alt="CodeMint" width="120" />
</p>

<h1 align="center">CodeMint</h1>

<p align="center">
  <strong>A shared catalog for AI coding rules and skills — so your team and your tools stay in sync.</strong>
</p>

<p align="center">
  <a href="https://codemint.app"><img src="https://img.shields.io/badge/website-codemint.app-brightgreen" alt="Website" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=codemint.codemint"><img src="https://img.shields.io/visual-studio-marketplace/v/codemint.codemint?label=VS%20Code%20Extension&color=blue" alt="VS Code Extension" /></a>
  <a href="https://github.com/neghani/code-mint-cli/releases"><img src="https://img.shields.io/github/v/release/neghani/code-mint-cli?label=CLI&color=orange" alt="CLI" /></a>
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="MIT License" />
</p>

<p align="center">
  Works with <strong>Cursor · Cline · Windsurf · Continue · GitHub Copilot · Claude · Codex</strong>
</p>

---

## What is CodeMint?

CodeMint lets you create, organize, and reuse **rules**, **prompts**, and **skills** across all major AI coding tools. Publish items with versioned slugs, search by tech stack, share within organizations, and pull everything into any repo with one command — via the CLI or the VS Code extension.

---

## The Ecosystem

| | |
|---|---|
| **[codemint.app](https://codemint.app)** | The hosted catalog — browse, create, and manage rules, prompts, and skills |
| **[VS Code Extension](https://marketplace.visualstudio.com/items?itemName=codemint.codemint)** | Install and sync catalog items directly from VS Code or Cursor |
| **[CLI](https://github.com/neghani/code-mint-cli)** · [releases →](https://github.com/neghani/code-mint-cli/releases) | Install and sync from the terminal; scriptable and CI-friendly |
| **This repo** | The self-hostable web app — run your own private CodeMint instance |

> **Public Beta — free to use.**  
> [codemint.app](https://codemint.app) is free. It may respond slowly under load; please wait if it does. Organizations can self-host this repo for a fully private catalog.

---

## Key Features

- **Catalog** — Publish and version rules and skills with slugs (`@rule/react-best-practices`, `@skill/prisma-patterns`). Full-text search, tags, and visibility (public or org-only).
- **Teams** — Organizations with roles (admin, member, viewer). Invite by email; keep rules and skills scoped to your org.
- **Tool-agnostic install** — The CLI and extension write files into the correct paths per AI tool (`.cursor/rules/`, `.cline/`, `.github/instructions/`, etc.) and track everything in `.codemint/manifest.json`.
- **API** — REST API with session or Bearer token auth. Use it from scripts, CI, or your own tooling.

---

## How It Works

1. **Create** — Add rules and skills in the app (or via API). Tag by tech stack (e.g. `tech:react`, `tool:prisma`) and set visibility.
2. **Search** — Find items in the app or via API. Filter by type, tags, and org.
3. **Install** — Pull items into your project with the CLI or the VS Code extension. Files are written to the right folder for your AI tool automatically.
4. **Sync** — Keep items up to date. Both the CLI and the extension use `.codemint/manifest.json` to track installed versions and pull updates.

---

## Install into Your Project

### VS Code / Cursor Extension

Search **CodeMint** in the Extensions view or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=codemint.codemint).

### CLI

```bash
npm install -g codemint
```

See [CLI releases](https://github.com/neghani/code-mint-cli/releases) for the latest version and release notes.

**Common commands:**

```bash
codemint login                       # authenticate via browser
codemint add @rule/react-best-practices  # install a rule
codemint sync                        # update all installed items
codemint list                        # show installed items
```

---

## Supported AI Tools

| Tool | Files written to |
|---|---|
| Cursor | `.cursor/rules/` |
| Cline | `.cline/` or `.clinerules` |
| Windsurf | `.windsurf/` |
| Continue | `.continue/` |
| GitHub Copilot | `.github/instructions/` |
| Claude | `CLAUDE.md` or `.claude/` |
| Codex | `.codex/` |

---

## Organizations & Self-hosting

Self-host this repo to run a private CodeMint instance for your organization.

**Requirements:** Node.js 18+, PostgreSQL

**Quick start:**

```bash
git clone https://github.com/neghani/code-mint-ai-app
cd code-mint-ai-app
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NEXT_PUBLIC_APP_URL
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

**Deploy options:**
- **Netlify** — `netlify.toml` is included; set env vars in the Netlify dashboard.
- **Docker** — Build with `NEXT_STANDALONE=true`; set env vars at runtime.
- **Any Node host** — Set the same env vars and run `npm run build && npm start`.

Once your instance is running, point the **VS Code extension** or **CLI** at it:

```bash
# CLI
codemint config set baseUrl https://codemint.yourcompany.com

# VS Code extension
# Command Palette → CodeMint: Set app URL
```

---

## Tech Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Prisma ORM)  
Auth: JWT in httpOnly cookies (web) and Bearer tokens (CLI / API)  
Full-text search via PostgreSQL

---

## Documentation

| Doc | Description |
|---|---|
| [CLI integration](docs/cli-integration.md) | Auth flow, catalog API, identifier format |
| [Extension spec](docs/EXTENSION_SPEC.md) | VS Code / Cursor extension behavior and design |
| [Deploy guide](DEPLOY.md) | Deployment options and environment variables |
| [Repo coordination](docs/REPO_COORDINATION.md) | How this app and the CLI repo stay in sync |
| [Security](docs/security.md) | Auth, token handling, and security model |

---

## License

[MIT](LICENSE) — © [CodeMint](https://codemint.app)

---

<p align="center">
  <a href="https://codemint.app">codemint.app</a> ·
  <a href="https://marketplace.visualstudio.com/items?itemName=codemint.codemint">VS Code Extension</a> ·
  <a href="https://github.com/neghani/code-mint-cli">CLI</a> ·
  <a href="https://github.com/neghani/code-mint-cli/releases">CLI Releases</a> ·
  <a href="https://github.com/neghani/code-mint-ai-app/issues">Report an issue</a>
</p>
