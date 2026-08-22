# AskDocs — Mini-Task Breakdown (Full Project)

> **How to use:** Send one task per message, e.g. `Do T0.1`.
> Each task ends with something verified. Check the box `[x]` when done.
> If a task fails, fix it before moving to the next — dependencies are ordered.

---

## Phase 0 — Foundation

### [ ] T0.1 — Repo Init
- git init, .gitignore (Python + Node + .env)
- README.md stub
- docker-compose.yml: Postgres 16 + pgvector (`pgvector/pgvector:pg16`), healthcheck, named volume
- **Verify:** `docker compose up -d` → DB healthy on localhost:5432

### [ ] T0.2 — Backend Scaffold
- `backend/pyproject.toml`: fastapi, uvicorn, sqlalchemy 2.0, alembic, psycopg[binary], pydantic-settings, passlib+bcrypt(4.0.1), pyjwt, python-multipart; dev: pytest, httpx
- `app/main.py`: FastAPI app, CORS for localhost:3000, `/health`
- `app/core/config.py`: Settings via pydantic-settings (.env)
- `.env.example`
- `tests/test_health.py`
- **Verify:** files exist, imports clean

### [ ] T0.3 — Setup & Verify
- `py -3.11 -m venv .venv`, install `-e ".[dev]"`
- Run pytest
- **Verify:** pytest green (health test passes)

### [ ] T0.4 — Alembic
- `alembic init alembic`; env.py reads DATABASE_URL from settings
- Empty initial revision
- **Verify:** `alembic revision` generates file; alembic history shows head

---

## Phase 1 — Base Backend (MVP)

### [ ] T1.1 — Users Table
- User model + migration (id, email unique, password_hash, name, created_at)
- **Verify:** `alembic upgrade head` creates table in Docker DB

### [ ] T1.2 — Auth Endpoints
- POST /auth/register, /auth/login, /auth/refresh; GET /auth/me
- bcrypt hashing; JWT access (15m) + refresh (7d); get_current_user dependency
- Tests: register→login→me happy path + duplicate email 409 + bad creds 401
- **Verify:** pytest green, endpoints in Swagger

### [ ] T1.3 — Workspaces CRUD
- Workspace + WorkspaceMember models/migrations (role enum admin/member/viewer)
- POST/GET workspaces; creator auto-admin
- **Verify:** create workspace → membership row role=admin

### [ ] T1.4 — RBAC & Members
- `require_membership(min_role)` dependency (404 for non-members)
- POST members (invite by email), PATCH role, DELETE member
- Last-admin guard
- Tests: viewer blocked from upload-route deps, cross-workspace 404, last-admin guard
- **Verify:** permission tests green

### [ ] T1.5 — Documents Upload
- Document model (status state machine pending→processing→ready|failed)
- POST multipart upload (.pdf/.docx/.md/.txt ≤20MB) + local storage service abstraction
- GET list (with status), DELETE (admin)
- **Verify:** upload via Swagger saves file + row status=pending

### [ ] T1.6 — Ingestion Pipeline
- services/ingestion.py: extract text (pypdf/python-docx) → chunk (~500 tok, 50 overlap) → embed (OpenAI) → insert chunks with vector(1536)
- BackgroundTask; status transitions + error_msg on failure
- Chunk model + pgvector migration + ivfflat index
- **Verify:** upload PDF → poll status → ready; chunk count > 0 with embeddings

### [ ] T1.7 — Conversations & Messages
- Models + migrations; conversation CRUD scoped to workspace
- GET messages per conversation
- **Verify:** create conversation, empty thread returned

### [ ] T1.8 — Basic RAG Query
- services/retrieval.py: embed question → top-k similarity filtered by workspace_id
- Refusal path when score below threshold or zero docs
- LLM provider interface (base.py + openai_provider.py); answer + citations JSON persisted
- **Verify:** ask question about uploaded PDF → correct cited answer via Swagger

**Tag: `v0.1-backend-mvp`**

---

## Phase 2 — Frontend v1

### [ ] T2.1 — Frontend Scaffold
- Next.js 15 + TS + Tailwind + shadcn/ui; typed API client (fetch wrapper w/ refresh logic)
- **Verify:** dev server runs, hits backend /health

### [ ] T2.2 — Auth Pages
- Login/register forms, token storage (memory + silent refresh), route guards
- **Verify:** register → redirected into app; refresh survives reload

### [ ] T2.3 — App Shell
- Sidebar: workspace switcher + nav (Chat/Documents/Members); empty-workspace → create modal
- **Verify:** navigate between sections, switch workspaces

### [ ] T2.4 — Documents Page
- Drag-drop upload, list with live status badges (poll while processing), delete (admin only)
- Error/failed states visible
- **Verify:** upload UI → badge flips pending→processing→ready

### [ ] T2.5 — Chat Page
- Conversation list, message thread, input; citations as clickable chips → modal with source snippet
- Guided nudge when workspace has no documents
- **Verify:** full loop: ask → streamed/cited answer → open citation

### [ ] T2.6 — Members Page + Polish
- Invite email, role change/remove (admin-only controls hidden otherwise)
- Loading/empty/error states on every screen
- **Verify:** invite second user (new account), roles enforced in UI

**Tag: `v0.2-fullstack-mvp` — record demo video**

---

## Phase 3 — Advanced Backend

### [ ] T3.1 — SSE Streaming Answers
- POST message streams tokens via SSE; persist final assistant message server-side
- **Verify:** curl shows incremental chunks

### [ ] T3.2 — Conversation Memory
- Last N turns included in prompt; per-conversation context works
- **Verify:** follow-up question ("and what about X?") resolves correctly

### [ ] T3.3 — Hybrid Search
- Postgres full-text (BM25-style) blended with vector score; configurable weights
- **Verify:** keyword-exact queries that vector search missed now retrieve correctly

### [ ] T3.4 — Reranking
- Rerank top-k (cross-encoder or LLM rerank) before prompt assembly
- **Verify:** retrieval quality spot-check on 5 known questions

### [ ] T3.5 — Worker Queue
- Move ingestion from BackgroundTasks to ARQ/Celery + Redis; retries with backoff; survives restart mid-job
- **Verify:** kill worker mid-ingest → restart → job completes

### [ ] T3.6 — Rate Limits & Quotas
- slowapi per-user limits; monthly query quota table per workspace → 429 with reset info
- **Verify:** exceed limit → correct 429 payload

### [ ] T3.7 — Prompt-Injection & Refusals
- Sanitize document content markers; refusal tuning when retrieval confidence low
- **Verify:** injected "ignore instructions" doc doesn't hijack answers

### [ ] T3.8 — Integration Test Suite
- Mocked LLM provider; exhaustive permission matrix tests
- **Verify:** full suite green in CI-ready state

**Tag: `v0.3-production-core`**

---

## Phase 4 — Frontend v2

### [ ] T4.1 — Streaming Chat UX
- Token-by-token render + stop button + retry failed turn
- **Verify:** smooth streaming, stop halts generation

### [ ] T4.2 — Search & Audit
- Search across conversations; "sources used" view per answer
- **Verify:** find old Q&A by keyword

### [ ] T4.3 — Analytics Cards
- Queries/day, top-cited documents, unanswered questions (content gaps)
- **Verify:** cards reflect real data after usage

### [ ] T4.4 — Dark Mode + Responsive
- Theme toggle, mobile layout (sidebar → drawer)
- **Verify:** usable at 375px width

### [ ] T4.5 — Accessibility Pass
- Keyboard shortcuts (/ focus chat), focus traps, aria-live for streaming, contrast AA
- **Verify:** keyboard-only walkthrough possible

---

## Phase 5 — Hardening & Deploy

### [ ] T5.1 — Observability
- Structured logging w/ request IDs; Sentry hook
- **Verify:** logs correlate one request end-to-end

### [ ] T5.2 — CI Pipeline
- GitHub Actions: ruff lint, mypy, pytest on every push
- **Verify:** green check on PR

### [ ] T5.3 — Backend Deploy
- Backend + worker → Railway/Fly.io; Postgres+pgvector → Neon
- **Verify:** public URL /health green

### [ ] T5.4 — Frontend Deploy
- Vercel deploy; CORS/env lockdown; end-to-end smoke test against prod
- **Verify:** register + chat works on live site

### [ ] T5.5 — Seed Data + README
- Demo-data seed script; README with architecture diagram + GIFs + design decisions
- **Verify:** fresh contributor can run locally from README alone

**Tag: `v1.0-live`**

---

## Phase 6 — Stretch (pick any)

### [ ] T6.1 — Slack Bot (ask from a channel)
### [ ] T6.2 — Feedback Loop (👍/👎 → eval set → recall@k tracking)
### [ ] T6.3 — More Ingest Sources (Notion export, URL crawler)
### [ ] T6.4 — S3 Storage Adapter (swap local disk via config)

---

## Progress Tracker

| Phase | Tasks | Done |
|---|---|---|
| 0 Foundation | T0.1–T0.4 | 0/4 |
| 1 Base Backend | T1.1–T1.8 | 0/8 |
| 2 Frontend v1 | T2.1–T2.6 | 0/6 |
| 3 Advanced Backend | T3.1–T3.8 | 0/8 |
| 4 Frontend v2 | T4.1–T4.5 | 0/5 |
| 5 Deploy | T5.1–T5.5 | 0/5 |
| 6 Stretch | T6.1–T6.4 | 0/4 |
| **Total** | | **0/40** |
