# 🚀 CodeMintAI — Final Technical & Brand Implementation Plan
**Tagline:** Build Smart. Build Safe.  
**Positioning:** A clean, searchable workspace for AI rules, prompts, and coding skills — built for modern developer teams.

---

# 🧭 Product Vision

CodeMintAI helps GenZ and modern engineering teams store, search, share, and reuse:

- AI prompts
- AI rules & guardrails
- Coding skills & patterns
- Safe usage practices

Core traits:

- 🔎 Search-first (90% read/search usage)
- 🧼 Clean & structured knowledge
- 🛡️ Safety & best-practice focused
- 👥 Org + team scoped
- ⚡ Fast + developer-friendly
- 💰 Zero-cost friendly MVP infra

---

# 🧱 Architecture Overview

Next.js (App Router, Fullstack)
├── UI (React + Tailwind + Tables)
├── API Routes (server layer)
├── Service Layer (business logic)
├── Repository Layer (DB access)
├── Auth Layer (JWT/Auth.js)
└── Prisma ORM
↓
PostgreSQL
↓
Redis (cache)


Search v1 → PostgreSQL Full Text + Trigram  
Search v2 → Meilisearch (optional upgrade)

---

# 🛠 Tech Stack

## Core
- Next.js (App Router)
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod validation
- Redis (ioredis)

## UI
- TailwindCSS
- TanStack Table
- React Query

## Auth
- Auth.js OR custom JWT (bcrypt + jose)

## Hosting (MVP friendly)
- Netlify / Vercel
- Managed Postgres (Neon / Supabase / RDS later)

---

# 📂 Project Structure

```
/app
/api
  /auth
  /items
  /search
  /org
  /tags
  /invite
/lib
  db.ts
  redis.ts
  auth.ts
  search.ts
  pagination.ts
/services
  item.service.ts
  search.service.ts
  org.service.ts
  invite.service.ts
/repositories
  item.repo.ts
  tag.repo.ts
  org.repo.ts
/middleware
  requireAuth.ts
  requireOrg.ts
/prisma
  schema.prisma
```


---

# 🗄 Database Schema (Prisma Models)

## User
- id
- email (unique)
- passwordHash
- name
- createdAt

## Organization
- id
- name
- createdBy
- createdAt

## OrgMember
- id
- orgId
- userId
- role (admin | member | viewer)
- status (invited | active)

## Invite
- id
- orgId
- email
- token
- expiresAt
- usedAt

## Item (Unified Content Table)
- id
- title
- content (TEXT)
- type (rule | prompt | skill)
- metadata (JSONB)
- visibility (public | org)
- orgId (nullable)
- createdBy
- createdAt
- updatedAt

## Tag
- id
- name
- category (tech | job | domain | tool)

## ItemTag
- itemId
- tagId

---

# 🔎 Search Design

## PostgreSQL Features

**Enable:** `pg_trgm`

## Full Text Vector

**Index on:** `to_tsvector('english', title || ' ' || content)`

## Required Indexes

- GIN full-text index
- GIN trigram index on title
- index orgId
- index visibility
- index type
- index createdAt
- composite index (orgId, type)
- index item_tags(tagId)


---

# 🔐 Authentication Plan

## Login Flow

POST /api/auth/login
→ validate input
→ bcrypt compare
→ issue access token (15m)
→ issue refresh token (7d)
→ httpOnly cookies


## Middleware

requireAuth
requireOrgMember
requireOrgAdmin


Attach user + org roles to request context.

---

# 🏢 Organization Model

## Capabilities

- create organization
- org admin invites members
- role-based access
- org-scoped items
- public items visible to all

## Visibility Rule

show item if:
visibility = public
OR orgId IN user_orgs


---

# 📡 API Endpoints

## Auth

POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout


## Items

GET /api/items/search
GET /api/items/:id
POST /api/items
PUT /api/items/:id
DELETE /api/items/:id


Query params:

?q=
?type=
?tags=
?org=
?page=
?limit=


## Tags

GET /api/tags
POST /api/tags


## Organization

POST /api/org
GET /api/org/my
GET /api/org/:id/members


## Invite

POST /api/org/:id/invite
POST /api/invite/accept


---

# ✉️ Invite System — No Email Mode (MVP)

Generate copy message instead of sending email.

## Copy Invite Message Template

Hi,

You’re invited to join CodeMintAI — Build Smart. Build Safe.

We maintain a shared workspace of clean AI prompts, rules, and coding skills for safer and smarter development.

Join using this link:
{{INVITE_LINK}}

Steps:

Open the link

Sign up or log in

You’ll be added automatically

If the link expires, request a new one.

Thanks,
{{SENDER_NAME}}


UI Button:

Copy Invite Message


---

# 📄 Pagination Contract

All list APIs return:

```json
{
  "data": [],
  "total": 1200,
  "page": 2,
  "pageSize": 25
}
```

**Rules:**

- server-side pagination only
- never return full content in list view
- return preview/snippet

---

# ⚡ Redis Caching

**Cache:**

- search results (query hash key)
- tag lists
- item detail
- popular queries

**Invalidate on:**

- item create/update/delete
- tag change
- org scope change

**TTL:**

- search → 5–15 min
- tags → 1 hour
- item detail → 10 min

---

# 🧠 Text Handling Rules

- store raw TEXT / JSONB
- allow all characters
- never sanitize before DB
- escape only at render time
- parameterized queries only

---

# 🖥 UI Plan

## Pages

**Login**

- email/password
- invite accept

**Explore Dashboard**

- Tabs: Rules | Prompts | Skills
- Each tab:
  - search bar
  - tag filters
  - org/public toggle
  - server table
  - pagination

## Item Table Columns

- Title
- Type
- Tags
- Scope badge
- CreatedAt
- Actions
- Row expand → preview
- Button → Copy Prompt

## Org Admin Panel

- members table
- invite generator
- role editor
- org items list

---

# 🧪 Testing Plan

**Seed:**

- 50k items
- multi-tag
- multi-org
- mixed visibility

**Test:**

- auth flow
- org access control
- search ranking
- pagination accuracy
- tag filters
- invite expiry

---

# 🚀 Build Phases

**Phase 1 — Core**

- schema
- auth
- items CRUD
- tags
- pagination

**Phase 2 — Search**

- FTS + trigram
- ranking
- filters

**Phase 3 — Org**

- org model
- membership
- invites

**Phase 4 — Performance**

- Redis cache
- index tuning

**Phase 5 — Upgrade (Optional)**

- Meilisearch
- facets
- typo tolerance

---

# 🎨 CodeMintAI Brand Plan

## Brand Name

CodeMintAI

## Tagline

Build Smart. Build Safe.

## One-Line Pitch

CodeMintAI is a clean, searchable prompt and rule workspace for AI-assisted coding and safe engineering practices.

## Brand Pillars

- 🤖 AI-native
- 💻 Developer-first
- 🧼 Clean standards
- 🛡️ Safe practices
- 🏆 Best-quality patterns

## Hero Section Copy

**Build Smart. Build Safe.**

A clean, searchable workspace for AI prompts, rules, and coding skills — built for modern developer teams.

## Feature Copy Lines

- Searchable AI prompt & rule vault
- Clean reusable patterns
- Safety-first AI usage guides
- Team workspaces
- Fast filtered search

## UI Voice

**Tone:**

- clear
- confident
- developer-direct
- not corporate-heavy

**Examples:**

- "Mint New Rule"
- "Safe Copy"
- "Verified Prompt"
- "Clean Pattern"

## Logo Direction

**Concepts:**

- { } + mint leaf
- shield + prompt bubble
- CM monogram hex badge
- terminal >_ with mint accent

**Colors:**

- mint green + charcoal
- teal + dark slate
- mint accent on dark UI

## Microcopy

**Empty state:** Nothing minted yet — add your first clean prompt.

**Success toast:** Minted successfully.

**Copy button:** Copy Safe Prompt

---

# ✅ Final Outcome

You get:

- scalable search-first architecture
- zero-cost MVP path
- org-scoped knowledge base
- GenZ-ready developer brand
- clean upgrade path to search engine later

**CodeMintAI — Build Smart. Build Safe.**