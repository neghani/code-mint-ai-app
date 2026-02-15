# CodeMintAI — Deploy to Netlify (MVP)

## Netlify build checklist (fix “exit code 2” / missing deps)

Netlify runs **production install only** (`npm install` without devDependencies). Everything needed at **build time** must be in **`dependencies`** in `package.json`.

**Must be in `dependencies` (not devDependencies):**

| Package           | Why needed at build |
|--------------------|----------------------|
| `next`             | Next.js build |
| `react`            | Next.js build |
| `react-dom`        | Next.js build |
| `typescript`       | Type checking during `next build` |
| `@types/node`      | Type check (Next requires it) |
| `@types/react`     | Type check (Next requires it) |
| `@types/react-dom` | Type check (Next requires it) |
| `@types/bcryptjs`  | Type check (prisma/seed.ts) |
| `prisma`           | `prisma generate` + `prisma db push` in build |
| `@prisma/client`   | Generated client used by app |
| `tailwindcss`      | PostCSS during `next build` |
| `autoprefixer`     | PostCSS during `next build` |

**Config:** This repo uses **`next.config.mjs`** (plain JS) so the config loads without requiring TypeScript at install. All build-time packages above are already in `dependencies`.

**Verify locally (simulates Netlify):**

```bash
npm install --omit=dev
npm run build
```

If that fails, the same error will happen on Netlify. Set `DATABASE_URL` in the environment (or in `.env`) so `prisma db push` can run.

---

## Deploy steps

1. **Connect repo** to Netlify (GitHub/GitLab).

2. **Build** (from `netlify.toml`): command `npm run build`, Node 20.

3. **Environment variables** (Site settings → Environment variables):
   - `DATABASE_URL` — PostgreSQL (e.g. Neon, Supabase). **Required at build time** for `prisma db push`.
   - `JWT_SECRET` — min 32 characters
   - `JWT_REFRESH_SECRET` — min 32 characters
   - `NEXT_PUBLIC_APP_URL` — your Netlify site URL (e.g. `https://your-app.netlify.app`)

4. **Invite links** use `NEXT_PUBLIC_APP_URL` (e.g. `https://your-app.netlify.app/login?token=...`).

---

## Seeding production (a lot of data)

**Do not run seed during the Netlify build.** Run it once (or when you add data) from your machine with the **production** `DATABASE_URL`.

**1. One-off seed (demo user + optional bulk data):**

```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require" npx prisma db seed
```

- Creates demo user `demo@codemint.ai` / `password123` and a demo org.
- If `prisma/seed-data.json` exists, loads **tags** and **items** from it (idempotent; safe to re-run).

**2. Bulk data via `prisma/seed-data.json`:**

Edit `prisma/seed-data.json`:

- **`tags`** — array of `{ "name": "nextjs", "category": "tech" }` (category: tech | job | domain | tool).
- **`items`** — array of `{ "title", "content", "type": "rule"|"prompt"|"skill", "visibility": "public"|"org", "slug"?, "tags": ["tag1", "tag2"] }`.

Add as many items as you need (seed processes in batches). Then run:

```bash
DATABASE_URL="your-production-url" npx prisma db seed
```

**3. Where to get production `DATABASE_URL`:**  
From your DB provider (Neon, Supabase, etc.) → connection string. Use it only from a secure environment (your laptop or a one-off script), not in the browser or in repo.

**4. Re-run:**  
Safe to run multiple times; existing demo user/org and items keyed by slug are upserted, not duplicated.

**5. Bulk data from article URLs (crawl → seed):**

- Add one article URL per line to `data/crawl/urls.txt` (lines starting with `#` are ignored).
- Run the crawler: `node data/crawl/crawl.mjs`. It writes `data/crawl/crawled.json` in the same shape as seed items.
- Run seed as above: `DATABASE_URL="your-production-url" npx prisma db seed`. Seed loads both `prisma/seed-data.json` and `data/crawl/crawled.json` (if present) and upserts all items. Data appears in the app in bulk.

---

**Docker (local or self-hosted)**  
- Dev: `docker compose up --build`  
- Prod: `docker build -t codemint-ai .` (set `DATABASE_URL` and JWT vars when running).
