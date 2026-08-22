import asyncio
import os
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import psycopg
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

os.environ.setdefault("JWT_SECRET", "test-secret")

from app.core.deps import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.base import Base  # noqa: E402

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://askdocs:askdocs@localhost:5432/askdocs_test",
)


def _connect(dbname: str):
    return psycopg.connect(
        host="localhost",
        port=5432,
        dbname=dbname,
        user="askdocs",
        password="askdocs",
        autocommit=True,
        connect_timeout=5,
    )


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def engine():
    def _ensure_db():
        with _connect("postgres") as conn:
            cur = conn.execute(
                "SELECT 1 FROM pg_database WHERE datname = 'askdocs_test'"
            )
            if cur.fetchone() is None:
                conn.execute("CREATE DATABASE askdocs_test")

    def _create_ext():
        with _connect("askdocs_test") as conn:
            conn.execute("CREATE EXTENSION IF NOT EXISTS vector")

    try:
        await asyncio.to_thread(_ensure_db)
        await asyncio.to_thread(_create_ext)
    except Exception as exc:  # noqa: BLE001
        pytest.exit(f"Cannot reach test Postgres on localhost:5432: {exc}")

    eng = create_async_engine(TEST_DB_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest.fixture
async def client(engine):
    from httpx import ASGITransport, AsyncClient

    maker = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
