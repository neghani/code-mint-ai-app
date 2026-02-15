# CodeMint VS Code / Cursor Extension — Spec

Extension that authenticates with the CodeMintAI app and syncs rules and skills into the local project, with auto-detection of the active AI tool and correct file formats per tool.

---

## 1. Overview

- **Name:** CodeMint (e.g. `codemint-vscode` or `codemint.sync`)
- **Target:** VS Code and Cursor
- **Role:** Pull-only sync of rules/skills from CodeMintAI into the workspace; auth via existing browser callback flow.
- **Compatibility:** Reads/writes the same `.codemint/manifest.json` and tool paths as the Go CLI so CLI and extension can coexist.

---

## 2. Architecture

- **Single package:** TypeScript VS Code extension (no monorepo required; CLI remains Go).
- **Auth:** Same flow as CLI: open `{baseUrl}/cli-auth?port=PORT`, local callback server receives token, then store in VS Code `SecretStorage` (not file).
- **API:** Typed `fetch` wrapper for: `GET /api/auth/me`, `GET /api/catalog/resolve?ref=`, `POST /api/catalog/sync`, `GET /api/items/search`. Base URL from config.
- **Manifest:** Read/update `.codemint/manifest.json` in workspace root; schema compatible with CLI (version, installed[], path/tool/ref/slug/version/checksum/installedAt).
- **Tool detection:** Scan workspace root for markers (see table below). No manual tool selection required unless user overrides in settings.
- **Format writers:** One writer per tool; each writes to the correct path and file extension for that tool.

---

## 3. Tool detection and paths

Auto-detect by presence of these paths (workspace root):

| Tool     | Detection signal              | Rules path                          | Skills path                                |
|----------|--------------------------------|-------------------------------------|--------------------------------------------|
| Cursor   | `.cursor/`                     | `.cursor/rules/<slug>.mdc`          | `.cursor/skills/<slug>/SKILL.md`           |
| Cline    | `.cline/` or `.clinerules`     | `.cline/rules/<slug>.md` or similar | `.cline/skills/<slug>/SKILL.md`            |
| Windsurf | `.windsurf/`                   | `.windsurf/rules/<slug>.md`         | `.windsurf/skills/skill-<slug>.md`         |
| Continue | `.continue/`                   | `.continue/rules/<slug>.md`         | `.continue/skills/skill-<slug>.md`         |
| Copilot  | `.github/instructions` or file | `.github/instructions/<slug>.instructions.md` | `.github/.../skills/skill-<slug>.instructions.md` |
| Claude   | `CLAUDE.md` or `.claude/`       | `.claude/rules/<slug>.md`           | `.claude/skills/skill-<slug>.md`           |
| Codex    | `.codex/`                      | `.codex/rules/<slug>.md`           | `.codex/skills/<slug>.md`                  |

- If multiple tools detected: use first, or let user pick once and remember in workspace state.
- Override: setting `codemint.toolOverrides` (array of tool ids) forces that list instead of detection.

---

## 4. Auth flow

1. User runs **CodeMint: Login**.
2. Extension starts a local HTTP server on an ephemeral port (e.g. 0).
3. Opens browser to `{baseUrl}/cli-auth?port={port}` (same as CLI).
4. User signs in and clicks “Generate token and authorize CLI”.
5. Backend redirects to `http://127.0.0.1:{port}/?token=...`.
6. Extension parses `token`, closes server, verifies with `GET /api/auth/me` (Bearer token).
7. Store in VS Code `SecretStorage` under a key like `codemint.token`; store `baseUrl` in globalState or config.
8. Show “Logged in as &lt;email&gt;”.

Logout: **CodeMint: Logout** deletes the secret and clears cached user.

---

## 5. Commands (Command Palette)

| Command                  | Description |
|--------------------------|-------------|
| CodeMint: Login          | Start browser auth flow and store token. |
| CodeMint: Logout         | Clear stored token. |
| CodeMint: Add Rule/Skill | QuickPick: search catalog (items/search), then select ref → resolve → install to detected tool path(s). |
| CodeMint: Sync            | Load manifest, call catalog/sync for installed catalogIds, compare versions/checksums, update changed files and manifest. Optionally show plan in output channel. |
| CodeMint: Suggest        | Run repo scan (tech detection), then search catalog by tags; show recommendations in QuickPick; user can choose to add. |
| CodeMint: List Installed | Show installed items from manifest (e.g. list or tree in sidebar). |
| CodeMint: Remove          | Pick installed item from list → remove file(s) and manifest entry. |

---

## 6. Sidebar (TreeView)

- **Activity bar icon:** CodeMint (e.g. mint/leaf icon).
- **Installed:** Group by type (Rules / Skills). Each node: slug, version, tool. Click: open file or show details.
- **Suggestions:** After “Suggest” or on-demand refresh: list of recommended refs with short reason. Click: run Add for that ref.
- **Status:** One node or status line: “Logged in as …” or “Not logged in”; “Synced” / “Updates available” when applicable.

---

## 7. Status bar

- **Item:** “CodeMint” or “CodeMint: synced” / “CodeMint: updates” / “CodeMint: not logged in”.
- Click: open CodeMint output channel or run Sync.

---

## 8. Settings (contributes.configuration)

| Setting                   | Type    | Default           | Description |
|---------------------------|---------|-------------------|-------------|
| `codemint.baseUrl`        | string  | `https://codemint.ai` | API base URL. |
| `codemint.autoSync`       | boolean | false             | Run sync on workspace open when manifest exists. |
| `codemint.toolOverrides`  | array   | []                | If non-empty, use these tools instead of auto-detect (e.g. `["cursor"]`). |

---

## 9. Format writers (per tool)

- **Cursor rules:** `.cursor/rules/<slug>.mdc` — YAML frontmatter (`description`, `alwaysApply`, optional `globs`) + markdown body. If content has no frontmatter, prepend one from item title.
- **Cursor skills:** `.cursor/skills/<slug>/SKILL.md` — Plain markdown (or minimal frontmatter if needed).
- **Copilot:** `.instructions.md` extension and Copilot-specific frontmatter if documented.
- **Others:** Plain `.md` (or tool-specific extension) under the paths in the table above.

Content source: `content` from `GET /api/catalog/resolve` or sync response. No push (no upload of local edits).

---

## 10. Manifest compatibility

- Use same schema as CLI: `version` (or `schemaVersion`), `installed[]` with `catalogId`, `ref`, `type`, `slug`, `tool`, `version`, `checksum`, `installedAt`, `path`. Optional: `lastSyncAt`, `baseUrl`.
- Extension must not remove or rename fields the CLI relies on. New optional fields are fine.

---

## 11. API client (minimal)

- `authMe(token): Promise<{ user: { id, email, name } }>`
- `catalogResolve(ref: string, token?): Promise<CatalogItem>`
- `catalogSync(catalogIds: string[], token?): Promise<{ items: (CatalogItem | null)[] }>`
- `itemsSearch(params: { q?, type?, tags?, page?, limit? }, token?): Promise<{ items, total, page, limit }>`

All requests: `Authorization: Bearer <token>` when token is set. Base URL from `codemint.baseUrl`.

---

## 12. Error handling and UX

- **401:** “Not logged in or token expired. Run CodeMint: Login.”
- **404 on resolve:** “Rule/skill not found. Check ref or visibility.”
- **Network error:** “Could not reach CodeMint. Check base URL and network.”
- **No workspace folder:** Commands that need a project root (add, sync, list, suggest) show “Open a folder first”.

---

## 13. Packaging and distribution

- Build: compile TypeScript with `vsce package` (or existing build script). No Node runtime required for users.
- Publish: VS Code Marketplace and/or Cursor extension gallery. Optional: Open VSX.
- Extension ID: e.g. `codemint.sync` or `codemint-vscode`.

---

## 14. References

- Backend APIs: [cli-integration.md](cli-integration.md)
- CLI behavior: [CLI_GAPS.md](CLI_GAPS.md) (for alignment and shared manifest/paths)
- Cursor rules/skills: `.cursor/rules/*.mdc`, `.cursor/skills/<slug>/SKILL.md`
