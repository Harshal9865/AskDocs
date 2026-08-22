# AskDocs — Team Knowledge Base with AI Q&A

Private workspace where teams upload documents (PDF, DOCX, MD/TXT) and ask questions.
The AI answers with citations linking back to the exact source document.

## Stack

- **Backend:** Python 3.11 + FastAPI, SQLAlchemy 2.0 + Alembic
- **DB:** PostgreSQL 16 + pgvector (Docker)
- **Auth:** JWT (access + refresh), bcrypt
- **AI:** Google Gemini (free tier) — embeddings + chat, behind a swappable provider interface

## Quick start

```bash
# 1. Start Postgres with pgvector
docker compose up -d

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -e ".[dev]"
copy .env.example .env          # then paste your GEMINI_API_KEY into .env

# 3. Migrate + run
alembic upgrade head
uvicorn app.main:app --reload   # Swagger: http://localhost:8000/docs

# 4. Tests
pytest
```

## Docs

See `PLAN.md` for architecture and `TASKS.md` for the task breakdown.
