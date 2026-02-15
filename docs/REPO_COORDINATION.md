# CodeMint: App and CLI repo coordination

## Repos

| Repo | Purpose |
|------|--------|
| **code-mint-ai** (this repo) | Web app, API, auth, catalog, `/cli-auth`, and docs. Serves install script at `/cli/install.sh`. |
| **neghani/code-mint-cli** (code-mint-ali-cli) | Go CLI: `codemint` (auth, scan, suggest, add, sync, list, remove, tool, doctor). |

The CLI is developed in a **separate repository**. This app is the backend; it does not contain the CLI source.

## Install script sync

- The app serves a copy of the CLI install script at **`/cli/install.sh`** (Next.js route reads `scripts/install-cli.sh`).
- **Source of truth:** [neghani/code-mint-cli](https://github.com/neghani/code-mint-cli) → `scripts/install.sh` (and root `install.sh` that redirects to it).
- When updating install behavior (e.g. `REPO`, `BINARY`, new OS/arch), update the CLI repo first, then copy the content into this repo’s **`scripts/install-cli.sh`** so the app’s one-liner stays in sync.
- Users can install either via:
  - App: `curl -fsSL https://<app-url>/cli/install.sh | sh`
  - GitHub: `curl -fsSL https://raw.githubusercontent.com/neghani/code-mint-cli/main/install.sh | sh`

## Docs that reference both repos

- **Backend API (this repo):** [cli-integration.md](cli-integration.md) — auth, catalog, items, errors.
- **CLI gaps and fixes:** [CLI_GAPS.md](CLI_GAPS.md) — issues and status in the CLI repo.
- **CLI execution plan:** In the CLI repo: `CODEMINT_CLI_EXECUTION_PLAN.md`.
- **Feature ideas / roadmap:** In the CLI repo: `FEATURES_ROADMAP.md`; summary in this doc below.

## Feature roadmap (summary)

See the CLI repo’s **FEATURES_ROADMAP.md** for the full list. Highlights:

- **Backend (this app):** Login `next` redirect for `/cli-auth`, token list/revoke API stability, optional token expiry.
- **CLI:** Windows credential read, tool auto-detect from workspace, checksum on install, manifest `lastSyncAt`, file locking, `--debug` logging, `--force` on add, `doctor` API check, shell completion, self-upgrade, token list/revoke commands.
