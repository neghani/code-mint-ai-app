# CodeMint CLI — API integration

This doc describes the backend APIs used by the CodeMint CLI. All protected endpoints accept either **session cookies** (browser) or **`Authorization: Bearer <api-token>`** (CLI).

## Auth

- **Get token (browser flow):** Open `GET /cli-auth?port=PORT`. After login, click "Generate token and authorize CLI". The app redirects to `http://127.0.0.1:PORT/?token=<raw-token>`.
- **Create token (API):** `POST /api/auth/cli-token` with body `{ "name": "CLI" }`. Returns `{ "token": "<raw-token>" }` once. Store it securely.
- **List tokens:** `GET /api/auth/cli-token` → `{ "tokens": [ { "id", "name", "lastUsedAt", "createdAt" } ] }`.
- **Revoke token:** `DELETE /api/auth/cli-token/:id`.
- **Verify token:** `GET /api/auth/me` with `Authorization: Bearer <token>` → `{ "user": { "id", "email", "name" } }`.

## Catalog (rules & skills)

Catalog items are items with `slug`, `catalogId`, and `catalogVersion` set. Metadata can include `checksum`, `deprecated`, `changelog`.

### Resolve ref

- **`GET /api/catalog/resolve?ref=@rule/<slug>`** or **`ref=@skill/<slug>`**
- Resolves a human ref to one catalog item.
- Returns: `{ id, title, content, type, slug, catalogId, catalogVersion, checksum, deprecated, changelog, tags }`. `tags` is an array of tag names: `string[]`.
- 404 if not found or not visible to the caller.

### Sync (bulk lookup)

- **`POST /api/catalog/sync`**
- Body: `{ "catalogIds": ["id1", "id2", ...] }` (max 100).
- Returns: `{ "items": [ { id, catalogId, catalogVersion, slug, checksum, deprecated, content, title } | null, ... ] }` in the same order as `catalogIds`. `null` when no public catalog item for that id.

## Items

- **Search:** `GET /api/items/search?q=&type=&tags=&visibility=&org=&page=&limit=&sort=`
- **Get one:** `GET /api/items/:id`

### Suggest (codemint suggest)

`codemint suggest` calls **`GET /api/items/search`** with:

- **Auth:** `Authorization: Bearer <token>`
- **Query params:** `q` (optional, joined scan tags), `type` (optional: `rule` or `skill`), `tags` (optional, comma-separated), `latest=true`, `page=1`, `limit=50`

**Success (200):** No matches return `200` with `"items": []`. Response shape:

```json
{
  "items": [
    {
      "id": "...",
      "name": "Safe API Route Pattern",
      "type": "rule",
      "slug": "safe-api-route-pattern",
      "catalogId": "rule:safe-api-route-pattern",
      "version": "1.2.0",
      "tags": ["lang:typescript", "tech:nextjs"],
      "score": 92
    }
  ],
  "page": 1,
  "limit": 50,
  "total": 1
}
```

The response also includes `data` (full item payload) and `pageSize` for the web app. CLI consumers should use `items`, `page`, `limit`, `total`.

**Errors:** `401` unauthorized, `403` forbidden, `422` invalid type/tags, `500` server error. Body: `{ "error": { "code": "...", "message": "..." } }`.
- **Create:** `POST /api/items` with body including optional `slug`, `catalogId`, `catalogVersion`. For catalog entries (rule/skill), when `catalogId` is set, `slug` and `catalogVersion` are required. `metadata` can include `checksum`, `deprecated`, `changelog`.
- **Update:** `PUT /api/items/:id`
- **Delete:** `DELETE /api/items/:id`

## Identifier format (CLI contract)

- **Human ref:** `@rule/<slug>`, `@skill/<slug>` (used in `ref` query and in CLI commands).
- **Internal:** `catalogId` (unique per logical catalog entry), `catalogVersion` (e.g. semver). Together unique.
- **Integrity:** `checksum` in item metadata (optional).

## Errors

- `401` — Unauthorized (missing or invalid token/cookie).
- `403` — Forbidden (no access to resource).
- `404` — Not found.
- `400` — Bad request (validation); body may include `error` or Zod `flatten()` shape.
