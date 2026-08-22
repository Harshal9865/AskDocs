# AskDocs — Team Knowledge Base with AI Q&A

> Private workspace where teams upload documents (PDF, DOCX, MD) and ask questions.
> The AI answers with citations linking back to the exact source document.

---

## 1. Product Scope

### MVP (what we ship first)
- User registers / logs in (JWT auth)
- Create workspaces; invite members with roles (admin / member / viewer)
- Upload documents (PDF, DOCX, MD/TXT)
- Documents are chunked + embedded automatically (status tracked)
- Ask questions in a chat → streamed answer with citations
- Conversation history per workspace

### Non-goals for v1 (don't build these yet)
- Real-time collaborative editing
- OCR / scanned PDFs
- Multiple LLM provider selection UI
- Mobile app

### Stretch goals (Phase 6)
- Slack/Teams bot
- Hybrid search (BM25 + vector), reranking
- Answer feedback (👍/👎) + eval harness (recall@k)
- Usage analytics dashboard

---

## 2. Tech Stack (final decisions)

| Layer | Choice | Why |
|---|---|---|
| Backend | Python 3.12 + FastAPI | Async, best AI ecosystem, auto docs |
| ORM / Migrations | SQLAlchemy 2.0 + Alembic | Industry standard |
| DB | PostgreSQL 16 + pgvector | Relational data + vector search in one DB |
| Auth | JWT (access + refresh), passlib/bcrypt | Simple, stateless, standard |
| File storage | Local disk via storage abstraction → S3 later | Start simple, swap later |
| Background work | FastAPI BackgroundTasks → ARQ/Celery later | Don't over-engineer early |
| AI | OpenAI (embeddings + chat) behind a provider interface | Swap-able, mockable in tests |
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | Job-market relevant, fast to build |
| Infra | Docker Compose locally; Railway/Fly.io + Vercel for deploy | Cheap/free tiers |

---

## 3. Repository Structure

```
AskDocs/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── core/
│   │   │   ├── config.py        # pydantic-settings, .env
│   │   │   ├── security.py      # hashing, JWT create/verify
│   │   │   └── deps.py          # get_db, get_current_user, require_role
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── api/v1/              # routers: auth, workspaces, documents, chat
│   │   ├── services/
│   │   │   ├── ingestion.py     # extract → chunk → embed pipeline
│   │   │   ├── retrieval.py     # vector search scoped by permissions
│   │   │   └── llm/
│   │   │       ├── base.py      # provider interface
│   │   │       └── openai_provider.py
│   │   └── storage/             # local disk now, S3-compatible later
│   ├── alembic/                 # migrations
│   ├── tests/
│   ├── .env.example
│   └── pyproject.toml
├── frontend/                    # added in Phase 2
├── docker-compose.yml           # postgres(+pgvector), backend
├── PLAN.md                      # this file
└── README.md
```

---

## 4. Data Model

```
users            id, email (unique), password_hash, name, created_at
workspaces       id, name, slug (unique), created_by → users, created_at
workspace_members workspace_id, user_id, role [admin|member|viewer], joined_at
                 (composite PK: workspace_id + user_id)
documents        id, workspace_id, uploader_id, title, file_type,
                 storage_key, status [pending|processing|ready|failed],
                 error_msg, size_bytes, created_at
chunks           id, document_id, workspace_id, ordinal, content,
                 token_count, embedding vector(1536), metadata jsonb
conversations    id, workspace_id, user_id, title, created_at
messages         id, conversation_id, role [user|assistant], content,
                 citations jsonb, created_at
```

**Multi-tenancy rule:** every query is filtered by `workspace_id`, and every
request verifies the user's membership + role before touching data. No exceptions.

---

## 5. API Surface (v1)

```
AUTH
POST   /api/v1/auth/register        {email, password, name}
POST   /api/v1/auth/login           → {access_token, refresh_token}
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

WORKSPACES
POST   /api/v1/workspaces                        {name}
GET    /api/v1/workspaces                        (my workspaces)
GET    /api/v1/workspaces/{id}
POST   /api/v1/workspaces/{id}/members           {email, role}      admin only
PATCH  /api/v1/workspaces/{id}/members/{uid}     {role}             admin only
DELETE /api/v1/workspaces/{id}/members/{uid}                        admin only

DOCUMENTS
POST   /api/v1/workspaces/{id}/documents         multipart upload   member+
GET    /api/v1/workspaces/{id}/documents         list w/ status
DELETE /api/v1/workspaces/{id}/documents/{did}                      admin

CHAT
POST   /api/v1/workspaces/{id}/conversations                {title?}
GET    /api/v1/workspaces/{id}/conversations
GET    /api/v1/conversations/{id}/messages
POST   /api/v1/conversations/{id}/messages       {content} → SSE stream
```

---

## 6. Execution Phases (build order)

Build order matches your preference: **base backend → frontend v1 → advanced backend → polish → deploy.**
Each phase ends with something runnable/demoable.

---

### Phase 0 — Foundation (≈ 2–3 days)
**Goal:** skeleton runs end-to-end before any features.

- [ ] Init repo (git init, README, .gitignore)
- [ ] `docker-compose.yml`: Postgres 16 with pgvector extension + volume
- [ ] Backend scaffold: FastAPI app, `/health` endpoint, pydantic-settings config, `.env.example`
- [ ] SQLAlchemy setup + Alembic initialized, first migration (empty)
- [ ] pytest wired up with one passing test
- [ ] Verify: `docker compose up` + `uvicorn app.main:app` → Swagger opens, `/health` green

**Definition of done:** fresh clone → two commands → running API with DB connected.

---

### Phase 1 — Base Backend: the minimum the idea needs (≈ 2 weeks)
**Goal:** everything works through Swagger/curl — no UI yet.

**Step 1.1 — Auth (3–4 days)**
- [ ] users table migration
- [ ] register / login / refresh / me endpoints
- [ ] bcrypt hashing, access token (15 min) + refresh token (7 days)
- [ ] `get_current_user` dependency

**Step 1.2 — Workspaces & RBAC (3 days)**
- [ ] workspaces + workspace_members migrations
- [ ] CRUD endpoints; creator becomes admin
- [ ] invite-by-email members, change/remove members
- [ ] `require_membership(role)` dependency — permission checks centralized here

**Step 1.3 — Document upload & ingestion (4–5 days)**
- [ ] documents table; multipart upload endpoint (validate type + size ≤ 20 MB)
- [ ] local-disk storage service behind an interface
- [ ] Ingestion pipeline (BackgroundTask): extract text (pypdf / python-docx) →
      token-based chunking (~500 tokens, 50 overlap) → OpenAI embeddings → insert chunks
- [ ] status transitions pending → processing → ready | failed (+ error message)
- [ ] list/delete endpoints

**Step 1.4 — Basic Q&A, non-streaming (2–3 days)**
- [ ] conversations + messages tables
- [ ] query endpoint: embed question → top-k pgvector similarity (filtered by
      workspace_id!) → build prompt with retrieved chunks → LLM answer + citations array
- [ ] persist both messages with citations JSON

**Definition of done:** register → create workspace → upload PDF → poll until ready →
ask question → correct answer with citation to that PDF, all via Swagger.

**Checkpoint commit tag: `v0.1-backend-mvp`**

---

### Phase 2 — Frontend v1: see it working (≈ 2 weeks)
**Goal:** full product demo without touching curl.

- [ ] Next.js 15 + TS + Tailwind + shadcn/ui scaffold; API client with typed fetch wrapper
- [ ] Auth pages (login/register); store access token in memory, refresh silently;
      protected routes via middleware/layout guard
- [ ] App shell: sidebar = workspace switcher + nav (Documents, Chat, Members)
- [ ] Documents page: drag-drop upload, list with live status badges (poll while processing)
- [ ] Chat page: conversation list, message thread, input box, render citations as
      clickable chips (click → modal with source snippet from the chunk)
- [ ] Members page: invite email, change role, remove (admin-only controls hidden otherwise)
- [ ] Loading / empty / error states on every screen (interviewers notice this)

**Definition of done:** someone else can register, upload, and chat without instructions.
Record a 60-second demo video at the end of this phase.

**Checkpoint commit tag: `v0.2-fullstack-mvp`**

---

### Phase 3 — Advanced Backend: make it feel production-grade (≈ 2 weeks)
**Goal:** depth that separates this from toy projects.

- [ ] SSE streaming answers (token-by-token); save final message server-side
- [ ] Conversation memory: last N turns included in prompt context
- [ ] Retrieval upgrades: hybrid search (pgvector + Postgres full-text/BM25 blend),
      optional cross-encoder reranking of top-k
- [ ] Move ingestion out of BackgroundTasks into a real worker (ARQ or Celery + Redis);
      retry with exponential backoff on transient failures
- [ ] Rate limiting per user/workspace (slowapi) + monthly quota tracking table
- [ ] Prompt-injection defenses + answer refusal behavior when retrieval confidence is low
- [ ] Integration tests: mocked LLM provider; test permission scoping exhaustively
      (viewer can't upload, cross-workspace isolation, etc.)

**Definition of done:** load test shows stable streaming under concurrency;
all permission tests green; worker survives a restart mid-job (retries).

**Checkpoint tag: `v0.3-production-core`**

---

### Phase 4 — Frontend v2: polish + differentiators (≈ 1 week)
- [ ] Streaming text rendering in chat with stop-generation button
- [ ] Search across conversations + "sources used" audit view
- [ ] Analytics cards: queries/day, top documents cited, unanswered questions
      (= content gaps — great talking point)
- [ ] Dark mode, responsive layout, keyboard shortcuts (/ to focus chat)

---

### Phase 5 — Hardening & Deployment (≈ 1 week)
- [ ] Structured logging (request IDs), error monitoring hook (Sentry free tier)
- [ ] GitHub Actions CI: lint (ruff), type-check (mypy), tests on every push
- [ ] Production deploy: backend + worker → Railway or Fly.io; Postgres+pgvector → Neon;
      frontend → Vercel; CORS + env config locked down
- [ ] Seed script for demo data; write README with architecture diagram + GIFs

**Definition of done:** public URL anyone can try; CI green; README explains design decisions.

---

### Phase 6 — Stretch (ongoing, pick 1–2)
- [ ] Slack bot: ask questions from a channel
- [ ] Feedback loop: 👍/👎 stored per message → eval set → measure recall@k changes
- [ ] Multi-format ingest: Notion export, website URL crawler
- [ ] S3 storage adapter switch

---

## 7. Timeline Summary

| Phase | Duration | Milestone demo |
|---|---|---|
| 0 — Foundation | ~3 days | Skeleton runs |
| 1 — Base Backend | ~2 weeks | Q&A works via Swagger |
| 2 — Frontend v1 | ~2 weeks | Full product demo 🎥 |
| 3 — Advanced Backend | ~2 weeks | Streaming, workers, rate limits |
| 4 — Frontend v2 | ~1 week | Polished UX |
| 5 — Deploy & Harden | ~1 week | Live URL |
| 6 — Stretch | ongoing | Differentiators |

**Total ≈ 8 weeks part-time.** Phases 0–2 alone give you a complete resume project.

---

## 8. Resume Talking Points (why each phase matters)

- **Phase 1:** multi-tenancy + RBAC done correctly → "I designed row-level tenant isolation"
- **Phase 1:** ingestion pipeline with status machine → async processing experience
- **Phase 3:** RAG with hybrid search + reranking → current, in-demand AI skill
- **Phase 3:** rate limiting + quotas on paid LLM calls → cost-awareness companies care about
- **Phase 5:** CI + deployed URL → you ship, not just code locally

---

## 9. Ground Rules During Build

1. Every feature = branch → PR-style commit → merge to main (clean git history for recruiters)
2. No secrets in code — `.env` only, `.env.example` committed
3. Permission checks live ONLY in dependencies/middleware, never inline in route bodies
4. LLM calls always go through `services/llm/base.py` interface (mockable, swappable)
5. If a step takes > 2 days, split it further before starting
