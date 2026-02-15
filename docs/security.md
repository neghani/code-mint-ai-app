# Security — rate limits and dump prevention

To reduce abuse and bulk scraping:

- **Global API rate limit (middleware):** 150 requests per minute per IP to any `/api/*` route. Exceeding returns `429` with `{ "error": { "code": "rate_limited", "message": "Too many requests" } }`.
- **Search (`GET /api/items/search`):** 60 req/min unauthenticated, 120 req/min authenticated. Unauthenticated users can only page through the first **500 items** (max 25 per page). Authenticated users keep full pagination (up to 100 per page).
- **Catalog resolve (`GET /api/catalog/resolve`):** 60 req/min unauthenticated, 120 req/min authenticated.
- **Catalog sync (`POST /api/catalog/sync`):** 30 req/min unauthenticated, 60 req/min authenticated. Body already limited to 100 `catalogIds` per request.

Rate limiting is in-memory per instance. For multiple app instances, use a shared store (e.g. Redis) and replace the logic in `src/lib/rate-limit.ts` and `src/middleware.ts`.

**Logging:** Only unexpected server errors (500 responses) are logged via `src/lib/logger.ts`. Production logs scope + error message only (no stack). No request bodies, tokens, or PII are logged.
