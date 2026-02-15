# CodeMint CLI Integration TODO

**CLI repo:** [neghani/code-mint-cli](https://github.com/neghani/code-mint-cli) (code-mint-ali-cli). This app (code-mint-ai) is the backend; the CLI is developed in the separate repo.

## Phase 0: Scope and Contracts
- [x] Finalize CLI command set for v1 (implemented in CLI repo):
  - [x] `codemint scan [path]`
  - [x] `codemint suggest`
  - [x] `codemint add @rule/<slug>` / `@skill/<slug>`
  - [x] `codemint sync`
  - [x] `codemint list [--installed]`
  - [x] `codemint remove @rule/<slug>` / `@skill/<slug>`
- [x] Identifier format in use: `@rule/<slug>`, `@skill/<slug>`, `catalogId`, semver, `checksum`
- [x] Output modes: human-readable, `--json`, `--dry-run` (add/sync)

## Phase 1: Backend API Readiness
- [ ] Confirm all protected APIs accept `Authorization: Bearer <token>` consistently.
- [ ] Add API docs page for CLI consumers with request/response examples.
- [ ] Standardize item metadata for catalog entries:
  - [ ] `slug`
  - [ ] `catalogId`
  - [ ] `version`
  - [ ] `checksum`
  - [ ] `deprecated` (optional)
  - [ ] `changelog` (optional)
- [ ] Add server-side validation for required metadata fields for `type=rule|skill`.
- [ ] Add unique constraint strategy for `catalogId + version`.
- [ ] Add resolver endpoint for direct ref lookup (recommended):
  - [ ] `GET /api/catalog/resolve?ref=@rule/react-best-coding`
- [ ] Add bulk sync endpoint (recommended):
  - [ ] `POST /api/catalog/sync` with `catalogIds[]`
- [ ] Add CLI token lifecycle endpoints (recommended):
  - [ ] `GET /api/auth/cli-token`
  - [ ] `DELETE /api/auth/cli-token/:id`

## Phase 2: CLI Auth Integration
- [x] Browser callback flow: `/cli-auth?port=...` → callback with token → `GET /api/auth/me` (implemented in CLI).
- [ ] Ensure login redirect preserves `next` to return users to `/cli-auth` (backend).
- [x] `codemint auth whoami`, `auth logout`, `doctor` (implemented in CLI).

## Phase 3–7: Implemented in CLI repo
- [x] `scan` (tech detector, tags, confidence).
- [x] `suggest` (catalog by tags/type, ranking, `--limit`/`--type`/`--json`).
- [x] `add` (resolve ref, write to tool paths, manifest).
- [x] `sync` (manifest, catalog/sync API, plan, `--dry-run`).
- [x] Manifest schema (installed[], path, tool, ref, version, checksum). Optional: `lastSyncAt`, file locking (see [CLI_GAPS.md](docs/CLI_GAPS.md)).

## Phase 8: Quality and Security
- [ ] Unit tests:
  - [ ] parser/command behavior
  - [ ] scan detection
  - [ ] ranking logic
  - [ ] manifest read/write
- [ ] Integration tests:
  - [ ] auth callback
  - [ ] suggest/add/sync against API
- [ ] Security checks:
  - [ ] never print full token after initial issue
  - [ ] sanitize logs/errors
  - [ ] enforce HTTPS for non-localhost API base URLs
- [ ] Performance target:
  - [ ] `scan` under 2s for typical repo
  - [ ] `suggest` under 1s with warm API

## Phase 9: Documentation and Rollout
- [ ] Add `docs/cli-integration.md` in this repo.
- [ ] Add usage examples for:
  - [ ] `scan`
  - [ ] `suggest`
  - [ ] `add`
  - [ ] `sync`
- [ ] Add troubleshooting section:
  - [ ] callback port blocked
  - [ ] invalid token
  - [ ] missing metadata/slug mapping
- [ ] Define rollout stages:
  - [ ] internal alpha
  - [ ] beta
  - [ ] GA

## Immediate Next 7 Tasks
- [ ] Fix login `next` redirect continuity for `/cli-auth`.
- [ ] Implement metadata contract (`slug`, `catalogId`, `version`, `checksum`) in items.
- [ ] Add catalog resolve endpoint by `@rule/@skill` ref.
- [ ] Implement `codemint scan` tag detection.
- [ ] Implement `codemint suggest` using `/api/items/search`.
- [ ] Implement `.codemint/manifest.json` and `codemint add`.
- [ ] Implement `codemint sync` with dry-run.
