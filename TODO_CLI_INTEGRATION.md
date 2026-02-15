# CodeMint CLI Integration TODO

## Phase 0: Scope and Contracts
- [ ] Finalize CLI command set for v1:
  - [ ] `codemint scan [path]`
  - [ ] `codemint suggest`
  - [ ] `codemint add @rule/<slug>`
  - [ ] `codemint add @skill/<slug>`
  - [ ] `codemint sync`
  - [ ] `codemint list --installed`
  - [ ] `codemint remove @rule/<slug>` / `@skill/<slug>`
- [ ] Freeze identifier format:
  - [ ] Human ref: `@rule/<slug>`, `@skill/<slug>`
  - [ ] Internal key: `catalogId`
  - [ ] Version: semver
  - [ ] Integrity: `checksum`
- [ ] Define CLI output modes:
  - [ ] Human-readable
  - [ ] `--json`
  - [ ] `--dry-run`

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
- [ ] Confirm browser callback flow works on macOS + Windows:
  - [ ] open `/cli-auth?port=...`
  - [ ] callback receives `token`
  - [ ] verify with `GET /api/auth/me`
- [ ] Ensure login redirect preserves `next` to return users to `/cli-auth`.
- [ ] Add `codemint auth whoami`.
- [ ] Add `codemint auth logout`.
- [ ] Add `codemint doctor` auth checks.

## Phase 3: Repo Intelligence (`scan`)
- [ ] Build technology detector from repository signals:
  - [ ] `package.json`
  - [ ] `tsconfig.json`
  - [ ] `next.config.*`
  - [ ] `prisma/schema.prisma`
  - [ ] `Dockerfile`
  - [ ] lockfiles (`package-lock.json`, etc.)
- [ ] Produce normalized tags:
  - [ ] `tech:*`
  - [ ] `tool:*`
  - [ ] `lang:*`
- [ ] Add confidence scoring per detected technology.
- [ ] Add scan cache + invalidation behavior.

## Phase 4: Recommendations (`suggest`)
- [ ] Query catalog by detected tags and `type=rule|skill`.
- [ ] Rank by:
  - [ ] exact tech matches
  - [ ] type relevance
  - [ ] visibility/org relevance
- [ ] Return recommendations with reasons.
- [ ] Add `--limit`, `--type`, and `--json` options.

## Phase 5: Install Flow (`add`)
- [ ] Resolve ref (`@rule/<slug>` or `@skill/<slug>`) to catalog item.
- [ ] Download/construct install payload from API.
- [ ] Write local assets into managed project folder:
  - [ ] `.codemint/rules/`
  - [ ] `.codemint/skills/`
- [ ] Create/update manifest: `.codemint/manifest.json`.
- [ ] Prevent duplicate installs for same `catalogId + version`.
- [ ] Add install conflict handling if local modifications exist.

## Phase 6: Sync Flow (`sync`)
- [ ] Read installed items from manifest.
- [ ] Fetch latest versions/checksums from API.
- [ ] Compute plan:
  - [ ] upgrades
  - [ ] unchanged
  - [ ] deprecated/removed
- [ ] Support `--dry-run`.
- [ ] Apply updates atomically with backup/rollback.
- [ ] Print concise summary report.

## Phase 7: Local Data and Manifest
- [ ] Finalize manifest schema:
  - [ ] `schemaVersion`
  - [ ] `installed[]` entries (`catalogId`, `ref`, `version`, `checksum`, `installedAt`, `source`)
  - [ ] project metadata (`path`, `lastSyncAt`)
- [ ] Add manifest migration strategy for future schema updates.
- [ ] Add locking to avoid concurrent CLI writes.

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
