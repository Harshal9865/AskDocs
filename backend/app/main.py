import asyncio
import sys
from contextlib import asynccontextmanager

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.services.websocket import ws_app

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema has subscription columns & tables automatically
    try:
        from app.core.deps import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT NULL;"))
            await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) DEFAULT 'active';"))
            await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;"))
            await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS card_brand VARCHAR(50) DEFAULT NULL;"))
            await session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(10) DEFAULT NULL;"))
            await session.execute(text("""
            CREATE TABLE IF NOT EXISTS invoices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                amount_cents INTEGER NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'USD',
                plan VARCHAR(30) NOT NULL,
                billing_interval VARCHAR(20) NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'paid',
                payment_method VARCHAR(50) NOT NULL DEFAULT 'credit_card',
                card_brand VARCHAR(50),
                card_last4 VARCHAR(10),
                paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """))
            await session.execute(text("""
            CREATE TABLE IF NOT EXISTS contract_obligations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
                document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                title VARCHAR(300) NOT NULL,
                party_name VARCHAR(200),
                obligation_type VARCHAR(50) NOT NULL DEFAULT 'renewal',
                due_date TIMESTAMP WITH TIME ZONE,
                notice_days INTEGER DEFAULT 30,
                amount VARCHAR(100),
                status VARCHAR(30) NOT NULL DEFAULT 'active',
                summary TEXT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS ix_contract_obligations_workspace_id ON contract_obligations (workspace_id);
            CREATE INDEX IF NOT EXISTS ix_contract_obligations_document_id ON contract_obligations (document_id);
            """))
            await session.commit()
    except Exception as e:
        import logging
        logging.warning("Database schema check notice: %s", e)

    # Startup — slack bot is optional; don't crash if token is missing
    try:
        from app.services.slack_bot import start_slack_bot
        await start_slack_bot()
    except Exception:
        pass
    yield


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

allow_all = "*" in settings.CORS_ORIGINS

# Build allowed origins list
if allow_all:
    _origins = ["*"]
else:
    _origins = list(settings.CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
# Mount WebSocket app
app.mount("/ws", ws_app)


@app.get("/health")
@app.get("/")
@app.head("/")
@app.head("/health")
async def health_check():
    """Health check endpoint for Render/uptime monitors."""
    db_status = "ok"
    try:
        from app.core.deps import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {e}"

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "database": db_status,
    }


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    """Return CORS-headed JSON on unhandled errors instead of a bare 500,
    so the browser surfaces the real status code rather than a CORS error."""
    import logging
    import traceback

    logging.error("Unhandled error on %s: %s\n%s", request.url.path, exc, traceback.format_exc())

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
            "Access-Control-Allow-Headers": "*",
        },
    )
