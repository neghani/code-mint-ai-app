# CodeMintAI — Build Smart. Build Safe.

A clean, searchable workspace for AI prompts, rules, and coding skills — built for modern developer teams.

## Stack

- **Next.js 15** (App Router), TypeScript, TailwindCSS
- **PostgreSQL** + Prisma ORM
- **Auth:** JWT (access + refresh, httpOnly cookies)
- **Search:** PostgreSQL full-text (no Redis for MVP)

## Quick start (local)

Use an **existing Postgres** (e.g. another app’s container or local install). Create a database for CodeMintAI, then run the app.

1. **Create the database** (if using an existing Postgres container):
   ```bash
   docker exec -it <postgres_container_name> psql -U postgres -c "CREATE DATABASE codemint;"
   ```
   Example, if your container is `finance_assistant_db` and user is `postgres`:
   ```bash
   docker exec -it finance_assistant_db psql -U postgres -c "CREATE DATABASE codemint;"
   ```

2. **Configure `.env`** (copy from `.env.example`):
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/codemint"
   JWT_SECRET="your-secret-min-32-chars"
   JWT_REFRESH_SECRET="your-refresh-secret-32-chars"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Install, apply schema, seed, and run**:
   ```bash
   npm install
   npx prisma db push
   npx prisma db seed
   npm run dev
   ```
   App: http://localhost:3000

## Deploy to Netlify (MVP)

1. Connect the repo to Netlify.
2. Build command: `npm run build` (default from `netlify.toml`).
3. Set environment variables in Netlify UI:
   - `DATABASE_URL` (e.g. Neon / Supabase Postgres)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NEXT_PUBLIC_APP_URL` (your Netlify URL)

Netlify auto-detects Next.js and uses the OpenNext adapter. No extra plugin needed.

## Docker production build

For a self-hosted production image (standalone output):

```bash
docker build --build-arg NEXT_STANDALONE=true -t codemint-ai .
# Run with DATABASE_URL and JWT_* env set
docker run -p 3000:3000 -e DATABASE_URL=... -e JWT_SECRET=... -e JWT_REFRESH_SECRET=... codemint-ai
```

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — Prisma generate + Next.js build
- `npm run start` — Start production server
- `npm run cli:auth` — Test CLI auth flow (opens browser, prints token, verifies `/api/auth/me`)
- `npx prisma db push` — Sync schema to DB
- `npx prisma db seed` — Seed demo user and sample items
- `npx prisma studio` — Open Prisma Studio

## Demo user (after seed)

- Email: `demo@codemint.ai`  
- Password: `password123`

## API overview

- **Auth:** `POST /api/auth/register`, `login`, `refresh`, `logout`
- **Items:** `GET /api/items/search`, `GET/PUT/DELETE /api/items/:id`, `POST /api/items`
- **Tags:** `GET/POST /api/tags`
- **Org:** `POST /api/org`, `GET /api/org/my`, `GET /api/org/:id/members`
- **Invite:** `POST /api/org/:id/invite`, `POST /api/invite/accept`

Query params for search: `q`, `type`, `tags`, `org`, `visibility`, `page`, `limit`.

## CLI authentication

The site can issue **API tokens** for CLI (or other tools). The CLI can then call the API with `Authorization: Bearer <token>`.

### Flow

1. **CLI** starts a local HTTP server on a free port (e.g. 38472) and opens the browser to:
   ```
   https://your-app.com/cli-auth?port=38472
   ```
2. **User** logs in (if needed), then clicks **“Generate token and authorize CLI”**.
3. **Site** creates a long-lived API token and redirects the browser to:
   ```
   http://127.0.0.1:38472/?token=<raw-token>
   ```
4. **CLI** reads `token` from the query string, stores it (e.g. in config or env), and closes the server.
5. **CLI** uses the token for all API requests:
   ```
   Authorization: Bearer <token>
   ```

### Endpoints

- **`GET /cli-auth`** — Browser page: authorize CLI and get token (optional query: `?port=PORT`).
- **`POST /api/auth/cli-token`** — Create a token (requires cookie or Bearer auth). Returns `{ token: "..." }`.

All existing API routes accept either **session cookies** (browser) or **`Authorization: Bearer <token>`** (CLI).

After adding the `ApiToken` model, run **`npx prisma db push`** (or migrate) to update the database.

### Test the flow

From the repo root (with the app running, e.g. `npm run dev`):

```bash
npm run cli:auth
```

Or against a deployed app:

```bash
BASE_URL=https://your-app.netlify.app npm run cli:auth
```

The script starts a local server, opens the browser to `/cli-auth`, and prints the token once the redirect comes back. It then calls `GET /api/auth/me` with that token to verify it works.

---

**CodeMintAI — Build Smart. Build Safe.**
