# CodeMintAI — Deploy to Netlify (MVP)

1. **Connect repo** to Netlify (GitHub/GitLab).

2. **Build settings** (usually auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: set by Next.js adapter (do not override)

3. **Environment variables** (Site settings → Environment variables):
   - `DATABASE_URL` — PostgreSQL connection string (e.g. [Neon](https://neon.tech) or [Supabase](https://supabase.com))
   - `JWT_SECRET` — min 32 characters
   - `JWT_REFRESH_SECRET` — min 32 characters  
   - `NEXT_PUBLIC_APP_URL` — your Netlify site URL (e.g. `https://your-app.netlify.app`)

4. **After first deploy**: run migrations and seed from your machine (or use a one-off build script):
   ```bash
   DATABASE_URL="your-netlify-db-url" npx prisma db push
   DATABASE_URL="your-netlify-db-url" npx prisma db seed
   ```

5. **Invite links**: Use `NEXT_PUBLIC_APP_URL` so invite emails/messages point to the correct domain (e.g. `https://your-app.netlify.app/login?token=...`).

---

**Docker (local or self-hosted)**  
- Dev: `docker compose up --build` (uses `Dockerfile.dev`, app + Postgres).  
- Prod image: `docker build -t codemint-ai .` (uses standalone output; set `DATABASE_URL` and JWT vars when running).
