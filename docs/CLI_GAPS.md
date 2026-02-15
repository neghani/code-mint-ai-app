# CodeMint CLI — Gaps Report

Gaps in the existing Go CLI ([code-mint-ali-cli](https://github.com/codemint/codemint-cli)) relative to backend API contracts and intended behavior. Fix priority: Critical → Moderate → Minor.

---

## Critical (breaks functionality)

### 1. Windows token retrieval not implemented

- **Where:** `internal/auth/storage_windows.go` — `Get()` returns `errors.New("windows secure credential read requires...")`
- **Impact:** Windows users can complete `auth login` but any command that needs the token fails (whoami, add, sync, etc.).
- **Fix:** Implement read using Windows Credential Manager. Example: use `cmdkey` to list and parse, or call Win32 CredRead API via syscall/cgo or a small helper. Fallback: read from `~/.config/codemint/token-<profile>` when credential manager read is unavailable, with a clear doc note.

### 2. Cursor skills written to wrong path

- **Where:** `internal/install/installer.go` — `ItemPath()` for Cursor + skill puts file at `.cursor/rules/skill-<slug>.mdc`
- **Backend/spec:** Cursor expects skills at `.cursor/skills/<slug>/SKILL.md` (post-2.3.35). Rules stay at `.cursor/rules/<slug>.mdc`.
- **Impact:** Installed Cursor “skills” are not picked up by Cursor when using the standard skills location.
- **Fix:** In `ItemDir()`/`ItemPath()`, for `tool == ToolCursor` and `itemType == "skill"`, use `filepath.Join(m.Root, ".cursor", "skills", slug)` and return path `.../SKILL.md`. For rules, keep `.cursor/rules/<slug>.mdc`. Do not use `skill-` prefix for Cursor skills.

### 3. `/api/org/my` response shape mismatch

- **Where:** `internal/api/client.go` — `OrgList()` decodes into `OrgListResponse` with `Organizations []Organization`
- **Backend:** `src/app/api/org/my/route.ts` returns the org array directly: `NextResponse.json(orgs)` (no `{ organizations: orgs }` wrapper).
- **Impact:** `codemint org list` fails to decode and returns an error.
- **Fix:** Decode response as `[]Organization` (or a type alias). Update `OrgListResponse` to match: either use a raw array type for the API response or add a custom unmarshal that accepts both `[{...}]` and `{ "organizations": [...] }` for backward compatibility.

---

## Moderate (correctness / completeness)

### 4. No auto-detect of AI tools from workspace

- **Where:** Tool is chosen only via `tool set` or `--tool` or interactive prompt. No scan of workspace.
- **Impact:** Users must remember to set tool; multi-tool workspaces are not supported.
- **Fix:** Add a detector that scans project root for: `.cursor/`, `.cline/` or `.clinerules`, `.windsurf/`, `.continue/`, `.github/copilot-instructions.md` or `.github/instructions/`, `CLAUDE.md` or `.claude/`, `.codex/`. If exactly one tool is detected, use it as default when `settings.AITool` is empty; if multiple, prompt or use first. Document in `docs/commands.md`.

### 5. Scanner limited to Node.js ecosystem

- **Where:** `internal/scan/detector.go` — only checks package.json, tsconfig, next.config, schema.prisma, Dockerfile, app/, src/App.
- **Impact:** `suggest` returns no or weak results for Python, Go, Rust, Java, Ruby, etc.
- **Fix:** Add signals: `requirements.txt` / `pyproject.toml` (Python), `go.mod` (Go), `Cargo.toml` (Rust), `pom.xml` / `build.gradle` (Java), `Gemfile` (Ruby). Map to normalized tags (`lang:python`, `tech:django`, etc.) and reuse existing confidence/tag pipeline.

### 6. Prisma detection path wrong

- **Where:** `internal/scan/detector.go` — `check("schema.prisma", ...)`
- **Reality:** Prisma projects usually have `prisma/schema.prisma`.
- **Fix:** Also check `prisma/schema.prisma` (e.g. add a second check or a single check that tries both paths).

### 7. Skills paths for Windsurf, Continue, Claude

- **Where:** `internal/install/installer.go` — skills for Windsurf, Continue, Claude are routed to the same dir as rules with `skill-<slug>.md`.
- **Spec (from rules/skills mapping):** Windsurf skills: `.windsurf/skills/skill-<slug>.md`. Continue: `.continue/skills/skill-<slug>.md`. Claude: `.claude/skills/skill-<slug>.md`.
- **Fix:** In `ItemDir()` for `itemType == "skill"`, return a dedicated skills subdir per tool (e.g. `.windsurf/skills`, `.continue/skills`, `.claude/skills`). Keep filename `skill-<slug>.md` where the spec uses that pattern.

### 8. No checksum verification on install

- **Where:** `cmd/add.go` and `internal/install/installer.go` — content is written but local checksum is not compared to `item.Checksum` from API.
- **Impact:** Corrupted or partial writes are not detected.
- **Fix:** After writing, compute SHA256 of file content and compare to `item.Checksum` if non-empty. On mismatch, remove file, restore backup if any, return error and do not update manifest.

### 9. Manifest missing `lastSyncAt`

- **Where:** `internal/manifest/store.go` — `File` has `Version` and `Installed` only.
- **TODO_CLI_INTEGRATION.md:** Suggests `lastSyncAt` for project metadata.
- **Fix:** Add `LastSyncAt time.Time` to `File` (or `*time.Time`). Set it in `sync` command after a successful sync. Optional: add `BaseURL string` to manifest for multi-environment use.

### 10. No file locking for concurrent writes

- **Where:** Manifest save and install/sync can run concurrently (e.g. CLI + extension, or two terminals).
- **Impact:** Race on `manifest.json` and possible corrupt state.
- **Fix:** Use a project-level lock file (e.g. `.codemint/.lock`) with flock or equivalent; acquire before Load/ Save and before Install/Remove. Document in troubleshooting.

### 11. `--debug` flag is a no-op

- **Where:** `cmd/root.go` passes `Debug: flagDebug` to `api.NewClient`; client stores it but does not log requests/responses or redact headers.
- **Fix:** When `Debug` is true, use a round tripper that logs method, URL, and status; redact `Authorization` and any `Cookie` headers. Keep token redaction in errors (already present).

### 12. Linux missing from release build matrix

- **Where:** `.github/workflows/release.yml` (in CLI repo) — typically builds darwin/arm64, darwin/amd64, windows/amd64.
- **Impact:** Linux users have no official binary.
- **Fix:** Add `linux/amd64` and optionally `linux/arm64` to the matrix; produce tarballs and include in SHA256SUMS and release notes.

### 13. Copilot instructions path vs common usage

- **Where:** Installer uses `.github/instructions` for Copilot.
- **Common convention:** `.github/copilot/` or root-level `.github/copilot-instructions.md`. Confirm with Copilot docs and align; if instructions live under `.github/instructions/`, ensure directory exists and is documented.

---

## Minor (polish / robustness)

### 14. No `--force` on add

- **Impact:** Re-installing same ref@version requires remove first.
- **Fix:** Add `--force` to `add`; when set, overwrite existing file and update manifest entry even if version unchanged.

### 15. No `--limit` on suggest

- **Where:** `cmd/suggest.go` — uses fixed limit (e.g. 50) in CatalogSuggest.
- **Fix:** Add `--limit N` (default 25, max 100) and pass through to search.

### 16. Forked Cobra dependency

- **Where:** `third_party/cobra/` in CLI repo.
- **Impact:** Harder to get upstream fixes and community patterns.
- **Fix:** Plan migration to upstream `github.com/spf13/cobra` when feasible; run tests and fix any API drift.

### 17. Redundant `list --installed` flag

- **Where:** `cmd/list_installed.go` — `--installed` only changes output subset; full manifest is still listable without it.
- **Fix:** Either make `list` default to “installed items only” and add `list --manifest` for raw manifest, or document clearly and keep as-is.

### 18. Version comparison is string equality

- **Where:** `cmd/sync.go` and `cmd/add.go` — compare `result.LatestVersion == local.Version` and `ex.Version == item.Version` as strings.
- **Impact:** Semver ordering (e.g. 1.0.10 vs 1.0.9) is not respected.
- **Fix:** Use a small semver parser (or import a library) and compare with “less than” for upgrade decisions.

### 19. Dual Version fields in CatalogItem

- **Where:** `internal/api/models.go` — `CatalogItem` has `Version` and `CatVer` (catalogVersion); normalization copies between them.
- **Impact:** Confusion and risk of using wrong field.
- **Fix:** Prefer a single source of truth (e.g. `CatalogVersion`) and map from API’s `catalogVersion` once; expose one field to rest of CLI.

### 20. Items search response field names

- **Where:** Backend returns `total`; CLI may expect `Total` (exact JSON tag match). Confirm `ItemsSearchResponse` and backend pagination field names match (e.g. `total`, `page`, `limit` / `pageSize`).

### 21. Suggest reason string generic

- **Where:** `reasonForItem()` often returns “General recommendation from catalog” when tag overlap is zero.
- **Fix:** Consider “No tag match; consider browsing by tech” or surface matched tags when available.

### 22. Doctor does not check API reachability

- **Where:** `cmd/doctor.go` — checks token presence, manifest, paths, tool setting.
- **Fix:** Optional: call `GET /api/auth/me` and report “API: OK” or “API: unreachable” with base URL.

### 23. No token expiry handling

- **Where:** Tokens are long-lived; backend may add `expiresAt` later.
- **Fix:** If backend adds expiry to token payload or a header, parse it and show a warning when token expires within 7 days; suggest re-login.

### 24. Remove does not clean empty skill dir (Cursor)

- **Where:** `cmd/remove.go` + installer — Cursor skills live in `.cursor/skills/<slug>/SKILL.md`. Remove deletes the file only.
- **Fix:** After removing the file, if the parent dir is `.cursor/skills/<slug>` and is empty, remove the directory too.

---

## Reference

- Backend API: [docs/cli-integration.md](cli-integration.md)
- CLI execution plan: `CODEMINT_CLI_EXECUTION_PLAN.md` (in CLI repo)
- Backend catalog resolve: `src/app/api/catalog/resolve/route.ts`
- Backend catalog sync: `src/app/api/catalog/sync/route.ts`
- Backend org list: `src/app/api/org/my/route.ts`
