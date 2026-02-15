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

4. **Seed** (optional, once):  
   `DATABASE_URL="..." npx prisma db seed`

5. **Invite links** use `NEXT_PUBLIC_APP_URL` (e.g. `https://your-app.netlify.app/login?token=...`).

---

**Docker (local or self-hosted)**  
- Dev: `docker compose up --build`  
- Prod: `docker build -t codemint-ai .` (set `DATABASE_URL` and JWT vars when running).
